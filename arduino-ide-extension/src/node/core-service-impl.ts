import { FileUri } from '@theia/core/lib/node/file-uri';
import { inject, injectable } from '@theia/core/shared/inversify';
import { relative } from 'node:path';
import * as jspb from 'google-protobuf';
import { BoolValue } from 'google-protobuf/google/protobuf/wrappers_pb';
import type { ClientReadableStream } from '@grpc/grpc-js';
import {
  CompilerWarnings,
  CoreService,
  CoreError,
  CompileSummary,
  isCompileSummary,
  isUploadResponse,
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
import {
  resolveDetectedPort,
  OutputMessage,
  PortIdentifier,
  Port,
  UploadResponse as ApiUploadResponse,
} from '../common/protocol';
import { ArduinoCoreServiceClient } from './cli-protocol/cc/arduino/cli/commands/v1/commands_grpc_pb';
import { Port as RpcPort } from './cli-protocol/cc/arduino/cli/commands/v1/port_pb';
import { ApplicationError, CommandService, Disposable, nls } from '@theia/core';
import { MonitorManager } from './monitor-manager';
import { AutoFlushingBuffer } from './utils/buffers';
import { tryParseError } from './cli-error-parser';
import { Instance } from './cli-protocol/cc/arduino/cli/commands/v1/common_pb';
import { firstToUpperCase, notEmpty } from '../common/utils';
import { ServiceError } from './service-error';
import { ExecuteWithProgress, ProgressResponse } from './grpc-progressible';
import type { Mutable } from '@theia/core/lib/common/types';
import { BoardDiscovery, createApiPort } from './board-discovery';
import { SerialPort } from 'serialport';
namespace Uploadable {
  export type Request = UploadRequest | UploadUsingProgrammerRequest;
  export type Response = UploadResponse | UploadUsingProgrammerResponse;
}

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

  private serialPort: SerialPort;

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
    const request = this.compileRequest(options, instance);
    return new Promise<void>((resolve, reject) => {
      // 创建一个客户端
      client
        .compile(request)
        .on('data', handler.onData)
        .on('error', (error) => {
          if (!ServiceError.is(error)) {
            console.error(
              'Unexpected error occurred while compiling the sketch.',
              error
            );
            reject('\n' + error);
          } else {
            const compilerErrors = tryParseError({
              content: handler.content,
              sketch: options.sketch,
            });
            let message = `编译错误: ${compilerErrors
                .map(({ message }) => message)
                .filter(notEmpty)
                .shift() ?? error.details
              }`;

            // 翻译
            message = message.replace(
              'No connection established',
              '未建立连接'
            );
            message = message.replace(
              'Missing FQBN (Fully Qualified Board Name)',
              '没有选择板。请从代码页面中选择Lingzhi板'
            );
            message = message.replace(
              'No such file or directory',
              '没有这样的文件或目录'
            );
            message = message.replace(
              'expected initializer before',
              '之前的期望初始化项'
            );
            message = message.replace('Invalid', '无效');
            message = message.replace(
              'getting build properties for board',
              '获取板的构建属性'
            );
            message = message.replace(
              'was not declared in this scope',
              '未在此范围内声明'
            );
            message = message.replace('invalid value', '无效值');
            message = message.replace('for option', '来自');
            this.sendResponse(
              '\n' + message + '\n',
              OutputMessage.Severity.Error
            );
            reject(CoreError.VerifyFailed(message, compilerErrors));
          }
        })
        .on('end', resolve);
    }).finally(() => {
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
    });
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

  // 上传文件
  async upload(
    options: CoreService.Options.Upload
  ): Promise<ApiUploadResponse> {
    if (options.port) {
      let path = options.port.address;
      await this.setIsp(path);
    }
    // 获取是否使用程序员的选项
    const { usingProgrammer } = options;
    // 返回上传文件的结果
    return this.doUpload(
      options,
      // 根据是否使用程序员选择不同的请求
      usingProgrammer
        ? new UploadUsingProgrammerRequest()
        : new UploadRequest(),
      // 根据是否使用程序员选择不同的上传方法
      (client) =>
        (usingProgrammer ? client.uploadUsingProgrammer : client.upload).bind(
          client
        ),
      // 根据是否使用程序员选择不同的错误类型
      usingProgrammer
        ? CoreError.UploadUsingProgrammerFailed
        : CoreError.UploadFailed,
      // 根据是否使用程序员选择不同的日志信息
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
  ): Promise<ApiUploadResponse> {
    const portBeforeUpload = options.port;
    const uploadResponseFragment: Mutable<Partial<ApiUploadResponse>> = {
      portAfterUpload: options.port, // assume no port changes during the upload
    };
    const coreClient = await this.coreClient;
    const { client, instance } = coreClient;
    const progressHandler = this.createProgressHandler(options);
    // Track responses for port changes. No port changes are expected when uploading using a programmer.
    const updateUploadResponseFragmentHandler = (response: RESP) => {
      if (response instanceof UploadResponse) {
        // TODO: this instanceof should not be here but in `upload`. the upload and upload using programmer gRPC APIs are not symmetric
        const uploadResult = response.getResult();
        if (uploadResult) {
          const port = uploadResult.getUpdatedUploadPort();
          if (port) {
            uploadResponseFragment.portAfterUpload = createApiPort(port);
            console.info(
              `Received port after upload [${options.port ? Port.keyOf(options.port) : ''
              }, ${options.fqbn}, ${options.sketch.name
              }]. Before port: ${JSON.stringify(
                portBeforeUpload
              )}, after port: ${JSON.stringify(
                uploadResponseFragment.portAfterUpload
              )}`
            );
          }
        }
      }
    };
    const handler = this.createOnDataHandler(
      progressHandler,
      updateUploadResponseFragmentHandler
    );
    const grpcCall = responseFactory(client);
    return this.notifyUploadWillStart(options).then(() =>
      new Promise<ApiUploadResponse>((resolve, reject) => {
        grpcCall(this.initUploadRequest(request, options, instance))
          .on('data', handler.onData)
          .on('error', (error) => {
            if (!ServiceError.is(error)) {
              console.error(`Unexpected error occurred while ${task}.`, error);
              reject(error);
            } else {
              let err = error.details;
              let message = `${firstToUpperCase(task)}错误:${err}`;
              message.replace('Upload', '上传');
              err = err.replace(
                'Failed uploading: no upload port provided',
                '上传失败：没有提供上传端口'
              );
              message.replace('read ECONNRESET', '读取 ECONNRESET');
              this.sendResponse(err, OutputMessage.Severity.Error);
              reject(
                errorCtor(
                  message,
                  tryParseError({
                    content: handler.content,
                    sketch: options.sketch,
                  })
                )
              );
            }
          })
          .on('end', () => {
            if (isUploadResponse(uploadResponseFragment)) {
              resolve(uploadResponseFragment);
            } else {
              reject(
                new Error(
                  `上传后无法检测端口。上传选项有：${JSON.stringify(
                    options
                  )}, 上传回复为： ${JSON.stringify(uploadResponseFragment)}`
                )
              );
            }
          });
      }).finally(async () => {
        handler.dispose();
        await this.notifyUploadDidFinish(
          Object.assign(options, {
            afterPort: uploadResponseFragment.portAfterUpload,
          })
        );
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
                  tryParseError({ content: handler.content })
                )
              );
            }
          })
          .on('end', resolve);
      }).finally(async () => {
        handler.dispose();
        await this.notifyUploadDidFinish(
          Object.assign(options, { afterPort: options.port })
        );
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
        buffer.addChunk(out);
        buffer.addChunk(err, OutputMessage.Severity.Error);
      },
      handlers,
    });
    return {
      dispose: () => buffer.dispose(),
      content,
      onData,
    };
  }
  private lineWrappingOrNot = false;

  private sendResponse(
    chunk: string,
    severity: OutputMessage.Severity = OutputMessage.Severity.Info
  ): void {
    chunk = chunk.replace('FQBN:', '开始验证程序,请稍后...\n硬件型号:');
    const startIndex = chunk.indexOf("'") + 1;
    const endIndex = chunk.indexOf("'", startIndex);
    const result = chunk.substring(startIndex, endIndex);
    chunk = chunk.replace(
      `Using board '${result}' from platform in folder`,
      '平台库'
    );
    const lines = chunk.split('\n');
    const newLines = lines.map((line) => {
      if (line.startsWith("Using core '")) {
        return '';
      } else {
        return line;
      }
    });

    chunk = newLines.join('\n');
    chunk = chunk.includes('Detecting libraries used...')
      ? '验证库文件...\n'
      : chunk;
    chunk = chunk.includes('A subdirectory or file') ? '' : chunk;
    chunk = chunk.includes('Compiling sketch...')
      ? '\n\n编译项目文件...\n'
      : chunk;

    if (chunk.includes('验证库文件...') || chunk.includes('编译项目文件...')) {
      this.responseService.appendToOutput({ chunk, severity });
      for (let i = 0; i < 20; i++) {
        chunk = '##';
        this.responseService.appendToOutput({ chunk, severity });
      }
    }

    chunk = chunk.includes('Compiling libraries...')
      ? '\n\n编译软件库...\n'
      : chunk;
    if (chunk.includes('Compiling core...')) {
      this.lineWrappingOrNot = true;
    }

    chunk = chunk.replace('Compiling core...', '\n');
    let index = chunk.indexOf('Using previously compiled file:');
    while (index !== -1) {
      index = chunk.indexOf('Using previously compiled file:', index + 1);
      const tempChunk = chunk;
      chunk = '#';
      this.responseService.appendToOutput({ chunk, severity });
      chunk = tempChunk;
      if (chunk.indexOf('Using previously compiled file:', index + 2) === -1) {
        chunk = '\n';
      }
    }

    chunk = chunk.includes('Wrote address') ? '#' : chunk;
    chunk = chunk.includes('Compiling library') ? '' : chunk;
    chunk = chunk.includes('Alternatives for') ? '' : chunk;
    chunk = chunk.includes('Generating function prototypes...') ? '' : chunk;
    chunk = chunk.includes('Failed to init device.')
      ? '\n初始化设备失败.'
      : chunk;
    chunk = chunk.includes('http://stm32flash.googlecode.com/') ? '' : chunk;
    chunk = chunk.includes('done.') ? '\n' : chunk;

    const processString = (chunk: string) => {
      // 提取程序存储相关信息
      const programStorageMatch = chunk.match(
        /Sketch uses (\d+) bytes \((\d+)%\).*Maximum is (\d+) bytes/
      );
      let programStorageBytes = null;
      let programStoragePercentage = null;
      let programStorageMax = null;
      if (programStorageMatch) {
        programStorageBytes = parseInt(programStorageMatch[1], 10);
        programStoragePercentage = parseInt(programStorageMatch[2], 10);
        programStorageMax = parseInt(programStorageMatch[3], 10);
      }

      // 提取动态内存相关信息
      const dynamicMemoryMatch = chunk.match(
        /Global variables use (\d+) bytes \((\d+)%\).*Maximum is (\d+) bytes/
      );
      let dynamicMemoryBytes = null;
      let dynamicMemoryPercentage = null;
      let dynamicMemoryMax = null;
      if (dynamicMemoryMatch) {
        dynamicMemoryBytes = parseInt(dynamicMemoryMatch[1], 10);
        dynamicMemoryPercentage = parseInt(dynamicMemoryMatch[2], 10);
        dynamicMemoryMax = parseInt(dynamicMemoryMatch[3], 10);
      }

      if (programStorageMatch && dynamicMemoryMatch) {
        this.lineWrappingOrNot = false;
        return `\n\n已使用 ${programStorageBytes} 字节 Flash 空间,占用: ${programStoragePercentage}%, 总容量 ${programStorageMax} 字节.
已使用 ${dynamicMemoryBytes} 字节 RAM 空间,占用: ${dynamicMemoryPercentage}%, 总容量 ${dynamicMemoryMax} 字节.\n\n恭喜!程序完全正确.\n\n`;
      } else {
        return chunk;
      }
    };
    chunk = processString(chunk);

    if (!chunk.includes('平台库')) {
      if (severity === 0) {
        chunk = '\n\n' + chunk;
      } else {
        chunk = chunk.includes('C:\\') ? '#' : chunk;
      }
      if (this.lineWrappingOrNot) {
        chunk = chunk.replace(/\n/g, '');
      }
    }
    if (chunk.includes('File not found')) {
      const lines = chunk.split('\n');

      chunk = `\n未找到文件: ${lines[0].split(': ')[1]}
对 “${lines[1].split(' ')[2]}” 接口进行探测时出错
无法处理设备 “${lines[2].split(' ')[2]}”`;
    }
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

  private createPort(
    port: PortIdentifier | undefined,
    resolve: (port: PortIdentifier) => Port | undefined = (port) =>
      resolveDetectedPort(port, this.boardDiscovery.detectedPorts)
  ): RpcPort | undefined {
    if (!port) {
      return undefined;
    }
    const resolvedPort = resolve(port);
    const rpcPort = new RpcPort();
    rpcPort.setProtocol(port.protocol);
    rpcPort.setAddress(port.address);
    if (resolvedPort) {
      rpcPort.setLabel(resolvedPort.addressLabel);
      rpcPort.setProtocolLabel(resolvedPort.protocolLabel);
      if (resolvedPort.hardwareId !== undefined) {
        rpcPort.setHardwareId(resolvedPort.hardwareId);
      }
      if (resolvedPort.properties) {
        for (const [key, value] of Object.entries(resolvedPort.properties)) {
          rpcPort.getPropertiesMap().set(key, value);
        }
      }
    }
    return rpcPort;
  }
  private async setIsp(path: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      this.serialPort = new SerialPort(
        { path: path, baudRate: 9600, autoOpen: true, rtscts: true },
        async (err) => {
          if (err) {
            console.log('errmessage', err);
          }
          let port = this.serialPort;
          port.set({ rts: true });
          port.set({ dtr: true });
          await new Promise<void>((resolve) => setTimeout(resolve, 10));
          port.set({ dtr: false });
          await new Promise<void>((resolve) => setTimeout(resolve, 100));
          port.set({ dtr: true });
          port.flush();
          await new Promise<void>((resolve) => setTimeout(resolve, 200));
          port.close();
          resolve();
        }
      );
    });
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
      if (out.length) {
        options.content.push(out);
      }
      const err = response.getErrStream_asU8();
      if (err.length) {
        options.content.push(err);
      }
      options.onData(out, err);
      options.handlers?.forEach((handler) => handler(response));
    };
  }
  export interface Options<R extends StreamingResponse> {
    readonly content: Uint8Array[];
    readonly onData: (out: Uint8Array, err: Uint8Array) => void;
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
  let buildPath = response.getBuildPath();
  if (buildPath) {
    compileSummary.buildPath = buildPath;
    compileSummary.buildOutputUri = FileUri.create(buildPath).toString();
  }
  const executableSectionsSize = response.getExecutableSectionsSizeList();
  if (executableSectionsSize) {
    compileSummary.executableSectionsSize = executableSectionsSize.map((item) =>
      item.toObject(false)
    );
  }
  const usedLibraries = response.getUsedLibrariesList();
  if (usedLibraries) {
    compileSummary.usedLibraries = usedLibraries.map((item) => {
      const object = item.toObject(false);
      const library = {
        ...object,
        architectures: object.architecturesList,
        types: object.typesList,
        examples: object.examplesList,
        providesIncludes: object.providesIncludesList,
        properties: object.propertiesMap.reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>),
        compatibleWith: object.compatibleWithMap.reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {} as Record<string, boolean>),
      } as const;
      const mutable = <Partial<Mutable<typeof library>>>library;
      delete mutable.architecturesList;
      delete mutable.typesList;
      delete mutable.examplesList;
      delete mutable.providesIncludesList;
      delete mutable.propertiesMap;
      delete mutable.compatibleWithMap;
      return library;
    });
  }
  const boardPlatform = response.getBoardPlatform();
  if (boardPlatform) {
    compileSummary.buildPlatform = boardPlatform.toObject(false);
  }
  const buildPlatform = response.getBuildPlatform();
  if (buildPlatform) {
    compileSummary.buildPlatform = buildPlatform.toObject(false);
  }
  const buildProperties = response.getBuildPropertiesList();
  if (buildProperties) {
    compileSummary.buildProperties = buildProperties.slice();
  }
  return compileSummary;
}
