import { inject, injectable, postConstruct } from 'inversify';
import { FileSystem } from '@theia/filesystem/lib/common/filesystem';
import { CoreService, CoreServiceClient } from '../common/protocol/core-service';
import { CompileReq, CompileResp } from './cli-protocol/commands/compile_pb';
import { BoardsService } from '../common/protocol/boards-service';
import { CoreClientProvider } from './core-client-provider';
import * as path from 'path';
import { ToolOutputServiceServer } from '../common/protocol/tool-output-service';
import { UploadReq, UploadResp } from './cli-protocol/commands/upload_pb';

@injectable()
export class CoreServiceImpl implements CoreService {

    @inject(CoreClientProvider)
    protected readonly coreClientProvider: CoreClientProvider;

    @inject(FileSystem)
    protected readonly fileSystem: FileSystem;

    @inject(BoardsService)
    protected readonly boardsService: BoardsService;

    @inject(ToolOutputServiceServer)
    protected readonly toolOutputService: ToolOutputServiceServer;

    protected client: CoreServiceClient | undefined;

    @postConstruct()
    protected init(): void {
        this.coreClientProvider.onIndexUpdated(() => {
            if (this.client) {
                this.client.notifyIndexUpdated();
            }
        })
    }

    async compile(options: CoreService.Compile.Options): Promise<void> {
        this.toolOutputService.append({ tool: 'compile', chunk: 'Compiling...\n' + JSON.stringify(options, null, 2) + '\n--------------------------\n' });
        const { sketchUri, fqbn } = options;
        const sketchFilePath = await this.fileSystem.getFsPath(sketchUri);
        if (!sketchFilePath) {
            throw new Error(`Cannot resolve filesystem path for URI: ${sketchUri}.`);
        }
        const sketchpath = path.dirname(sketchFilePath);

        const coreClient = await this.coreClientProvider.client();
        if (!coreClient) {
            return;
        }
        const { client, instance } = coreClient;

        if (!fqbn) {
            throw new Error('The selected board has no FQBN.');
        }

        const compilerReq = new CompileReq();
        compilerReq.setInstance(instance);
        compilerReq.setSketchpath(sketchpath);
        compilerReq.setFqbn(fqbn);
        compilerReq.setOptimizefordebug(options.optimizeForDebug);
        compilerReq.setPreprocess(false);
        compilerReq.setVerbose(true);
        compilerReq.setQuiet(false);

        const result = client.compile(compilerReq);
        try {
            await new Promise<void>((resolve, reject) => {
                result.on('data', (cr: CompileResp) => {
                    this.toolOutputService.append({ tool: 'compile', chunk: Buffer.from(cr.getOutStream_asU8()).toString() });
                    this.toolOutputService.append({ tool: 'compile', chunk: Buffer.from(cr.getErrStream_asU8()).toString() });
                });
                result.on('error', error => reject(error));
                result.on('end', () => resolve());
            });
            this.toolOutputService.append({ tool: 'compile', chunk: '\n--------------------------\nCompilation complete.\n' });
        } catch (e) {
            this.toolOutputService.append({ tool: 'compile', chunk: `Compilation error: ${e}\n`, severity: 'error' });
            throw e;
        }
    }

    async upload(options: CoreService.Upload.Options): Promise<void> {
        await this.compile(options);
        this.toolOutputService.append({ tool: 'upload', chunk: 'Uploading...\n' + JSON.stringify(options, null, 2) + '\n--------------------------\n' });
        const { sketchUri, fqbn } = options;
        const sketchFilePath = await this.fileSystem.getFsPath(sketchUri);
        if (!sketchFilePath) {
            throw new Error(`Cannot resolve filesystem path for URI: ${sketchUri}.`);
        }
        const sketchpath = path.dirname(sketchFilePath);

        const coreClient = await this.coreClientProvider.client();
        if (!coreClient) {
            return;
        }
        const { client, instance } = coreClient;

        if (!fqbn) {
            throw new Error('The selected board has no FQBN.');
        }

        const uploadReq = new UploadReq();
        uploadReq.setInstance(instance);
        uploadReq.setSketchPath(sketchpath);
        uploadReq.setFqbn(fqbn);
        if ('port' in options) {
            uploadReq.setPort(options.port);
        } else {
            uploadReq.setProgrammer(options.programmer.id);
        }
        const result = client.upload(uploadReq);

        try {
            await new Promise<void>((resolve, reject) => {
                result.on('data', (cr: UploadResp) => {
                    this.toolOutputService.append({ tool: 'upload', chunk: Buffer.from(cr.getOutStream_asU8()).toString() });
                    this.toolOutputService.append({ tool: 'upload', chunk: Buffer.from(cr.getErrStream_asU8()).toString() });
                });
                result.on('error', error => reject(error));
                result.on('end', () => resolve());
            });
            this.toolOutputService.append({ tool: 'upload', chunk: '\n--------------------------\nUpload complete.\n' });
        } catch (e) {
            this.toolOutputService.append({ tool: 'upload', chunk: `Upload error: ${e}\n`, severity: 'error' });
            throw e;
        }
    }

    setClient(client: CoreServiceClient | undefined): void {
        this.client = client;
    }

    dispose(): void {
        this.client = undefined;
    }

}
