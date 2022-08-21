import { join } from 'path';
import * as grpc from '@grpc/grpc-js';
import {
  inject,
  injectable,
  postConstruct,
} from '@theia/core/shared/inversify';
import { Emitter, Event } from '@theia/core/lib/common/event';
import { ArduinoCoreServiceClient } from './cli-protocol/cc/arduino/cli/commands/v1/commands_grpc_pb';
import { Instance } from './cli-protocol/cc/arduino/cli/commands/v1/common_pb';
import {
  CreateRequest,
  InitRequest,
  InitResponse,
  UpdateCoreLibrariesIndexResponse,
  UpdateIndexRequest,
  UpdateIndexResponse,
  UpdateLibrariesIndexRequest,
  UpdateLibrariesIndexResponse,
} from './cli-protocol/cc/arduino/cli/commands/v1/commands_pb';
import * as commandsGrpcPb from './cli-protocol/cc/arduino/cli/commands/v1/commands_grpc_pb';
import { NotificationServiceServer } from '../common/protocol';
import { Deferred, retry } from '@theia/core/lib/common/promise-util';
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

  private ready = new Deferred<void>();
  private pending: Deferred<CoreClientProvider.Client> | undefined;
  private _client: CoreClientProvider.Client | undefined;
  private readonly toDisposeBeforeCreate = new DisposableCollection();
  private readonly toDisposeAfterDidCreate = new DisposableCollection();
  private readonly onClientReadyEmitter =
    new Emitter<CoreClientProvider.Client>();
  private readonly onClientReady = this.onClientReadyEmitter.event;
  private readonly onClientDidRefreshEmitter =
    new Emitter<CoreClientProvider.Client>();

  @postConstruct()
  protected init(): void {
    this.daemon.tryGetPort().then((port) => {
      if (port) {
        this.create(port);
      }
    });
    this.daemon.onDaemonStarted((port) => this.create(port));
    this.daemon.onDaemonStopped(() => this.closeClient());
    this.configService.onConfigChange(() => this.refreshIndexes());
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
        Disposable.create(() => (this.pending = undefined)),
        this.onClientReady((client) => {
          this.pending?.resolve(client);
          this.toDisposeAfterDidCreate.dispose();
        }),
      ]);
    }
    return this.pending.promise;
  }

  get onClientDidRefresh(): Event<CoreClientProvider.Client> {
    return this.onClientDidRefreshEmitter.event;
  }

  /**
   * Encapsulates both the gRPC core client creation (`CreateRequest`) and initialization (`InitRequest`).
   */
  private async create(port: string): Promise<CoreClientProvider.Client> {
    this.closeClient();
    const address = this.address(port);
    const client = await this.createClient(address);
    this.toDisposeBeforeCreate.pushAll([
      Disposable.create(() => client.client.close()),
      Disposable.create(() => {
        this.ready.reject(
          new Error(
            `Disposed. Creating a new gRPC core client on address ${address}.`
          )
        );
        this.ready = new Deferred();
      }),
    ]);
    await this.initInstanceWithFallback(client);
    setTimeout(async () => this.refreshIndexes(), 10_000); // Update the indexes asynchronously
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
      if (err instanceof IndexUpdateRequiredBeforeInitError) {
        console.error(
          'The primary packages indexes are missing. Running indexes update before initializing the core gRPC client',
          err.message
        );
        await this.updateIndexes(client); // TODO: this should run without the 3rd party URLs
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
    return this.toDisposeBeforeCreate.dispose();
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
        .on('end', () => {
          const error = this.evaluateErrorStatus(errors);
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
    });
  }

  private evaluateErrorStatus(status: RpcStatus[]): Error | undefined {
    const { cliConfiguration } = this.configService;
    if (!cliConfiguration) {
      // If the CLI config is not available, do not even try to guess what went wrong.
      return new Error(`Could not read the CLI configuration file.`);
    }
    return isIndexUpdateRequiredBeforeInit(status, cliConfiguration); // put future error matching here
  }

  /**
   * Updates all indexes and runs an init to [reload the indexes](https://github.com/arduino/arduino-cli/pull/1274#issue-866154638).
   */
  private async refreshIndexes(): Promise<void> {
    const client = this._client;
    if (client) {
      const progressHandler = this.createProgressHandler();
      try {
        await this.updateIndexes(client, progressHandler);
        await this.initInstance(client);
        // notify clients about the index update only after the client has been "re-initialized" and the new content is available.
        progressHandler.reportEnd();
        this.onClientDidRefreshEmitter.fire(client);
      } catch (err) {
        console.error('Failed to update indexes', err);
        progressHandler.reportError(
          ServiceError.is(err) ? err.details : String(err)
        );
      }
    }
  }

  private async updateIndexes(
    client: CoreClientProvider.Client,
    progressHandler?: IndexesUpdateProgressHandler
  ): Promise<void> {
    await Promise.all([
      this.updateIndex(client, progressHandler),
      this.updateLibraryIndex(client, progressHandler),
    ]);
  }

  private async updateIndex(
    client: CoreClientProvider.Client,
    progressHandler?: IndexesUpdateProgressHandler
  ): Promise<void> {
    return this.doUpdateIndex(
      () =>
        client.client.updateIndex(
          new UpdateIndexRequest().setInstance(client.instance)
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
    R extends
      | UpdateIndexResponse
      | UpdateLibrariesIndexResponse
      | UpdateCoreLibrariesIndexResponse // not used by IDE2
  >(
    responseProvider: () => grpc.ClientReadableStream<R>,
    progressHandler?: IndexesUpdateProgressHandler,
    task?: string
  ): Promise<void> {
    const progressId = progressHandler?.progressId;
    return retry(
      () =>
        new Promise<void>((resolve, reject) => {
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
                progressId,
              })
            )
            .on('error', reject)
            .on('end', resolve);
        }),
      50,
      3
    );
  }

  private createProgressHandler(): IndexesUpdateProgressHandler {
    const additionalUrlsCount =
      this.configService.cliConfiguration?.board_manager?.additional_urls
        ?.length ?? 0;
    return new IndexesUpdateProgressHandler(
      additionalUrlsCount,
      (progressMessage) =>
        this.notificationService.notifyIndexUpdateDidProgress(progressMessage),
      ({ progressId, message }) =>
        this.notificationService.notifyIndexUpdateDidFail({
          progressId,
          message,
        }),
      (progressId) =>
        this.notificationService.notifyIndexWillUpdate(progressId),
      (progressId) => this.notificationService.notifyIndexDidUpdate(progressId)
    );
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

  protected get onClientDidRefresh(): Event<CoreClientProvider.Client> {
    return this.coreClientProvider.onClientDidRefresh;
  }
}

class IndexUpdateRequiredBeforeInitError extends Error {
  constructor(causes: RpcStatus.AsObject[]) {
    super(`The index of the cores and libraries must be updated before initializing the core gRPC client.
The following problems were detected during the gRPC client initialization:
${causes
  .map(({ code, message }) => ` - code: ${code}, message: ${message}`)
  .join('\n')}
`);
    Object.setPrototypeOf(this, IndexUpdateRequiredBeforeInitError.prototype);
    if (!causes.length) {
      throw new Error(`expected non-empty 'causes'`);
    }
  }
}

function isIndexUpdateRequiredBeforeInit(
  status: RpcStatus[],
  cliConfig: DefaultCliConfig
): IndexUpdateRequiredBeforeInitError | undefined {
  const causes = status
    .filter((s) =>
      IndexUpdateRequiredBeforeInit.map((predicate) =>
        predicate(s, cliConfig)
      ).some(Boolean)
    )
    .map((s) => RpcStatus.toObject(false, s));
  return causes.length
    ? new IndexUpdateRequiredBeforeInitError(causes)
    : undefined;
}
const IndexUpdateRequiredBeforeInit = [
  isPackageIndexMissingStatus,
  isDiscoveryNotFoundStatus,
];
function isPackageIndexMissingStatus(
  status: RpcStatus,
  { directories: { data } }: DefaultCliConfig
): boolean {
  const predicate = ({ message }: RpcStatus.AsObject) =>
    message.includes('loading json index file') &&
    (message.includes(join(data, 'package_index.json')) ||
      message.includes(join(data, 'library_index.json')));
  // https://github.com/arduino/arduino-cli/blob/f0245bc2da6a56fccea7b2c9ea09e85fdcc52cb8/arduino/cores/packagemanager/package_manager.go#L247
  return evaluate(status, predicate);
}
function isDiscoveryNotFoundStatus(status: RpcStatus): boolean {
  const predicate = ({ message }: RpcStatus.AsObject) =>
    message.includes('discovery') &&
    (message.includes('not found') || message.includes('not installed'));
  // https://github.com/arduino/arduino-cli/blob/f0245bc2da6a56fccea7b2c9ea09e85fdcc52cb8/arduino/cores/packagemanager/loader.go#L740
  // https://github.com/arduino/arduino-cli/blob/f0245bc2da6a56fccea7b2c9ea09e85fdcc52cb8/arduino/cores/packagemanager/loader.go#L744
  return evaluate(status, predicate);
}
function evaluate(
  subject: RpcStatus,
  predicate: (error: RpcStatus.AsObject) => boolean
): boolean {
  const status = RpcStatus.toObject(false, subject);
  return predicate(status);
}
