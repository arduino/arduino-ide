import * as fs from 'fs';
import * as path from 'path';
import * as grpc from '@grpc/grpc-js';
import * as PQueue from 'p-queue';
import { inject, injectable } from 'inversify';
import URI from '@theia/core/lib/common/uri';
import { FileSystem } from '@theia/filesystem/lib/common';
import { WorkspaceServiceExt } from '../browser/workspace-service-ext';
import { ToolOutputServiceServer } from '../common/protocol/tool-output-service';
import { ArduinoCoreClient } from './cli-protocol/commands/commands_grpc_pb';
import {
    InitResp,
    InitReq,
    Configuration,
    UpdateIndexReq,
    UpdateIndexResp,
    UpdateLibrariesIndexReq,
    UpdateLibrariesIndexResp
} from './cli-protocol/commands/commands_pb';
import { ArduinoCli } from './arduino-cli';
import { Instance } from './cli-protocol/commands/common_pb';
import { CoreClientProvider, Client } from './core-client-provider';
import { FileUri } from '@theia/core/lib/node';

@injectable()
export class CoreClientProviderImpl implements CoreClientProvider {

    protected clients = new Map<string, Client>();
    protected readonly clientRequestQueue = new PQueue({ autoStart: true, concurrency: 1 });

    @inject(FileSystem)
    protected readonly fileSystem: FileSystem;

    @inject(WorkspaceServiceExt)
    protected readonly workspaceServiceExt: WorkspaceServiceExt;

    @inject(ToolOutputServiceServer)
    protected readonly toolOutputService: ToolOutputServiceServer;

    @inject(ArduinoCli)
    protected readonly cli: ArduinoCli;

    async getClient(workspaceRootOrResourceUri?: string): Promise<Client | undefined> {
        return this.clientRequestQueue.add(() => new Promise<Client | undefined>(async resolve => {
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

    protected async getOrCreateClient(rootUri: string | undefined): Promise<Client | undefined> {
        if (!rootUri) {
            return undefined;
        }
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
            throw new Error(`Could not resolve filesystem path of URI: ${rootUri}.`);
        }

        const { dataDirUri, sketchDirUri } = await this.cli.getDefaultConfig();
        const dataDirPath = FileUri.fsPath(dataDirUri);
        const sketchDirPath = FileUri.fsPath(sketchDirUri);

        if (!fs.existsSync(dataDirPath)) {
            fs.mkdirSync(dataDirPath);
        }

        if (!fs.existsSync(sketchDirPath)) {
            fs.mkdirSync(sketchDirPath);
        }

        const downloadDir = path.join(dataDirPath, 'staging');
        if (!fs.existsSync(downloadDir)) {
            fs.mkdirSync(downloadDir);
        }

        config.setSketchbookdir(sketchDirPath);
        config.setDatadir(dataDirPath);
        config.setDownloadsdir(downloadDir);
        config.setBoardmanageradditionalurlsList(['https://downloads.arduino.cc/packages/package_index.json']);

        const initReq = new InitReq();
        initReq.setConfiguration(config);
        initReq.setLibraryManagerOnly(false);
        const initResp = await new Promise<InitResp>(resolve => {
            let resp: InitResp | undefined = undefined;
            const stream = client.init(initReq);
            stream.on('data', (data: InitResp) => resp = data);
            stream.on('end', () => resolve(resp));
        });

        const instance = initResp.getInstance();
        if (!instance) {
            throw new Error(`Could not retrieve instance from the initialize response.`);
        }

        // in a separate promise, try and update the index
        let indexUpdateSucceeded = true;
        for (let i = 0; i < 10; i++) {
            try {
                await this.updateIndex(client, instance);
                indexUpdateSucceeded = true;
                break;
            } catch (e) {
                this.toolOutputService.publishNewOutput("daemon", `Error while updating index in attempt ${i}: ${e}`);
            }
        }
        if (!indexUpdateSucceeded) {
            this.toolOutputService.publishNewOutput("daemon", `Was unable to update the index. Please restart to try again.`);
        }

        let libIndexUpdateSucceeded = true;
        for (let i = 0; i < 10; i++) {
            try {
                await this.updateLibraryIndex(client, instance);
                libIndexUpdateSucceeded = true;
                break;
            } catch (e) {
                this.toolOutputService.publishNewOutput("daemon", `Error while updating library index in attempt ${i}: ${e}`);
            }
        }
        if (!libIndexUpdateSucceeded) {
            this.toolOutputService.publishNewOutput("daemon", `Was unable to update the library index. Please restart to try again.`);
        }

        const result = {
            client,
            instance
        }
        this.clients.set(rootUri, result);
        console.info(` <<< New client has been successfully created and cached for ${rootUri}.`);
        return result;
    }

    protected async updateLibraryIndex(client: ArduinoCoreClient, instance: Instance): Promise<void> {
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
                            this.toolOutputService.publishNewOutput("daemon", `${file} completed.\n`);
                        } else {
                            this.toolOutputService.publishNewOutput("daemon", `Download of '${file}' completed.\n'`);
                        }
                    } else {
                        this.toolOutputService.publishNewOutput("daemon", `The library index has been successfully updated.\n'`);
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


    protected async updateIndex(client: ArduinoCoreClient, instance: Instance): Promise<void> {
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
                            this.toolOutputService.publishNewOutput("daemon", `${file} completed.\n`);
                        } else {
                            this.toolOutputService.publishNewOutput("daemon", `Download of '${file}' completed.\n'`);
                        }
                    } else {
                        this.toolOutputService.publishNewOutput("daemon", `The index has been successfully updated.\n'`);
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
