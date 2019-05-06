import { inject, injectable } from 'inversify';
import { FileSystem } from '@theia/filesystem/lib/common/filesystem';
import { CoreService } from '../common/protocol/core-service';
import { CompileReq, CompileResp } from './cli-protocol/compile_pb';
import { BoardsService } from '../common/protocol/boards-service';
import { CoreClientProvider } from './core-client-provider';
import * as path from 'path';
import { ToolOutputServiceServer } from '../common/protocol/tool-output-service';

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

    async compile(options: CoreService.Compile.Options): Promise<void> {
        console.log('compile', options);
        const { uri } = options;
        const sketchFilePath = await this.fileSystem.getFsPath(options.uri);
        if (!sketchFilePath) {
            throw new Error(`Cannot resolve filesystem path for URI: ${uri}.`);
        }
        const sketchpath = path.dirname(sketchFilePath);

        const { client, instance } = await this.coreClientProvider.getClient(uri);
        // const boards = await this.boardsService.connectedBoards();
        // if (!boards.current) {
        //     throw new Error(`No selected board. The connected boards were: ${boards.boards}.`);
        // }
        // https://github.com/cmaglie/arduino-cli/blob/bd5e78701e7546787649d3cca6b21c5d22d0e438/cli/compile/compile.go#L78-L88

        const compilerReq = new CompileReq();
        compilerReq.setInstance(instance);
        compilerReq.setSketchpath(sketchpath);
        compilerReq.setFqbn('arduino:avr:uno'/*boards.current.name*/);
        // request.setShowproperties(false);
        compilerReq.setPreprocess(false);
        // request.setBuildcachepath('');
        // compilerReq.setBuildpath('/tmp/build');
        // compilerReq.setShowproperties(true);
        // request.setBuildpropertiesList([]);
        // request.setWarnings('none');
        compilerReq.setVerbose(true);
        compilerReq.setQuiet(false);
        // request.setVidpid('');
        // request.setExportfile('');

        const result = client.compile(compilerReq);
        return new Promise<void>((resolve, reject) => {
            result.on('data', (cr: CompileResp) => {
                this.toolOutputService.publishNewOutput("compile", new Buffer(cr.getOutStream_asU8()).toString());
                console.error(cr.getErrStream().toString());
            });
            result.on('error', error => reject(error));
            result.on('end', () => resolve());
        });
    }

    upload(): Promise<void> {
        throw new Error("Method not implemented.");
    }

}
