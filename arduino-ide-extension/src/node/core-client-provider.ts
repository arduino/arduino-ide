import { join } from 'node:path';
import * as grpc from '@grpc/grpc-js';
import {
  inject,
  injectable,
  postConstruct,
} from '@theia/core/shared/inversify';
import { Emitter } from '@theia/core/lib/common/event';
import { ArduinoCoreServiceClient } from './cli-protocol/cc/arduino/cli/commands/v1/commands_grpc_pb';
import { Instance } from './cli-protocol/cc/arduino/cli/commands/v1/common_pb';
import {
  CreateRequest,
  InitRequest,
  InitResponse,
  UpdateIndexRequest,
  UpdateIndexResponse,
  UpdateLibrariesIndexRequest,
  UpdateLibrariesIndexResponse,
} from './cli-protocol/cc/arduino/cli/commands/v1/commands_pb';
import * as commandsGrpcPb from './cli-protocol/cc/arduino/cli/commands/v1/commands_grpc_pb';
import {
  IndexType,
  IndexUpdateDidCompleteParams,
  IndexUpdateSummary,
  IndexUpdateDidFailParams,
  IndexUpdateWillStartParams,
  NotificationServiceServer,
  AdditionalUrls,
} from '../common/protocol';
import { Deferred } from '@theia/core/lib/common/promise-util';
import {
  Status as RpcStatus,
  Status,
} from './cli-protocol/google/rpc/status_pb';
import { ConfigServiceImpl } from './config-service-impl';
import { ArduinoDaemonImpl } from './arduino-daemon-impl';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { Disposable } from '@theia/core/shared/vscode-languageserver-protocol';
import {
  IndexesUpdateProgressHandler,
  ExecuteWithProgress,
  DownloadResult,
} from './grpc-progressible';
import type { DefaultCliConfig } from './cli-config';
import { ServiceError } from './service-error';

@injectable()
export class CoreClientProvider {
  @inject(ArduinoDaemonImpl)
  private readonly daemon: ArduinoDaemonImpl;
  @inject(ConfigServiceImpl)
  private readonly configService: ConfigServiceImpl;
  @inject(NotificationServiceServer)
  private readonly notificationService: NotificationServiceServer;

  /**
   * See `CoreService#indexUpdateSummaryBeforeInit`.
   */
  private readonly beforeInitSummary = {} as IndexUpdateSummary;
  private readonly toDisposeOnCloseClient = new DisposableCollection();
  private readonly toDisposeAfterDidCreate = new DisposableCollection();
  private readonly onClientReadyEmitter =
    new Emitter<CoreClientProvider.Client>();
  private readonly onClientReady = this.onClientReadyEmitter.event;

  private pending: Deferred<CoreClientProvider.Client> | undefined;
  private _client: CoreClientProvider.Client | undefined;

  @postConstruct()
  protected init(): void {
    this.daemon.tryGetPort().then((port) => {
      if (port) {
        this.create(port);
      }
    });
    this.daemon.onDaemonStarted((port) => this.create(port));
    this.daemon.onDaemonStopped(() => this.closeClient());
    this.configService.onConfigChange(async ({ oldState, newState }) => {
      if (
        !AdditionalUrls.sameAs(
          oldState.config?.additionalUrls,
          newState.config?.additionalUrls
        )
      ) {
        const client = await this.client;
        this.updateIndex(client, ['platform']);
      } else if (
        !!newState.config?.sketchDirUri &&
        oldState.config?.sketchDirUri !== newState.config.sketchDirUri
      ) {
        // If the sketchbook location has changed, the custom libraries has changed.
        // Reinitialize the core client and fire an event so that the frontend can refresh.
        // https://github.com/arduino/arduino-ide/issues/796 (see the file > examples and sketch > include examples)
        const client = await this.client;
        await this.initInstance(client);
        this.notificationService.notifyDidReinitialize();
      }
    });
  }

  get tryGetClient(): CoreClientProvider.Client | undefined {
    return this._client;
  }

  get client(): Promise<CoreClientProvider.Client> {
    const client = this.tryGetClient;
    if (client) {
      return Promise.resolve(client);
    }
    if (!this.pending) {
      this.pending = new Deferred();
      this.toDisposeAfterDidCreate.pushAll([
        Disposable.create(() => (this.pending = undefined)), // TODO: reject all pending requests before unsetting the ref?
        this.onClientReady((client) => {
          this.pending?.resolve(client);
          this.toDisposeAfterDidCreate.dispose();
        }),
      ]);
    }
    return this.pending.promise;
  }

  async refresh(): Promise<void> {
    const client = await this.client;
    await this.initInstance(client);
  }

  /**
   * Encapsulates both the gRPC core client creation (`CreateRequest`) and initialization (`InitRequest`).
   */
  private async create(port: string): Promise<CoreClientProvider.Client> {
    this.closeClient();
    // await this.createPackageIndexJson();
    const address = this.address(port);
    const client = await this.createClient(address);
    this.toDisposeOnCloseClient.pushAll([
      Disposable.create(() => client.client.close()),
    ]);
    await this.initInstanceWithFallback(client);
    return this.useClient(client);
  }

  /**
   * By default, calling this method is equivalent to the `initInstance(Client)` call.
   * When the IDE2 starts and one of the followings is missing,
   * the IDE2 must run the index update before the core client initialization:
   *
   *  - primary package index (`#directories.data/package_index.json`),
   *  - library index (`#directories.data/library_index.json`),
   *  - built-in tools (`builtin:serial-discovery` or `builtin:mdns-discovery`)
   *
   * This method detects such errors and runs an index update before initializing the client.
   * The index update will fail if the 3rd URLs list contains an invalid URL,
   * and the IDE2 will be [non-functional](https://github.com/arduino/arduino-ide/issues/1084). Since the CLI [cannot update only the primary package index]((https://github.com/arduino/arduino-cli/issues/1788)), IDE2 does its dirty solution.
   */
  private async initInstanceWithFallback(
    client: CoreClientProvider.Client
  ): Promise<void> {
    try {
      await this.initInstance(client);
    } catch (err) {
      if (err instanceof MustUpdateIndexesBeforeInitError) {
        console.error(
          'The primary packages indexes are missing. Running indexes update before initializing the core gRPC client',
          err.message
        );
        await this.updateIndex(client, Array.from(err.indexTypesToUpdate));
        const updatedAt = new Date().toISOString();
        // Clients will ask for it after they connect.
        err.indexTypesToUpdate.forEach(
          (type) => (this.beforeInitSummary[type] = updatedAt)
        );
        await this.initInstance(client);
        console.info(
          `Downloaded the primary package indexes, and successfully initialized the core gRPC client.`
        );
      } else {
        console.error(
          'Error occurred while initializing the core gRPC client provider',
          err
        );
        throw err;
      }
    }
  }

  private useClient(
    client: CoreClientProvider.Client
  ): CoreClientProvider.Client {
    this._client = client;
    this.onClientReadyEmitter.fire(this._client);
    return this._client;
  }

  private closeClient(): void {
    return this.toDisposeOnCloseClient.dispose();
  }

  private async createClient(
    address: string
  ): Promise<CoreClientProvider.Client> {
    // https://github.com/agreatfool/grpc_tools_node_protoc_ts/blob/master/doc/grpcjs_support.md#usage
    const ArduinoCoreServiceClient = grpc.makeClientConstructor(
      // @ts-expect-error: ignore
      commandsGrpcPb['cc.arduino.cli.commands.v1.ArduinoCoreService'],
      'ArduinoCoreServiceService'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any;
    const client = new ArduinoCoreServiceClient(
      address,
      grpc.credentials.createInsecure(),
      this.channelOptions
    ) as ArduinoCoreServiceClient;

    const instance = await new Promise<Instance>((resolve, reject) => {
      client.create(new CreateRequest(), (err, resp) => {
        if (err) {
          reject(err);
          return;
        }
        const instance = resp.getInstance();
        if (!instance) {
          reject(
            new Error(
              '`CreateResponse` was OK, but the retrieved `instance` was `undefined`.'
            )
          );
          return;
        }
        resolve(instance);
      });
    });

    return { instance, client };
  }

  private async initInstance({
    client,
    instance,
  }: CoreClientProvider.Client): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const errors: RpcStatus[] = [];
      client
        .init(new InitRequest().setInstance(instance))
        .on('data', (resp: InitResponse) => {
          // XXX: The CLI never sends `initProgress`, it's always `error` or nothing. Is this a CLI bug?
          // According to the gRPC API, the CLI should send either a `TaskProgress` or a `DownloadProgress`, but it does not.
          const error = resp.getError();
          if (error) {
            const { code, message } = Status.toObject(false, error);
            console.error(
              `Detected an error response during the gRPC core client initialization: code: ${code}, message: ${message}`
            );
            errors.push(error);
          }
        })
        .on('error', reject)
        .on('end', async () => {
          const error = await this.evaluateErrorStatus(errors);
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
    });
  }

  private async evaluateErrorStatus(
    status: RpcStatus[]
  ): Promise<Error | undefined> {
    await this.configService.getConfiguration(); // to ensure the CLI config service has been initialized.
    const { cliConfiguration } = this.configService;
    if (!cliConfiguration) {
      // If the CLI config is not available, do not even try to guess what went wrong.
      return new Error(`Could not read the CLI configuration file.`);
    }
    return isIndexUpdateRequiredBeforeInit(status, cliConfiguration); // put future error matching here
  }

  /**
   * `update3rdPartyPlatforms` has not effect if `types` is `['library']`.
   */
  async updateIndex(
    client: CoreClientProvider.Client,
    types: IndexType[]
  ): Promise<void> {
    let error: unknown | undefined = undefined;
    const progressHandler = this.createProgressHandler(types);
    try {
      const updates: Promise<void>[] = [];
      if (types.includes('platform')) {
        updates.push(this.updatePlatformIndex(client, progressHandler));
      }
      if (types.includes('library')) {
        updates.push(this.updateLibraryIndex(client, progressHandler));
      }
      await Promise.all(updates);
    } catch (err) {
      // This is suboptimal but the core client must be re-initialized even if the index update has failed and the request was rejected.
      error = err;
    } finally {
      // IDE2 reloads the index only and if only at least one download success is available.
      if (
        progressHandler.results.some(
          (result) => !DownloadResult.isError(result)
        )
      ) {
        await this.initInstance(client);
        // notify clients about the index update only after the client has been "re-initialized" and the new content is available.
        progressHandler.reportEnd();
      }
      if (error) {
        console.error(`Failed to update ${types.join(', ')} indexes.`, error);
        const downloadErrors = progressHandler.results
          .filter(DownloadResult.isError)
          .map(({ url, message }) => `${message}: ${url}`)
          .join(' ');
        const message = ServiceError.is(error)
          ? `${error.details}${downloadErrors ? ` ${downloadErrors}` : ''}`
          : String(error);
        // IDE2 keeps only the most recent error message. Previous errors might have been fixed with the fallback initialization.
        this.beforeInitSummary.message = message;
        // Toast the error message, so tha the user has chance to fix it if it was a client error (HTTP 4xx).
        progressHandler.reportError(message);
      }
    }
  }

  get indexUpdateSummaryBeforeInit(): IndexUpdateSummary {
    return { ...this.beforeInitSummary };
  }

  private async updatePlatformIndex(
    client: CoreClientProvider.Client,
    progressHandler?: IndexesUpdateProgressHandler
  ): Promise<void> {
    return this.doUpdateIndex(
      () =>
        client.client.updateIndex(
          new UpdateIndexRequest().setInstance(client.instance) // Always updates both the primary and the 3rd party package indexes.
        ),
      progressHandler,
      'platform-index'
    );
  }

  private async updateLibraryIndex(
    client: CoreClientProvider.Client,
    progressHandler?: IndexesUpdateProgressHandler
  ): Promise<void> {
    return this.doUpdateIndex(
      () =>
        client.client.updateLibrariesIndex(
          new UpdateLibrariesIndexRequest().setInstance(client.instance)
        ),
      progressHandler,
      'library-index'
    );
  }

  private async doUpdateIndex<
    R extends UpdateIndexResponse | UpdateLibrariesIndexResponse
  >(
    responseProvider: () => grpc.ClientReadableStream<R>,
    progressHandler?: IndexesUpdateProgressHandler,
    task?: string
  ): Promise<void> {
    const progressId = progressHandler?.progressId;
    return new Promise<void>((resolve, reject) => {
      responseProvider()
        .on(
          'data',
          ExecuteWithProgress.createDataCallback({
            responseService: {
              appendToOutput: ({ chunk: message }) => {
                console.log(
                  `core-client-provider${task ? ` [${task}]` : ''}`,
                  message
                );
                progressHandler?.reportProgress(message);
              },
            },
            reportResult: (result) => progressHandler?.reportResult(result),
            progressId,
          })
        )
        .on('error', reject)
        .on('end', resolve);
    });
  }

  private createProgressHandler(
    types: IndexType[]
  ): IndexesUpdateProgressHandler {
    const additionalUrlsCount =
      this.configService.cliConfiguration?.board_manager?.additional_urls
        ?.length ?? 0;
    return new IndexesUpdateProgressHandler(types, additionalUrlsCount, {
      onProgress: (progressMessage) =>
        this.notificationService.notifyIndexUpdateDidProgress(progressMessage),
      onError: (params: IndexUpdateDidFailParams) =>
        this.notificationService.notifyIndexUpdateDidFail(params),
      onStart: (params: IndexUpdateWillStartParams) =>
        this.notificationService.notifyIndexUpdateWillStart(params),
      onComplete: (params: IndexUpdateDidCompleteParams) =>
        this.notificationService.notifyIndexUpdateDidComplete(params),
    });
  }

  private address(port: string): string {
    return `localhost:${port}`;
  }

  private get channelOptions(): Record<string, unknown> {
    return {
      'grpc.max_send_message_length': 512 * 1024 * 1024,
      'grpc.max_receive_message_length': 512 * 1024 * 1024,
      'grpc.primary_user_agent': `arduino-ide/${this.version}`,
    };
  }

  private _version: string | undefined;
  private get version(): string {
    if (this._version) {
      return this._version;
    }
    const json = require('../../package.json');
    if ('version' in json) {
      this._version = json.version;
    }
    if (!this._version) {
      this._version = '0.0.0';
    }
    return this._version;
  }
}
export namespace CoreClientProvider {
  export interface Client {
    readonly client: ArduinoCoreServiceClient;
    readonly instance: Instance;
  }
}

/**
 * Sugar for making the gRPC core client available for the concrete service classes.
 */
@injectable()
export abstract class CoreClientAware {
  @inject(CoreClientProvider)
  private readonly coreClientProvider: CoreClientProvider;

  /**
   * Returns with a promise that resolves when the core client is initialized and ready.
   */
  protected get coreClient(): Promise<CoreClientProvider.Client> {
    return this.coreClientProvider.client;
  }

  /**
   * Updates the index of the given `type` and returns with a promise which resolves when the core gPRC client has been reinitialized.
   */
  async updateIndex({ types }: { types: IndexType[] }): Promise<void> {
    const client = await this.coreClient;
    return this.coreClientProvider.updateIndex(client, types);
  }

  async indexUpdateSummaryBeforeInit(): Promise<IndexUpdateSummary> {
    await this.coreClient;
    return this.coreClientProvider.indexUpdateSummaryBeforeInit;
  }

  refresh(): Promise<void> {
    return this.coreClientProvider.refresh();
  }
}

class MustUpdateIndexesBeforeInitError extends Error {
  readonly indexTypesToUpdate: Set<IndexType>;
  constructor(causes: [RpcStatus.AsObject, IndexType][]) {
    super(`The index of the cores and libraries must be updated before initializing the core gRPC client.
The following problems were detected during the gRPC client initialization:
${causes
        .map(
          ([{ code, message }, type]) =>
            `[${type}-index] - code: ${code}, message: ${message}`
        )
        .join('\n')}
`);
    Object.setPrototypeOf(this, MustUpdateIndexesBeforeInitError.prototype);
    this.indexTypesToUpdate = new Set(causes.map(([, type]) => type));
    if (!causes.length) {
      throw new Error(`expected non-empty 'causes'`);
    }
  }
}

function isIndexUpdateRequiredBeforeInit(
  status: RpcStatus[],
  cliConfig: DefaultCliConfig
): MustUpdateIndexesBeforeInitError | undefined {
  const causes = status.reduce((acc, curr) => {
    for (const [predicate, type] of IndexUpdateRequiredPredicates) {
      if (predicate(curr, cliConfig)) {
        acc.push([curr.toObject(false), type]);
        return acc;
      }
    }
    return acc;
  }, [] as [RpcStatus.AsObject, IndexType][]);
  return causes.length
    ? new MustUpdateIndexesBeforeInitError(causes)
    : undefined;
}
interface Predicate {
  (
    status: RpcStatus,
    {
      directories: { data },
    }: DefaultCliConfig
  ): boolean;
}
const IndexUpdateRequiredPredicates: [Predicate, IndexType][] = [
  [isPrimaryPackageIndexMissingStatus, 'platform'],
  [isDiscoveryNotFoundStatus, 'platform'],
  [isLibraryIndexMissingStatus, 'library'],
];
// Loading index file: loading json index file /path/to/package_index.json: open /path/to/package_index.json: no such file or directory
function isPrimaryPackageIndexMissingStatus(
  status: RpcStatus,
  { directories: { data } }: DefaultCliConfig
): boolean {
  const predicate = ({ message }: RpcStatus.AsObject) =>
    message.includes(join(data, 'package_index.json'));
  // https://github.com/arduino/arduino-cli/blob/f0245bc2da6a56fccea7b2c9ea09e85fdcc52cb8/arduino/cores/packagemanager/package_manager.go#L247
  return evaluate(status, predicate);
}
// Error loading hardware platform: discovery $TOOL_NAME not found
function isDiscoveryNotFoundStatus(status: RpcStatus): boolean {
  const predicate = ({ message }: RpcStatus.AsObject) =>
    message.includes('discovery') &&
    (message.includes('not found') ||
      message.includes('loading hardware platform'));
  // https://github.com/arduino/arduino-cli/blob/f0245bc2da6a56fccea7b2c9ea09e85fdcc52cb8/arduino/cores/packagemanager/loader.go#L740
  // https://github.com/arduino/arduino-cli/blob/f0245bc2da6a56fccea7b2c9ea09e85fdcc52cb8/arduino/cores/packagemanager/loader.go#L744
  return evaluate(status, predicate);
}
// Loading index file: reading library_index.json: open /path/to/library_index.json: no such file or directory
function isLibraryIndexMissingStatus(
  status: RpcStatus,
  { directories: { data } }: DefaultCliConfig
): boolean {
  const predicate = ({ message }: RpcStatus.AsObject) =>
    message.includes(join(data, 'library_index.json'));
  // https://github.com/arduino/arduino-cli/blob/f0245bc2da6a56fccea7b2c9ea09e85fdcc52cb8/arduino/cores/packagemanager/package_manager.go#L247
  return evaluate(status, predicate);
}
function evaluate(
  subject: RpcStatus,
  predicate: (error: RpcStatus.AsObject) => boolean
): boolean {
  const status = RpcStatus.toObject(false, subject);
  return predicate(status);
}
