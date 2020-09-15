import * as grpc from '@grpc/grpc-js';
import { inject, injectable } from 'inversify';
import { Event, Emitter } from '@theia/core/lib/common/event';
import { GrpcClientProvider } from './grpc-client-provider';
import { ArduinoCoreClient } from './cli-protocol/commands/commands_grpc_pb';
import * as commandsGrpcPb from './cli-protocol/commands/commands_grpc_pb';
import { Instance } from './cli-protocol/commands/common_pb';
import { InitReq, InitResp, UpdateIndexReq, UpdateIndexResp, UpdateLibrariesIndexResp, UpdateLibrariesIndexReq } from './cli-protocol/commands/commands_pb';
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

    protected async reconcileClient(port: string | undefined): Promise<void> {
        if (port && port === this._port) {
            // No need to create a new gRPC client, but we have to update the indexes.
            if (this._client) {
                await this.updateIndexes(this._client);
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
        const ArduinoCoreClient = grpc.makeClientConstructor(commandsGrpcPb['cc.arduino.cli.commands.ArduinoCore'], 'ArduinoCoreService') as any;
        const client = new ArduinoCoreClient(`localhost:${port}`, grpc.credentials.createInsecure(), this.channelOptions) as ArduinoCoreClient;
        const initReq = new InitReq();
        initReq.setLibraryManagerOnly(false);
        const initResp = await new Promise<InitResp>((resolve, reject) => {
            let resp: InitResp | undefined = undefined;
            const stream = client.init(initReq);
            stream.on('data', (data: InitResp) => resp = data);
            stream.on('end', () => resolve(resp));
            stream.on('error', err => reject(err));
        });

        const instance = initResp.getInstance();
        if (!instance) {
            throw new Error(`Could not retrieve instance from the initialize response.`);
        }

        await this.updateIndexes({ instance, client });

        return { instance, client };
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
        const req = new UpdateLibrariesIndexReq();
        req.setInstance(instance);
        const resp = client.updateLibrariesIndex(req);
        let file: string | undefined;
        resp.on('data', (data: UpdateLibrariesIndexResp) => {
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
        const updateReq = new UpdateIndexReq();
        updateReq.setInstance(instance);
        const updateResp = client.updateIndex(updateReq);
        let file: string | undefined;
        updateResp.on('data', (o: UpdateIndexResp) => {
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
        readonly client: ArduinoCoreClient;
        readonly instance: Instance;
    }
}
