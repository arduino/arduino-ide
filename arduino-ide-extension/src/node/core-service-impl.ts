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
import { ApplicationError, Disposable, nls } from '@theia/core';
import { MonitorManager } from './monitor-manager';
import { SimpleBuffer } from './utils/simple-buffer';
import { tryParseError } from './cli-error-parser';
import { Instance } from './cli-protocol/cc/arduino/cli/commands/v1/common_pb';
import { firstToUpperCase, notEmpty } from '../common/utils';
import { ServiceError } from './service-error';

@injectable()
export class CoreServiceImpl extends CoreClientAware implements CoreService {
  @inject(ResponseService)
  private readonly responseService: ResponseService;

  @inject(MonitorManager)
  private readonly monitorManager: MonitorManager;

  async compile(
    options: CoreService.Compile.Options & {
      exportBinaries?: boolean;
      compilerWarnings?: CompilerWarnings;
    }
  ): Promise<void> {
    const coreClient = await this.coreClient();
    const { client, instance } = coreClient;
    const handler = this.createOnDataHandler();
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
    }).finally(() => handler.dispose());
  }

  private compileRequest(
    options: CoreService.Compile.Options & {
      exportBinaries?: boolean;
      compilerWarnings?: CompilerWarnings;
    },
    instance: Instance
  ): CompileRequest {
    const { sketch, board, compilerWarnings } = options;
    const sketchUri = sketch.uri;
    const sketchPath = FileUri.fsPath(sketchUri);
    const request = new CompileRequest();
    request.setInstance(instance);
    request.setSketchPath(sketchPath);
    if (board?.fqbn) {
      request.setFqbn(board.fqbn);
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

  async upload(options: CoreService.Upload.Options): Promise<void> {
    return this.doUpload(
      options,
      () => new UploadRequest(),
      (client, req) => client.upload(req),
      (message: string, info: CoreError.ErrorInfo[]) =>
        CoreError.UploadFailed(message, info),
      'upload'
    );
  }

  async uploadUsingProgrammer(
    options: CoreService.Upload.Options
  ): Promise<void> {
    return this.doUpload(
      options,
      () => new UploadUsingProgrammerRequest(),
      (client, req) => client.uploadUsingProgrammer(req),
      (message: string, info: CoreError.ErrorInfo[]) =>
        CoreError.UploadUsingProgrammerFailed(message, info),
      'upload using programmer'
    );
  }

  protected async doUpload(
    options: CoreService.Upload.Options,
    requestFactory: () => UploadRequest | UploadUsingProgrammerRequest,
    responseHandler: (
      client: ArduinoCoreServiceClient,
      request: UploadRequest | UploadUsingProgrammerRequest
    ) => ClientReadableStream<UploadResponse | UploadUsingProgrammerResponse>,
    errorHandler: (
      message: string,
      info: CoreError.ErrorInfo[]
    ) => ApplicationError<number, CoreError.ErrorInfo[]>,
    task: string
  ): Promise<void> {
    await this.compile(Object.assign(options, { exportBinaries: false }));

    const coreClient = await this.coreClient();
    const { client, instance } = coreClient;
    const request = this.uploadOrUploadUsingProgrammerRequest(
      options,
      instance,
      requestFactory
    );
    const handler = this.createOnDataHandler();
    return this.notifyUploadWillStart(options).then(() =>
      new Promise<void>((resolve, reject) => {
        responseHandler(client, request)
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
                errorHandler(
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

  private uploadOrUploadUsingProgrammerRequest(
    options: CoreService.Upload.Options,
    instance: Instance,
    requestFactory: () => UploadRequest | UploadUsingProgrammerRequest
  ): UploadRequest | UploadUsingProgrammerRequest {
    const { sketch, board, port, programmer } = options;
    const sketchPath = FileUri.fsPath(sketch.uri);
    const request = requestFactory();
    request.setInstance(instance);
    request.setSketchPath(sketchPath);
    if (board?.fqbn) {
      request.setFqbn(board.fqbn);
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

  async burnBootloader(options: CoreService.Bootloader.Options): Promise<void> {
    const coreClient = await this.coreClient();
    const { client, instance } = coreClient;
    const handler = this.createOnDataHandler();
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
    options: CoreService.Bootloader.Options,
    instance: Instance
  ): BurnBootloaderRequest {
    const { board, port, programmer } = options;
    const request = new BurnBootloaderRequest();
    request.setInstance(instance);
    if (board?.fqbn) {
      request.setFqbn(board.fqbn);
    }
    request.setPort(this.createPort(port));
    if (programmer) {
      request.setProgrammer(programmer.id);
    }
    request.setVerify(options.verify);
    request.setVerbose(options.verbose);
    return request;
  }

  private createOnDataHandler<R extends StreamingResponse>(): Disposable & {
    stderr: Buffer[];
    onData: (response: R) => void;
  } {
    const stderr: Buffer[] = [];
    const buffer = new SimpleBuffer((chunks) => {
      Array.from(chunks.entries()).forEach(([severity, chunk]) => {
        if (chunk) {
          this.sendResponse(chunk, severity);
        }
      });
    });
    const onData = StreamingResponse.createOnDataHandler(stderr, (out, err) => {
      buffer.addChunk(out);
      buffer.addChunk(err, OutputMessage.Severity.Error);
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
    options: CoreService.Compile.Options
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
    stderr: Uint8Array[],
    onData: (out: Uint8Array, err: Uint8Array) => void
  ): (response: R) => void {
    return (response: R) => {
      const out = response.getOutStream_asU8();
      const err = response.getErrStream_asU8();
      stderr.push(err);
      onData(out, err);
    };
  }
}
