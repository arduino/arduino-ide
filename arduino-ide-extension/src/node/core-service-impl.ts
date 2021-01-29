import { FileUri } from '@theia/core/lib/node/file-uri';
import { inject, injectable } from 'inversify';
import { dirname } from 'path';
import { CoreService } from '../common/protocol/core-service';
import { CompileReq, CompileResp } from './cli-protocol/commands/compile_pb';
import { CoreClientProvider } from './core-client-provider';
import { UploadReq, UploadResp, BurnBootloaderReq, BurnBootloaderResp, UploadUsingProgrammerReq, UploadUsingProgrammerResp } from './cli-protocol/commands/upload_pb';
import { OutputService } from '../common/protocol/output-service';
import { NotificationServiceServer } from '../common/protocol';
import { ClientReadableStream } from '@grpc/grpc-js';
import { ArduinoCoreClient } from './cli-protocol/commands/commands_grpc_pb';
import { firstToUpperCase, firstToLowerCase } from '../common/utils';

@injectable()
export class CoreServiceImpl implements CoreService {

    @inject(CoreClientProvider)
    protected readonly coreClientProvider: CoreClientProvider;

    @inject(OutputService)
    protected readonly outputService: OutputService;

    @inject(NotificationServiceServer)
    protected readonly notificationService: NotificationServiceServer;

    async compile(options: CoreService.Compile.Options): Promise<void> {
        this.outputService.append({ name: 'compile', chunk: 'Compile...\n' + JSON.stringify(options, null, 2) + '\n--------------------------\n' });
        const { sketchUri, fqbn } = options;
        const sketchFilePath = FileUri.fsPath(sketchUri);
        const sketchpath = dirname(sketchFilePath);

        const coreClient = await this.coreClient();
        const { client, instance } = coreClient;

        const compilerReq = new CompileReq();
        compilerReq.setInstance(instance);
        compilerReq.setSketchpath(sketchpath);
        if (fqbn) {
            compilerReq.setFqbn(fqbn);
        }
        compilerReq.setOptimizefordebug(options.optimizeForDebug);
        compilerReq.setPreprocess(false);
        compilerReq.setVerbose(options.verbose);
        compilerReq.setQuiet(false);

        const result = client.compile(compilerReq);
        try {
            await new Promise<void>((resolve, reject) => {
                result.on('data', (cr: CompileResp) => {
                    this.outputService.append({ name: 'compile', chunk: Buffer.from(cr.getOutStream_asU8()).toString() });
                    this.outputService.append({ name: 'compile', chunk: Buffer.from(cr.getErrStream_asU8()).toString() });
                });
                result.on('error', error => reject(error));
                result.on('end', () => resolve());
            });
            this.outputService.append({ name: 'compile', chunk: '\n--------------------------\nCompilation complete.\n' });
        } catch (e) {
            this.outputService.append({ name: 'compile', chunk: `Compilation error: ${e}\n`, severity: 'error' });
            throw e;
        }
    }

    async upload(options: CoreService.Upload.Options): Promise<void> {
        await this.doUpload(options, () => new UploadReq(), (client, req) => client.upload(req));
    }

    async uploadUsingProgrammer(options: CoreService.Upload.Options): Promise<void> {
        await this.doUpload(options, () => new UploadUsingProgrammerReq(), (client, req) => client.uploadUsingProgrammer(req), 'upload using programmer');
    }

    protected async doUpload(
        options: CoreService.Upload.Options,
        requestProvider: () => UploadReq | UploadUsingProgrammerReq,
        responseHandler: (client: ArduinoCoreClient, req: UploadReq | UploadUsingProgrammerReq) => ClientReadableStream<UploadResp | UploadUsingProgrammerResp>,
        task: string = 'upload'): Promise<void> {

        await this.compile(options);
        const chunk = firstToUpperCase(task) + '...\n';
        this.outputService.append({ name: 'upload', chunk: chunk + JSON.stringify(options, null, 2) + '\n--------------------------\n' });
        const { sketchUri, fqbn, port, programmer } = options;
        const sketchFilePath = FileUri.fsPath(sketchUri);
        const sketchpath = dirname(sketchFilePath);

        const coreClient = await this.coreClient();
        const { client, instance } = coreClient;

        const req = requestProvider();
        req.setInstance(instance);
        req.setSketchPath(sketchpath);
        if (fqbn) {
            req.setFqbn(fqbn);
        }
        if (port) {
            req.setPort(port);
        }
        if (programmer) {
            req.setProgrammer(programmer.id);
        }
        req.setVerbose(options.verbose);
        req.setVerify(options.verify);
        const result = responseHandler(client, req);

        try {
            await new Promise<void>((resolve, reject) => {
                result.on('data', (resp: UploadResp) => {
                    this.outputService.append({ name: task, chunk: Buffer.from(resp.getOutStream_asU8()).toString() });
                    this.outputService.append({ name: task, chunk: Buffer.from(resp.getErrStream_asU8()).toString() });
                });
                result.on('error', error => reject(error));
                result.on('end', () => resolve());
            });
            this.outputService.append({ name: 'upload', chunk: '\n--------------------------\n' + firstToLowerCase(task) + ' complete.\n' });
        } catch (e) {
            this.outputService.append({ name: 'upload', chunk: `${firstToUpperCase(task)} error: ${e}\n`, severity: 'error' });
            throw e;
        }
    }

    async burnBootloader(options: CoreService.Bootloader.Options): Promise<void> {
        const coreClient = await this.coreClient();
        const { client, instance } = coreClient;
        const { fqbn, port, programmer } = options;
        const burnReq = new BurnBootloaderReq();
        burnReq.setInstance(instance);
        if (fqbn) {
            burnReq.setFqbn(fqbn);
        }
        if (port) {
            burnReq.setPort(port);
        }
        if (programmer) {
            burnReq.setProgrammer(programmer.id);
        }
        burnReq.setVerify(options.verify);
        burnReq.setVerbose(options.verbose);
        const result = client.burnBootloader(burnReq);
        try {
            await new Promise<void>((resolve, reject) => {
                result.on('data', (resp: BurnBootloaderResp) => {
                    this.outputService.append({ name: 'bootloader', chunk: Buffer.from(resp.getOutStream_asU8()).toString() });
                    this.outputService.append({ name: 'bootloader', chunk: Buffer.from(resp.getErrStream_asU8()).toString() });
                });
                result.on('error', error => reject(error));
                result.on('end', () => resolve());
            });
        } catch (e) {
            this.outputService.append({ name: 'bootloader', chunk: `Error while burning the bootloader: ${e}\n`, severity: 'error' });
            throw e;
        }
    }

    private async coreClient(): Promise<CoreClientProvider.Client> {
        const coreClient = await new Promise<CoreClientProvider.Client>(async resolve => {
            const client = await this.coreClientProvider.client();
            if (client) {
                resolve(client);
                return;
            }
            const toDispose = this.coreClientProvider.onClientReady(async () => {
                const client = await this.coreClientProvider.client();
                if (client) {
                    toDispose.dispose();
                    resolve(client);
                    return;
                }
            });
        });
        return coreClient;
    }

}
