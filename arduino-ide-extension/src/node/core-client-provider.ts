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
import { Deferred } from '@theia/core/lib/common/promise-util';
import { Status as RpcStatus } from './cli-protocol/google/rpc/status_pb';

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
          if (
            this.isPackageIndexMissingError(error) ||
            this.isDiscoveryNotFoundError(error)
          ) {
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

  private isPackageIndexMissingError(error: unknown): boolean {
    const assert = (message: string) =>
      message.includes('loading json index file');
    // https://github.com/arduino/arduino-cli/blob/f0245bc2da6a56fccea7b2c9ea09e85fdcc52cb8/arduino/cores/packagemanager/package_manager.go#L247
    return this.isRpcStatusError(error, assert);
  }

  private isDiscoveryNotFoundError(error: unknown): boolean {
    const assert = (message: string) =>
      message.includes('discovery') &&
      (message.includes('not found') || message.includes('not installed'));
    // https://github.com/arduino/arduino-cli/blob/f0245bc2da6a56fccea7b2c9ea09e85fdcc52cb8/arduino/cores/packagemanager/loader.go#L740
    // https://github.com/arduino/arduino-cli/blob/f0245bc2da6a56fccea7b2c9ea09e85fdcc52cb8/arduino/cores/packagemanager/loader.go#L744
    return this.isRpcStatusError(error, assert);
  }

  private isCancelError(error: unknown): boolean {
    return (
      error instanceof Error &&
      error.message.toLocaleLowerCase().includes('cancelled on client')
    );
  }

  // Final error codes are not yet defined by the CLI. Hence, we do string matching in the message RPC status.
  private isRpcStatusError(
    error: unknown,
    assert: (message: string) => boolean
  ) {
    if (error instanceof RpcStatus) {
      const { message } = RpcStatus.toObject(false, error);
      return assert(message.toLocaleLowerCase());
    }
    return false;
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
      const errorStatus: RpcStatus[] = [];
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
          console.error(error.getMessage());
          errorStatus.push(error);
          // Cancel the init request. No need to wait until the end of the event. The init has already failed.
          // Canceling the request will result in a cancel error, but we need to reject with the original error later.
          stream.cancel();
        }
      });
      stream.on('error', (error) => {
        // On any error during the init request, the request is canceled.
        // On cancel, the IDE2 ignores the cancel error and rejects with the original one.
        reject(
          this.isCancelError(error) && errorStatus.length
            ? errorStatus[0]
            : error
        );
      });
      stream.on('end', () =>
        errorStatus.length ? reject(errorStatus) : resolve()
      );
    });
  }

  protected async updateIndexes({
    client,
    instance,
  }: CoreClientProvider.Client): Promise<CoreClientProvider.Client> {
    // in a separate promise, try and update the index
    let indexUpdateSucceeded = true;
    for (let i = 0; i < 10; i++) {
      try {
        await this.updateIndex({ client, instance });
        indexUpdateSucceeded = true;
        break;
      } catch (e) {
        console.error(`Error while updating index in attempt ${i}.`, e);
      }
    }
    if (!indexUpdateSucceeded) {
      console.error('Could not update the index. Please restart to try again.');
    }

    let libIndexUpdateSucceeded = true;
    for (let i = 0; i < 10; i++) {
      try {
        await this.updateLibraryIndex({ client, instance });
        libIndexUpdateSucceeded = true;
        break;
      } catch (e) {
        console.error(`Error while updating library index in attempt ${i}.`, e);
      }
    }
    if (!libIndexUpdateSucceeded) {
      console.error(
        'Could not update the library index. Please restart to try again.'
      );
    }

    if (indexUpdateSucceeded && libIndexUpdateSucceeded) {
      this.notificationService.notifyIndexUpdated();
    }
    return { client, instance };
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
