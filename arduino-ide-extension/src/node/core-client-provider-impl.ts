import { inject, injectable } from 'inversify';
import * as grpc from 'grpc';
import { ArduinoCoreClient } from './cli-protocol/commands_grpc_pb';
import { InitResp, InitReq, Configuration, UpdateIndexReq, UpdateIndexResp } from './cli-protocol/commands_pb';
import { WorkspaceServiceExt } from '../browser/workspace-service-ext';
import { FileSystem } from '@theia/filesystem/lib/common';
import URI from '@theia/core/lib/common/uri';
import { CoreClientProvider, Client } from './core-client-provider';
import * as PQueue from 'p-queue';
import { ToolOutputServiceServer } from '../common/protocol/tool-output-service';
import { Instance } from './cli-protocol/common_pb';

@injectable()
export class CoreClientProviderImpl implements CoreClientProvider {

    protected readonly clientRequestQueue = new PQueue({ autoStart: true, concurrency: 1 });

    @inject(FileSystem)
    protected readonly fileSystem: FileSystem;

    @inject(WorkspaceServiceExt)
    protected readonly workspaceServiceExt: WorkspaceServiceExt;

    @inject(ToolOutputServiceServer)
    protected readonly toolOutputService: ToolOutputServiceServer;

    protected clients = new Map<string, Client>();

    async getClient(workspaceRootOrResourceUri?: string): Promise<Client> {
        return this.clientRequestQueue.add(() => new Promise<Client>(async resolve => {
            const roots = await this.workspaceServiceExt.roots();
            if (!workspaceRootOrResourceUri) {
                resolve(this.getOrCreateClient(roots[0]));
                return;
            }
            const root = roots
                .sort((left, right) => right.length - left.length) // Longest "paths" first
                .map(uri => new URI(uri))
                .find(uri => uri.isEqualOrParent(new URI(workspaceRootOrResourceUri)));
            if (!root) {
                console.warn(`Could not retrieve the container workspace root for URI: ${workspaceRootOrResourceUri}.`);
                console.warn(`Falling back to ${roots[0]}`);
                resolve(this.getOrCreateClient(roots[0]));
                return;
            }
            resolve(this.getOrCreateClient(root.toString()));
        }));
    }

    protected async getOrCreateClient(rootUri: string): Promise<Client> {
        const existing = this.clients.get(rootUri);
        if (existing) {
            console.debug(`Reusing existing client for ${rootUri}.`);
            return existing;
        }

        console.info(` >>> Creating and caching a new client for ${rootUri}...`);
        const client = new ArduinoCoreClient('localhost:50051', grpc.credentials.createInsecure());

        const config = new Configuration();
        const rootPath = await this.fileSystem.getFsPath(rootUri);
        if (!rootPath) {
            throw new Error(`Could not resolve file-system path of URI: ${rootUri}.`);
        }
        config.setSketchbookdir(rootPath);
        config.setDatadir(rootPath);
        config.setDownloadsdir(rootPath);

        const initReq = new InitReq();
        initReq.setConfiguration(config);
        const initResp = await new Promise<InitResp>((resolve, reject) => client.init(initReq, (err, resp) => (!!err ? reject : resolve)(!!err ? err : resp)));
        const instance = initResp.getInstance();
        if (!instance) {
            throw new Error(`Could not retrieve instance from the initialize response.`);
        }

        // in a seperate promise, try and update the index
        let succeeded = true;
        for (let i = 0; i < 10; i++) {
            try {
                await this.updateIndex(client, instance);
                succeeded = true;
                break;
            } catch (e) {
                this.toolOutputService.publishNewOutput("daemon", `Error while updating index in attempt ${i}: ${e}`);
            }
        }
        if (!succeeded) {
            this.toolOutputService.publishNewOutput("daemon", `Was unable to update the index. Please restart to try again.`);
        }

        const result = {
            client,
            instance
        }
        this.clients.set(rootUri, result);
        console.info(` <<< New client has been successfully created and cached for ${rootUri}.`);
        return result;
    }

    protected async updateIndex(client: ArduinoCoreClient, instance: Instance): Promise<void> {
        const updateReq = new UpdateIndexReq();
        updateReq.setInstance(instance);
        const updateResp = client.updateIndex(updateReq);
        updateResp.on('data', (o: UpdateIndexResp) => {
            const progress = o.getDownloadProgress();
            if (progress) {
                if (progress.getCompleted()) {
                    this.toolOutputService.publishNewOutput("daemon", `Download${progress.getFile() ? ` of ${progress.getFile()}` : ''} completed.\n`);
                }
            }
        });
        await new Promise<void>((resolve, reject) => {
            updateResp.on('error', reject);
            updateResp.on('end', resolve);
        });
    }

}