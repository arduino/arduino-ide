import * as grpc from '@grpc/grpc-js';
import { inject, injectable } from 'inversify';
import { Event, Emitter } from '@theia/core/lib/common/event';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { GrpcClientProvider } from './grpc-client-provider';
import { ArduinoCoreServiceClient } from './cli-protocol/cc/arduino/cli/commands/v1/commands_grpc_pb';
import { Instance } from './cli-protocol/cc/arduino/cli/commands/v1/common_pb';
import { CreateRequest, CreateResponse, InitRequest, InitResponse, UpdateIndexRequest, UpdateIndexResponse, UpdateLibrariesIndexRequest, UpdateLibrariesIndexResponse } from './cli-protocol/cc/arduino/cli/commands/v1/commands_pb';
import * as commandsGrpcPb from './cli-protocol/cc/arduino/cli/commands/v1/commands_grpc_pb';
import { NotificationServiceServer } from '../common/protocol';

@injectable()
export class CoreClientProvider extends GrpcClientProvider<CoreClientProvider.Client> {

    @inject(NotificationServiceServer)
    protected readonly notificationService: NotificationServiceServer;

    protected readonly onClientReadyEmitter = new Emitter<void>();

    get onClientReady(): Event<void> {
        return this.onClientReadyEmitter.event;
    }

    close(client: CoreClientProvider.Client): void {
        client.client.close();
    }

    protected async reconcileClient(port: string | number | undefined): Promise<void> {
        if (port && port === this._port) {
            // No need to create a new gRPC client, but we have to update the indexes.
            if (this._client && !(this._client instanceof Error)) {
                await this.updateIndexes(this._client);
                // We must initialize the client again to get the updated indexes.
                await this.initInstance(this._client);
                this.onClientReadyEmitter.fire();
            }
        } else {
            await super.reconcileClient(port);
            this.onClientReadyEmitter.fire();
        }
    }

    protected async createClient(port: string | number): Promise<CoreClientProvider.Client> {
        // https://github.com/agreatfool/grpc_tools_node_protoc_ts/blob/master/doc/grpcjs_support.md#usage
        // @ts-ignore
        const ArduinoCoreServiceClient = grpc.makeClientConstructor(commandsGrpcPb['cc.arduino.cli.commands.v1.ArduinoCoreService'], 'ArduinoCoreServiceService') as any;
        const client = new ArduinoCoreServiceClient(`localhost:${port}`, grpc.credentials.createInsecure(), this.channelOptions) as ArduinoCoreServiceClient;
        
        const createRes = await new Promise<CreateResponse>((resolve, reject) => {
            client.create(new CreateRequest(), (err, res: CreateResponse) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(res);
            });
        });

        const instance = createRes.getInstance()
        if (!instance) {
            throw new Error('Could not retrieve instance from the initialize response.');
        }

        // Update indexes before init
        await this.updateIndexes({ instance, client });

        // Initialize instance by loading indexes, platforms and libraries
        await this.initInstance({instance, client})

        return { instance, client };
    }

    protected async initInstance({client, instance}: CoreClientProvider.Client): Promise<void> {
        const initReq = new InitRequest();
        initReq.setInstance(instance);
        await new Promise<void>((resolve, reject) => {
            const stream = client.init(initReq)
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

                const err = res.getError()
                if (err) {
                    console.error(err.getMessage())
                }
            });
            stream.on('error', (err) => reject(err));
            stream.on('end', resolve);
        })
    }

    protected async updateIndexes({ client, instance }: CoreClientProvider.Client): Promise<void> {
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
            console.error('Could not update the library index. Please restart to try again.');
        }

        if (indexUpdateSucceeded && libIndexUpdateSucceeded) {
            this.notificationService.notifyIndexUpdated();
        }
    }

    protected async updateLibraryIndex({ client, instance }: CoreClientProvider.Client): Promise<void> {
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
            resp.on('error', reject);
            resp.on('end', resolve);
        });
    }

    protected async updateIndex({ client, instance }: CoreClientProvider.Client): Promise<void> {
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
        const coreClient = await new Promise<CoreClientProvider.Client>(async (resolve, reject) => {
            const handle = (c: CoreClientProvider.Client | Error) => {
                if (c instanceof Error) {
                    reject(c);
                } else {
                    resolve(c);
                }
            }
            const client = await this.coreClientProvider.client();
            if (client) {
                handle(client);
                return;
            }
            const toDispose = new DisposableCollection();
            toDispose.push(this.coreClientProvider.onClientReady(async () => {
                const client = await this.coreClientProvider.client();
                if (client) {
                    handle(client);
                }
                toDispose.dispose();
            }));
        });
        return coreClient;
    }

}
