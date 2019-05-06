import { inject, injectable } from 'inversify';
import { FileSystem } from '@theia/filesystem/lib/common/filesystem';
import { CoreService } from '../common/protocol/core-service';
import { CompileReq } from './cli-protocol/compile_pb';
import { BoardsService } from '../common/protocol/boards-service';
import { CoreClientProvider } from './core-client-provider';
import { PlatformInstallReq } from './cli-protocol/core_pb';
import { LibraryInstallReq } from './cli-protocol/lib_pb';

@injectable()
export class CoreServiceImpl implements CoreService {

    @inject(CoreClientProvider)
    protected readonly coreClientProvider: CoreClientProvider;

    @inject(FileSystem)
    protected readonly fileSystem: FileSystem;

    @inject(BoardsService)
    protected readonly boardsService: BoardsService;

    async compile(options: CoreService.Compile.Options): Promise<string> {
        console.log('compile', options);
        const { uri } = options;
        const sketchpath = await this.fileSystem.getFsPath(options.uri);
        if (!sketchpath) {
            throw new Error(`Cannot resolve FS path for URI: ${uri}.`);
        }
        const { client, instance } = await this.coreClientProvider.getClient(uri);
        // const boards = await this.boardsService.connectedBoards();
        // if (!boards.current) {
        //     throw new Error(`No selected board. The connected boards were: ${boards.boards}.`);
        // }
        // https://github.com/cmaglie/arduino-cli/blob/bd5e78701e7546787649d3cca6b21c5d22d0e438/cli/compile/compile.go#L78-L88

        const installPlatformReq = new PlatformInstallReq();
        installPlatformReq.setArchitecture('samd');
        installPlatformReq.setVersion('1.6.0');
        installPlatformReq.setInstance(instance);
        const resp = client.platformInstall(installPlatformReq);
        console.log(resp);



        const installLibReq = new LibraryInstallReq();
        installLibReq.setInstance(instance);
        installLibReq.setName('arduino:samd');
        const installResp = client.libraryInstall(installLibReq);
        const xxx = await new Promise<string>((resolve, reject) => {
            const chunks: Buffer[] = [];
            installResp.on('data', (chunk: Buffer) => chunks.push(chunk));
            installResp.on('error', error => reject(error));
            installResp.on('end', () => resolve(Buffer.concat(chunks).toString('utf8').trim()))
        });
        console.log('xxx', xxx);

        const compilerReq = new CompileReq();
        compilerReq.setInstance(instance);
        compilerReq.setSketchpath(sketchpath);
        compilerReq.setFqbn('arduino:samd'/*boards.current.name*/);
        // request.setShowproperties(false);
        // request.setPreprocess(false);
        // request.setBuildcachepath('');
        // request.setBuildpath('');
        // request.setBuildpropertiesList([]);
        // request.setWarnings('none');
        // request.setVerbose(true);
        // request.setQuiet(false);
        // request.setVidpid('');
        // request.setExportfile('');
        const result = client.compile(compilerReq);
        return new Promise<string>((resolve, reject) => {
            const chunks: Buffer[] = [];
            result.on('data', (chunk: Buffer) => chunks.push(chunk));
            result.on('error', error => reject(error));
            result.on('end', () => resolve(Buffer.concat(chunks).toString('utf8').trim()))
        });
    }

    upload(): Promise<void> {
        throw new Error("Method not implemented.");
    }

}
