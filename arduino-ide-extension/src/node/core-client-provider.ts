import * as grpc from '@grpc/grpc-js';
import {
  inject,
  injectable,
  postConstruct,
} from '@theia/core/shared/inversify';
import { Event, Emitter } from '@theia/core/lib/common/event';
import { GrpcClientProvider } from './grpc-client-provider';
import { ArduinoCoreServiceClient } from './cli-protocol/cc/arduino/cli/commands/v1/commands_grpc_pb';
import { Instance } from './cli-protocol/cc/arduino/cli/commands/v1/common_pb';
import {
  CreateRequest,
  CreateResponse,
  InitRequest,
  InitResponse,
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

@injectable()
export class CoreClientProvider extends GrpcClientProvider<CoreClientProvider.Client> {
  @inject(NotificationServiceServer)
  protected readonly notificationService: NotificationServiceServer;

  protected readonly onClientReadyEmitter = new Emitter<void>();

  protected _created = new Deferred<void>();
  protected _initialized = new Deferred<void>();

  get created(): Promise<void> {
    return this._created.promise;
  }

  get initialized(): Promise<void> {
    return this._initialized.promise;
  }

  get onClientReady(): Event<void> {
    return this.onClientReadyEmitter.event;
  }

  close(client: CoreClientProvider.Client): void {
    client.client.close();
    this._created.reject();
    this._initialized.reject();
    this._created = new Deferred<void>();
    this._initialized = new Deferred<void>();
  }

  protected override async reconcileClient(port: string): Promise<void> {
    if (port && port === this._port) {
      // No need to create a new gRPC client, but we have to update the indexes.
      if (this._client && !(this._client instanceof Error)) {
        await this.updateIndexes(this._client);
        this.onClientReadyEmitter.fire();
      }
    } else {
      await super.reconcileClient(port);
      this.onClientReadyEmitter.fire();
    }
  }

  @postConstruct()
  protected override init(): void {
    this.daemon.getPort().then(async (port) => {
      // First create the client and the instance synchronously
      // and notify client is ready.
      // TODO: Creation failure should probably be handled here
      await this.reconcileClient(port); // create instance
      this._created.resolve();

      // Normal startup workflow:
      // 1. create instance,
      // 2. init instance,
      // 3. update indexes asynchronously.

      // First startup workflow:
      // 1. create instance,
      // 2. update indexes and wait,
      // 3. init instance.
      if (this._client && !(this._client instanceof Error)) {
        try {
          await this.initInstance(this._client); // init instance
          this._initialized.resolve();
          this.updateIndex(this._client); // Update the indexes asynchronously
        } catch (error: unknown) {
          console.error(
            'Error occurred while initializing the core gRPC client provider',
            error
          );
          if (error instanceof IndexUpdateRequiredBeforeInitError) {
            // If it's a first start, IDE2 must run index update before the init request.
            await this.updateIndexes(this._client);
            await this.initInstance(this._client);
            this._initialized.resolve();
          } else {
            throw error;
          }
        }
      }
    });

    this.daemon.onDaemonStopped(() => {
      if (this._client && !(this._client instanceof Error)) {
        this.close(this._client);
      }
      this._client = undefined;
      this._port = undefined;
    });
  }

  protected async createClient(
    port: string | number
  ): Promise<CoreClientProvider.Client> {
    // https://github.com/agreatfool/grpc_tools_node_protoc_ts/blob/master/doc/grpcjs_support.md#usage
    const ArduinoCoreServiceClient = grpc.makeClientConstructor(
      // @ts-expect-error: ignore
      commandsGrpcPb['cc.arduino.cli.commands.v1.ArduinoCoreService'],
      'ArduinoCoreServiceService'
    ) as any;
    const client = new ArduinoCoreServiceClient(
      `localhost:${port}`,
      grpc.credentials.createInsecure(),
      this.channelOptions
    ) as ArduinoCoreServiceClient;

    const createRes = await new Promise<CreateResponse>((resolve, reject) => {
      client.create(new CreateRequest(), (err, res: CreateResponse) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(res);
      });
    });

    const instance = createRes.getInstance();
    if (!instance) {
      throw new Error(
        'Could not retrieve instance from the initialize response.'
      );
    }

    return { instance, client };
  }

  protected async initInstance({
    client,
    instance,
  }: CoreClientProvider.Client): Promise<void> {
    const initReq = new InitRequest();
    initReq.setInstance(instance);
    return new Promise<void>((resolve, reject) => {
      const stream = client.init(initReq);
      const errors: RpcStatus[] = [];
      stream.on('data', (res: InitResponse) => {
        const progress = res.getInitProgress();
        if (progress) {
          const downloadProgress = progress.getDownloadProgress();
          if (downloadProgress && downloadProgress.getCompleted()) {
            const file = downloadProgress.getFile();
            console.log(`Downloaded ${file}`);
          }
          const taskProgress = progress.getTaskProgress();
          if (taskProgress && taskProgress.getCompleted()) {
            const name = taskProgress.getName();
            console.log(`Completed ${name}`);
          }
        }

        const error = res.getError();
        if (error) {
          const { code, message } = Status.toObject(false, error);
          console.error(
            `Detected an error response during the gRPC core client initialization: code: ${code}, message: ${message}`
          );
          errors.push(error);
        }
      });
      stream.on('error', reject);
      stream.on('end', () => {
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
    const error = isIndexUpdateRequiredBeforeInit(status); // put future error matching here
    return error;
  }

  protected async updateIndexes(
    client: CoreClientProvider.Client
  ): Promise<CoreClientProvider.Client> {
    await Promise.all([
      retry(() => this.updateIndex(client), 50, 3),
      retry(() => this.updateLibraryIndex(client), 50, 3),
    ]);
    this.notificationService.notifyIndexUpdated();
    return client;
  }

  protected async updateLibraryIndex({
    client,
    instance,
  }: CoreClientProvider.Client): Promise<void> {
    const req = new UpdateLibrariesIndexRequest();
    req.setInstance(instance);
    const resp = client.updateLibrariesIndex(req);
    let file: string | undefined;
    resp.on('data', (data: UpdateLibrariesIndexResponse) => {
      const progress = data.getDownloadProgress();
      if (progress) {
        if (!file && progress.getFile()) {
          file = `${progress.getFile()}`;
        }
        if (progress.getCompleted()) {
          if (file) {
            if (/\s/.test(file)) {
              console.log(`${file} completed.`);
            } else {
              console.log(`Download of '${file}' completed.`);
            }
          } else {
            console.log('The library index has been successfully updated.');
          }
          file = undefined;
        }
      }
    });
    await new Promise<void>((resolve, reject) => {
      resp.on('error', (error) => {
        reject(error);
      });
      resp.on('end', resolve);
    });
  }

  protected async updateIndex({
    client,
    instance,
  }: CoreClientProvider.Client): Promise<void> {
    const updateReq = new UpdateIndexRequest();
    updateReq.setInstance(instance);
    const updateResp = client.updateIndex(updateReq);
    let file: string | undefined;
    updateResp.on('data', (o: UpdateIndexResponse) => {
      const progress = o.getDownloadProgress();
      if (progress) {
        if (!file && progress.getFile()) {
          file = `${progress.getFile()}`;
        }
        if (progress.getCompleted()) {
          if (file) {
            if (/\s/.test(file)) {
              console.log(`${file} completed.`);
            } else {
              console.log(`Download of '${file}' completed.`);
            }
          } else {
            console.log('The index has been successfully updated.');
          }
          file = undefined;
        }
      }
    });
    await new Promise<void>((resolve, reject) => {
      updateResp.on('error', reject);
      updateResp.on('end', resolve);
    });
  }
}
export namespace CoreClientProvider {
  export interface Client {
    readonly client: ArduinoCoreServiceClient;
    readonly instance: Instance;
  }
}

@injectable()
export abstract class CoreClientAware {
  @inject(CoreClientProvider)
  protected readonly coreClientProvider: CoreClientProvider;

  protected async coreClient(): Promise<CoreClientProvider.Client> {
    return await new Promise<CoreClientProvider.Client>(
      async (resolve, reject) => {
        const client = await this.coreClientProvider.client();
        if (client && client instanceof Error) {
          reject(client);
        } else if (client) {
          return resolve(client);
        }
      }
    );
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
  status: RpcStatus[]
): IndexUpdateRequiredBeforeInitError | undefined {
  const causes = status
    .filter((s) =>
      IndexUpdateRequiredBeforeInit.map((predicate) => predicate(s)).some(
        Boolean
      )
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
function isPackageIndexMissingStatus(status: RpcStatus): boolean {
  const predicate = ({ message }: RpcStatus.AsObject) =>
    message.includes('loading json index file');
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
