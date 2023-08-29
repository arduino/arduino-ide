import { ApplicationError } from '@theia/core/lib/common/application-error';
import { CommandService } from '@theia/core/lib/common/command';
import { Disposable } from '@theia/core/lib/common/disposable';
import { nls } from '@theia/core/lib/common/nls';
import type { Mutable } from '@theia/core/lib/common/types';
import { FileUri } from '@theia/core/lib/node/file-uri';
import { inject, injectable } from '@theia/core/shared/inversify';
import { relative } from 'node:path';
import {
  OutputMessage,
  Port,
  PortIdentifier,
  resolveDetectedPort,
  UploadResponse as ApiUploadResponse,
} from '../common/protocol';
import {
  CompilerWarnings,
  CompileSummary,
  CoreError,
  CoreService,
  isCompileSummary,
  isUploadResponse,
} from '../common/protocol/core-service';
import { ResponseService } from '../common/protocol/response-service';
import { firstToUpperCase, notEmpty } from '../common/utils';
import { BoardDiscovery } from './board-discovery';
import {
  BurnBootloaderRequest,
  BurnBootloaderResponse,
  CompileRequest,
  CompileResponse,
  Instance,
  Port as RpcPort,
  UploadRequest,
  UploadResponse,
  UploadUsingProgrammerRequest,
  UploadUsingProgrammerResponse,
} from './cli-api/';
import { tryParseError } from './cli-error-parser';
import { CoreClientAware, CoreClientProvider } from './core-client-provider';
import {
  ExecuteWithProgress,
  isUploadResponse as isGrpcUploadResponse,
  ProgressResponse,
} from './grpc-progressible';
import { MonitorManager } from './monitor-manager';
import { ServiceError } from './service-error';
import { AutoFlushingBuffer } from './utils/buffers';

namespace Uploadable {
  export type Request = UploadRequest | UploadUsingProgrammerRequest;
  export type Response = UploadResponse | UploadUsingProgrammerResponse;
}

type TaskProvider<RESP = Uploadable.Response> = (
  coreClient: CoreClientProvider.Client
) => () => AsyncIterable<RESP>;

type CompileSummaryFragment = Partial<Mutable<CompileSummary>>;

@injectable()
export class CoreServiceImpl extends CoreClientAware implements CoreService {
  @inject(ResponseService)
  private readonly responseService: ResponseService;
  @inject(MonitorManager)
  private readonly monitorManager: MonitorManager;
  @inject(CommandService)
  private readonly commandService: CommandService;
  @inject(BoardDiscovery)
  private readonly boardDiscovery: BoardDiscovery;

  async compile(options: CoreService.Options.Compile): Promise<void> {
    const coreClient = await this.coreClient;
    const { client, instance } = coreClient;
    const compileSummary = <CompileSummaryFragment>{};
    const progressHandler = this.createProgressHandler(options);
    const compileSummaryHandler = (response: CompileResponse) =>
      updateCompileSummary(compileSummary, response);
    const handler = this.createOnDataHandler<CompileResponse>(
      progressHandler,
      compileSummaryHandler
    );
    const req = this.compileRequest(options, instance);
    try {
      for await (const resp of client.compile(req)) {
        handler.onData(resp);
      }
    } catch (err) {
      if (!ServiceError.is(err)) {
        console.error(
          'Unexpected error occurred while compiling the sketch.',
          err
        );
        throw err;
      }
      const compilerErrors = tryParseError({
        content: handler.content,
        sketch: options.sketch,
      });
      const message = nls.localize(
        'arduino/compile/error',
        'Compilation error: {0}',
        compilerErrors
          .map(({ message }) => message)
          .filter(notEmpty)
          .shift() ?? err.details
      );
      this.sendResponse(
        err.details + '\n\n' + message,
        OutputMessage.Severity.Error
      );
      throw CoreError.VerifyFailed(message, compilerErrors);
    } finally {
      handler.dispose();
      if (!isCompileSummary(compileSummary)) {
        console.error(
          `Have not received the full compile summary from the CLI while running the compilation. ${JSON.stringify(
            compileSummary
          )}`
        );
      } else {
        this.fireBuildDidComplete(compileSummary);
      }
    }
  }

  // This executes on the frontend, the VS Code extension receives it, and sends an `ino/buildDidComplete` notification to the language server.
  private fireBuildDidComplete(compileSummary: CompileSummary): void {
    const params = {
      ...compileSummary,
    };
    console.info(
      `Executing 'arduino.languageserver.notifyBuildDidComplete' with ${JSON.stringify(
        params.buildOutputUri
      )}`
    );
    this.commandService
      .executeCommand('arduino.languageserver.notifyBuildDidComplete', params)
      .catch((err) =>
        console.error(
          `Unexpected error when firing event on build did complete. ${JSON.stringify(
            params.buildOutputUri
          )}`,
          err
        )
      );
  }

  private compileRequest(
    options: CoreService.Options.Compile & {
      exportBinaries?: boolean;
      compilerWarnings?: CompilerWarnings;
    },
    instance: Instance
  ): CompileRequest {
    const {
      sketch,
      fqbn,
      compilerWarnings,
      optimizeForDebug,
      verbose,
      exportBinaries,
    } = options;
    const sketchUri = sketch.uri;
    const sketchPath = FileUri.fsPath(sketchUri);
    const req = CompileRequest.fromPartial({
      instance,
      sketchPath,
      optimizeForDebug,
      preprocess: false,
      verbose,
      quiet: false,
    });
    if (fqbn) {
      req.fqbn = fqbn;
    }
    if (compilerWarnings) {
      req.warnings = compilerWarnings.toLocaleLowerCase();
    }
    if (typeof exportBinaries) {
      req.exportBinaries = Boolean(exportBinaries);
    }
    return this.mergeSourceOverrides(req, options);
  }

  async upload(
    options: CoreService.Options.Upload
  ): Promise<ApiUploadResponse> {
    const { usingProgrammer } = options;
    const taskProvider: TaskProvider = (
      coreClient: CoreClientProvider.Client
    ) => {
      const { client, instance } = coreClient;
      const req = this.uploadRequest({ ...options, instance });
      if (usingProgrammer) {
        return () => client.uploadUsingProgrammer(req);
      }
      return () => client.upload(req);
    };
    const errorCtor = usingProgrammer
      ? CoreError.UploadUsingProgrammerFailed
      : CoreError.UploadFailed;

    const dataHandlers: ((resp: StreamingResponse) => void)[] = [];
    const portBeforeUpload = options.port;
    const uploadResponseFragment: Mutable<Partial<ApiUploadResponse>> = {
      portAfterUpload: options.port, // assume no port changes during the upload
    };
    // When uploading using a programmer, the port won't change. Otherwise, IDE2 must track it.
    if (!usingProgrammer) {
      dataHandlers.push((resp) => {
        if (isGrpcUploadResponse(resp)) {
          if (resp.message?.$case === 'result') {
            uploadResponseFragment.portAfterUpload =
              resp.message.result.updatedUploadPort;
            console.info(
              `Received port after upload [${
                options.port ? Port.keyOf(options.port) : ''
              }, ${options.fqbn}, ${
                options.sketch.name
              }]. Before port: ${JSON.stringify(
                portBeforeUpload
              )}, after port: ${JSON.stringify(
                uploadResponseFragment.portAfterUpload
              )}`
            );
          }
        }
      });
    }
    try {
      await this.doUpload(
        options,
        taskProvider,
        errorCtor,
        `upload${usingProgrammer ? ' using programmer' : ''}`
      );
    } finally {
      await this.notifyUploadDidFinish({
        ...options,
        afterPort: uploadResponseFragment.portAfterUpload,
      });
    }
    if (!isUploadResponse(uploadResponseFragment)) {
      throw new Error(
        `Could not detect the port after the upload. Upload options were: ${JSON.stringify(
          options
        )}, upload response was: ${JSON.stringify(uploadResponseFragment)}`
      );
    }
    return uploadResponseFragment;
  }

  protected async doUpload(
    options: CoreService.Options.Upload,
    taskProvider: TaskProvider,
    errorCtor: ApplicationError.Constructor<number, CoreError.ErrorLocation[]>,
    taskName: string,
    ...dataHandlers: ((resp: StreamingResponse) => void)[]
  ): Promise<void> {
    const coreClient = await this.coreClient;
    const { client, instance } = coreClient;
    const progressHandler = this.createProgressHandler(options);
    const handler = this.createOnDataHandler(progressHandler, ...dataHandlers);
    const task = taskProvider({ client, instance });
    await this.notifyUploadWillStart(options);
    try {
      for await (const resp of task()) {
        handler.onData(resp);
      }
    } catch (error) {
      if (!ServiceError.is(error)) {
        console.error(`Unexpected error occurred while ${taskName}.`, error);
        throw error;
      }
      const message = nls.localize(
        'arduino/upload/error',
        '{0} error: {1}',
        firstToUpperCase(taskName),
        error.details
      );
      this.sendResponse(error.details, OutputMessage.Severity.Error);
      throw errorCtor(
        message,
        tryParseError({
          content: handler.content,
          sketch: options.sketch,
        })
      );
    } finally {
      handler.dispose();
    }
  }

  private uploadRequest<REQ extends Uploadable.Request>(
    options: CoreService.Options.Upload & { instance: Instance }
  ): Partial<REQ> {
    const { instance, sketch, fqbn, port, programmer, verbose, verify } =
      options;
    const sketchPath = FileUri.fsPath(sketch.uri);
    const req = <Partial<REQ>>{
      instance,
      sketchPath,
      port: this.createPort(port),
      verbose,
      verify,
    };
    if (fqbn) {
      req.fqbn = fqbn;
    }
    if (programmer) {
      req.programmer = programmer.id;
    }
    options.userFields.forEach(({ name, value }) => {
      if (!req.userFields) {
        req.userFields = {};
      }
      req.userFields[name] = value;
    });
    return req;
  }

  async burnBootloader(options: CoreService.Options.Bootloader): Promise<void> {
    const coreClient = await this.coreClient;
    const { client, instance } = coreClient;
    const progressHandler = this.createProgressHandler(options);
    const handler = this.createOnDataHandler(progressHandler);
    const req = this.burnBootloaderRequest(options, instance);
    await this.notifyUploadWillStart(options);
    try {
      for await (const resp of client.burnBootloader(req)) {
        handler.onData(resp);
      }
    } catch (err) {
      if (!ServiceError.is(err)) {
        console.error(
          'Unexpected error occurred while burning the bootloader.',
          err
        );
        throw err;
      }
      this.sendResponse(err.details, OutputMessage.Severity.Error);
      throw CoreError.BurnBootloaderFailed(
        nls.localize(
          'arduino/burnBootloader/error',
          'Error while burning the bootloader: {0}',
          err.details
        ),
        tryParseError({ content: handler.content })
      );
    } finally {
      handler.dispose();
      await this.notifyUploadDidFinish({ ...options, afterPort: options.port });
    }
  }

  private burnBootloaderRequest(
    options: CoreService.Options.Bootloader,
    instance: Instance
  ): Partial<BurnBootloaderRequest> {
    const { fqbn, port, programmer, verify, verbose } = options;
    const req: Partial<BurnBootloaderRequest> = {
      instance,
      port: this.createPort(port),
      verify,
      verbose,
    };
    if (fqbn) {
      req.fqbn = fqbn;
    }
    if (programmer) {
      req.programmer = programmer.id;
    }
    return req;
  }

  private createProgressHandler<R extends ProgressResponse>(
    options: CoreService.Options.Base
  ): (response: R) => void {
    // If client did not provide the progress ID, do nothing.
    if (!options.progressId) {
      return () => {
        /* NOOP */
      };
    }
    return ExecuteWithProgress.createDataCallback<R>({
      progressId: options.progressId,
      responseService: this.responseService,
    });
  }

  private createOnDataHandler<R extends StreamingResponse>(
    // TODO: why not creating a composite handler with progress, `build_path`, and out/err stream handlers?
    ...handlers: ((response: R) => void)[]
  ): Disposable & {
    content: Buffer[];
    onData: (response: R) => void;
  } {
    const content: Buffer[] = [];
    const buffer = new AutoFlushingBuffer((chunks) => {
      chunks.forEach(([severity, chunk]) => this.sendResponse(chunk, severity));
    });
    const onData = StreamingResponse.createOnDataHandler({
      content,
      onData: (out, err) => {
        if (out) {
          buffer.addChunk(out);
        }
        if (err) {
          buffer.addChunk(err, OutputMessage.Severity.Error);
        }
      },
      handlers,
    });
    return {
      dispose: () => buffer.dispose(),
      content,
      onData,
    };
  }

  private sendResponse(
    chunk: string,
    severity: OutputMessage.Severity = OutputMessage.Severity.Info
  ): void {
    this.responseService.appendToOutput({ chunk, severity });
  }

  private async notifyUploadWillStart({
    fqbn,
    port,
  }: {
    fqbn?: string | undefined;
    port?: PortIdentifier;
  }): Promise<void> {
    if (fqbn && port) {
      return this.monitorManager.notifyUploadStarted(fqbn, port);
    }
  }

  private async notifyUploadDidFinish({
    fqbn,
    port,
    afterPort,
  }: {
    fqbn?: string | undefined;
    port?: PortIdentifier;
    afterPort?: PortIdentifier;
  }): Promise<void> {
    if (fqbn && port && afterPort) {
      return this.monitorManager.notifyUploadFinished(fqbn, port, afterPort);
    }
  }

  private mergeSourceOverrides(
    req: CompileRequest,
    options: CoreService.Options.Compile
  ): CompileRequest {
    const sketchPath = FileUri.fsPath(options.sketch.uri);
    for (const uri of Object.keys(options.sourceOverride)) {
      const content = options.sourceOverride[uri];
      if (content) {
        const relativePath = relative(sketchPath, FileUri.fsPath(uri));
        if (!req.sourceOverride) {
          req.sourceOverride = {};
        }
        req.sourceOverride[relativePath] = content;
      }
    }
    return req;
  }

  private createPort(
    port: PortIdentifier | undefined,
    resolve: (port: PortIdentifier) => Port | undefined = (port) =>
      resolveDetectedPort(port, this.boardDiscovery.detectedPorts)
  ): RpcPort | undefined {
    if (!port) {
      return undefined;
    }
    const resolvedPort = resolve(port);
    const partial: Partial<RpcPort> = {
      protocol: port.protocol,
      address: port.address,
    };
    if (resolvedPort) {
      partial.label = resolvedPort.addressLabel;
      partial.protocolLabel = resolvedPort.protocolLabel;
      if (resolvedPort.hardwareId !== undefined) {
        partial.hardwareId = resolvedPort.hardwareId;
      }
      if (resolvedPort.properties) {
        for (const [key, value] of Object.entries(resolvedPort.properties)) {
          if (!partial.properties) {
            partial.properties = {};
          }
          partial.properties[key] = value;
        }
      }
    }
    return RpcPort.fromPartial(partial);
  }
}
type StreamingResponse =
  | CompileResponse
  | UploadResponse
  | UploadUsingProgrammerResponse
  | BurnBootloaderResponse;
namespace StreamingResponse {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function createOnDataHandler<R extends StreamingResponse>(
    options: StreamingResponse.Options<R>
  ): (response: R) => void {
    return (response: R) => {
      let out: Uint8Array | undefined = undefined;
      let err: Uint8Array | undefined = undefined;
      if (isGrpcUploadResponse(response)) {
        if (response.message?.$case === 'outStream') {
          out = response.message.outStream;
        }
        if (response.message?.$case === 'errStream') {
          err = response.message.errStream;
        }
      } else {
        out = response.outStream;
        err = response.errStream;
      }
      if (out?.length) {
        options.content.push(out);
      }
      if (err?.length) {
        options.content.push(err);
      }
      options.onData(out, err);
      options.handlers?.forEach((handler) => handler(response));
    };
  }
  export interface Options<R extends StreamingResponse> {
    readonly content: Uint8Array[];
    readonly onData: (
      out: Uint8Array | undefined,
      err: Uint8Array | undefined
    ) => void;
    /**
     * Additional request handlers.
     * For example, when tracing the progress of a task and
     * collecting the output (out, err) and the `build_path` from the CLI.
     */
    readonly handlers?: ((response: R) => void)[];
  }
}

function updateCompileSummary(
  compileSummary: CompileSummaryFragment,
  response: CompileResponse
): CompileSummaryFragment {
  const { buildPath } = response;
  if (buildPath) {
    compileSummary.buildPath = buildPath;
    compileSummary.buildOutputUri = FileUri.create(buildPath).toString();
  }
  const { executableSectionsSize } = response;
  if (executableSectionsSize) {
    compileSummary.executableSectionsSize = executableSectionsSize.slice();
  }
  const { usedLibraries } = response;
  if (usedLibraries) {
    compileSummary.usedLibraries = usedLibraries.slice();
  }
  const { boardPlatform } = response;
  if (boardPlatform) {
    compileSummary.buildPlatform = boardPlatform;
  }
  const { buildPlatform } = response;
  if (buildPlatform) {
    compileSummary.buildPlatform = buildPlatform;
  }
  const { buildProperties } = response;
  if (buildProperties) {
    compileSummary.buildProperties = buildProperties.slice();
  }
  return compileSummary;
}
