import { FileUri } from '@theia/core/lib/node/file-uri';
import { inject, injectable } from '@theia/core/shared/inversify';
import { relative } from 'path';
import * as jspb from 'google-protobuf';
import { BoolValue } from 'google-protobuf/google/protobuf/wrappers_pb';
import { ClientReadableStream } from '@grpc/grpc-js';
import {
  CompilerWarnings,
  CoreService,
  CoreError,
} from '../common/protocol/core-service';
import {
  CompileRequest,
  CompileResponse,
} from './cli-protocol/cc/arduino/cli/commands/v1/compile_pb';
import { CoreClientAware } from './core-client-provider';
import {
  BurnBootloaderRequest,
  BurnBootloaderResponse,
  UploadRequest,
  UploadResponse,
  UploadUsingProgrammerRequest,
  UploadUsingProgrammerResponse,
} from './cli-protocol/cc/arduino/cli/commands/v1/upload_pb';
import { ResponseService } from '../common/protocol/response-service';
import { Board, OutputMessage, Port, Status } from '../common/protocol';
import { ArduinoCoreServiceClient } from './cli-protocol/cc/arduino/cli/commands/v1/commands_grpc_pb';
import { Port as GrpcPort } from './cli-protocol/cc/arduino/cli/commands/v1/port_pb';
import { ApplicationError, CommandService, Disposable, nls } from '@theia/core';
import { MonitorManager } from './monitor-manager';
import { AutoFlushingBuffer } from './utils/buffers';
import { tryParseError } from './cli-error-parser';
import { Instance } from './cli-protocol/cc/arduino/cli/commands/v1/common_pb';
import { firstToUpperCase, notEmpty } from '../common/utils';
import { ServiceError } from './service-error';
import { ExecuteWithProgress, ProgressResponse } from './grpc-progressible';

namespace Uploadable {
  export type Request = UploadRequest | UploadUsingProgrammerRequest;
  export type Response = UploadResponse | UploadUsingProgrammerResponse;
}

@injectable()
export class CoreServiceImpl extends CoreClientAware implements CoreService {
  @inject(ResponseService)
  private readonly responseService: ResponseService;

  @inject(MonitorManager)
  private readonly monitorManager: MonitorManager;

  @inject(CommandService)
  private readonly commandService: CommandService;

  async compile(options: CoreService.Options.Compile): Promise<void> {
    const coreClient = await this.coreClient;
    const { client, instance } = coreClient;
    let buildPath: string | undefined = undefined;
    const progressHandler = this.createProgressHandler(options);
    const buildPathHandler = (response: CompileResponse) => {
      const currentBuildPath = response.getBuildPath();
      if (currentBuildPath) {
        buildPath = currentBuildPath;
      } else {
        if (!!buildPath && currentBuildPath !== buildPath) {
          throw new Error(
            `The CLI has already provided a build path: <${buildPath}>, and IDE2 received a new build path value: <${currentBuildPath}>.`
          );
        }
      }
    };
    const handler = this.createOnDataHandler<CompileResponse>(
      progressHandler,
      buildPathHandler
    );
    const request = this.compileRequest(options, instance);
    return new Promise<void>((resolve, reject) => {
      client
        .compile(request)
        .on('data', handler.onData)
        .on('error', (error) => {
          if (!ServiceError.is(error)) {
            console.error(
              'Unexpected error occurred while compiling the sketch.',
              error
            );
            reject(error);
          } else {
            const compilerErrors = tryParseError({
              content: handler.stderr,
              sketch: options.sketch,
            });
            const message = nls.localize(
              'arduino/compile/error',
              'Compilation error: {0}',
              compilerErrors
                .map(({ message }) => message)
                .filter(notEmpty)
                .shift() ?? error.details
            );
            this.sendResponse(
              error.details + '\n\n' + message,
              OutputMessage.Severity.Error
            );
            reject(CoreError.VerifyFailed(message, compilerErrors));
          }
        })
        .on('end', resolve);
    }).finally(() => {
      handler.dispose();
      if (!buildPath) {
        console.error(
          `Have not received the build path from the CLI while running the compilation.`
        );
      } else {
        this.fireBuildDidComplete(FileUri.create(buildPath).toString());
      }
    });
  }

  // This executes on the frontend, the VS Code extension receives it, and sends an `ino/buildDidComplete` notification to the language server.
  private fireBuildDidComplete(buildOutputUri: string): void {
    const params = {
      buildOutputUri,
    };
    console.info(
      `Executing 'arduino.languageserver.notifyBuildDidComplete' with ${JSON.stringify(
        params
      )}`
    );
    this.commandService
      .executeCommand('arduino.languageserver.notifyBuildDidComplete', params)
      .catch((err) =>
        console.error(
          `Unexpected error when firing event on build did complete. ${buildOutputUri}`,
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
    const { sketch, fqbn, compilerWarnings } = options;
    const sketchUri = sketch.uri;
    const sketchPath = FileUri.fsPath(sketchUri);
    const request = new CompileRequest();
    request.setInstance(instance);
    request.setSketchPath(sketchPath);
    if (fqbn) {
      request.setFqbn(fqbn);
    }
    if (compilerWarnings) {
      request.setWarnings(compilerWarnings.toLowerCase());
    }
    request.setOptimizeForDebug(options.optimizeForDebug);
    request.setPreprocess(false);
    request.setVerbose(options.verbose);
    request.setQuiet(false);
    if (typeof options.exportBinaries === 'boolean') {
      const exportBinaries = new BoolValue();
      exportBinaries.setValue(options.exportBinaries);
      request.setExportBinaries(exportBinaries);
    }
    this.mergeSourceOverrides(request, options);
    return request;
  }

  upload(options: CoreService.Options.Upload): Promise<void> {
    const { usingProgrammer } = options;
    return this.doUpload(
      options,
      usingProgrammer
        ? new UploadUsingProgrammerRequest()
        : new UploadRequest(),
      (client) =>
        (usingProgrammer ? client.uploadUsingProgrammer : client.upload).bind(
          client
        ),
      usingProgrammer
        ? CoreError.UploadUsingProgrammerFailed
        : CoreError.UploadFailed,
      `upload${usingProgrammer ? ' using programmer' : ''}`
    );
  }

  protected async doUpload<
    REQ extends Uploadable.Request,
    RESP extends Uploadable.Response
  >(
    options: CoreService.Options.Upload,
    request: REQ,
    responseFactory: (
      client: ArduinoCoreServiceClient
    ) => (request: REQ) => ClientReadableStream<RESP>,
    errorCtor: ApplicationError.Constructor<number, CoreError.ErrorLocation[]>,
    task: string
  ): Promise<void> {
    const coreClient = await this.coreClient;
    const { client, instance } = coreClient;
    const progressHandler = this.createProgressHandler(options);
    const handler = this.createOnDataHandler(progressHandler);
    const grpcCall = responseFactory(client);
    return this.notifyUploadWillStart(options).then(() =>
      new Promise<void>((resolve, reject) => {
        grpcCall(this.initUploadRequest(request, options, instance))
          .on('data', handler.onData)
          .on('error', (error) => {
            if (!ServiceError.is(error)) {
              console.error(`Unexpected error occurred while ${task}.`, error);
              reject(error);
            } else {
              const message = nls.localize(
                'arduino/upload/error',
                '{0} error: {1}',
                firstToUpperCase(task),
                error.details
              );
              this.sendResponse(error.details, OutputMessage.Severity.Error);
              reject(
                errorCtor(
                  message,
                  tryParseError({
                    content: handler.stderr,
                    sketch: options.sketch,
                  })
                )
              );
            }
          })
          .on('end', resolve);
      }).finally(async () => {
        handler.dispose();
        await this.notifyUploadDidFinish(options);
      })
    );
  }

  private initUploadRequest<REQ extends Uploadable.Request>(
    request: REQ,
    options: CoreService.Options.Upload,
    instance: Instance
  ): REQ {
    const { sketch, fqbn, port, programmer } = options;
    const sketchPath = FileUri.fsPath(sketch.uri);
    request.setInstance(instance);
    request.setSketchPath(sketchPath);
    if (fqbn) {
      request.setFqbn(fqbn);
    }
    request.setPort(this.createPort(port));
    if (programmer) {
      request.setProgrammer(programmer.id);
    }
    request.setVerbose(options.verbose);
    request.setVerify(options.verify);

    options.userFields.forEach((e) => {
      request.getUserFieldsMap().set(e.name, e.value);
    });
    return request;
  }

  async burnBootloader(options: CoreService.Options.Bootloader): Promise<void> {
    const coreClient = await this.coreClient;
    const { client, instance } = coreClient;
    const progressHandler = this.createProgressHandler(options);
    const handler = this.createOnDataHandler(progressHandler);
    const request = this.burnBootloaderRequest(options, instance);
    return this.notifyUploadWillStart(options).then(() =>
      new Promise<void>((resolve, reject) => {
        client
          .burnBootloader(request)
          .on('data', handler.onData)
          .on('error', (error) => {
            if (!ServiceError.is(error)) {
              console.error(
                'Unexpected error occurred while burning the bootloader.',
                error
              );
              reject(error);
            } else {
              this.sendResponse(error.details, OutputMessage.Severity.Error);
              reject(
                CoreError.BurnBootloaderFailed(
                  nls.localize(
                    'arduino/burnBootloader/error',
                    'Error while burning the bootloader: {0}',
                    error.details
                  ),
                  tryParseError({ content: handler.stderr })
                )
              );
            }
          })
          .on('end', resolve);
      }).finally(async () => {
        handler.dispose();
        await this.notifyUploadDidFinish(options);
      })
    );
  }

  private burnBootloaderRequest(
    options: CoreService.Options.Bootloader,
    instance: Instance
  ): BurnBootloaderRequest {
    const { fqbn, port, programmer } = options;
    const request = new BurnBootloaderRequest();
    request.setInstance(instance);
    if (fqbn) {
      request.setFqbn(fqbn);
    }
    request.setPort(this.createPort(port));
    if (programmer) {
      request.setProgrammer(programmer.id);
    }
    request.setVerify(options.verify);
    request.setVerbose(options.verbose);
    return request;
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
    stderr: Buffer[];
    onData: (response: R) => void;
  } {
    const stderr: Buffer[] = [];
    const buffer = new AutoFlushingBuffer((chunks) => {
      Array.from(chunks.entries()).forEach(([severity, chunk]) => {
        if (chunk) {
          this.sendResponse(chunk, severity);
        }
      });
    });
    const onData = StreamingResponse.createOnDataHandler({
      stderr,
      onData: (out, err) => {
        buffer.addChunk(out);
        buffer.addChunk(err, OutputMessage.Severity.Error);
      },
      handlers,
    });
    return {
      dispose: () => buffer.dispose(),
      stderr,
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
    board,
    port,
  }: {
    board?: Board | undefined;
    port?: Port | undefined;
  }): Promise<void> {
    return this.monitorManager.notifyUploadStarted(board, port);
  }

  private async notifyUploadDidFinish({
    board,
    port,
  }: {
    board?: Board | undefined;
    port?: Port | undefined;
  }): Promise<Status> {
    return this.monitorManager.notifyUploadFinished(board, port);
  }

  private mergeSourceOverrides(
    req: { getSourceOverrideMap(): jspb.Map<string, string> },
    options: CoreService.Options.Compile
  ): void {
    const sketchPath = FileUri.fsPath(options.sketch.uri);
    for (const uri of Object.keys(options.sourceOverride)) {
      const content = options.sourceOverride[uri];
      if (content) {
        const relativePath = relative(sketchPath, FileUri.fsPath(uri));
        req.getSourceOverrideMap().set(relativePath, content);
      }
    }
  }

  private createPort(port: Port | undefined): GrpcPort {
    const grpcPort = new GrpcPort();
    if (port) {
      grpcPort.setAddress(port.address);
      grpcPort.setLabel(port.addressLabel);
      grpcPort.setProtocol(port.protocol);
      grpcPort.setProtocolLabel(port.protocolLabel);
    }
    return grpcPort;
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
      const out = response.getOutStream_asU8();
      const err = response.getErrStream_asU8();
      options.stderr.push(err);
      options.onData(out, err);
      options.handlers?.forEach((handler) => handler(response));
    };
  }
  export interface Options<R extends StreamingResponse> {
    readonly stderr: Uint8Array[];
    readonly onData: (out: Uint8Array, err: Uint8Array) => void;
    /**
     * Additional request handlers.
     * For example, when tracing the progress of a task and
     * collecting the output (out, err) and the `build_path` from the CLI.
     */
    readonly handlers?: ((response: R) => void)[];
  }
}
