import { injectable, inject } from 'inversify';
import { BoardsService, AttachedSerialBoard, BoardPackage, Board, AttachedNetworkBoard } from '../common/protocol/boards-service';
import { PlatformSearchReq, PlatformSearchResp, PlatformInstallReq, PlatformInstallResp, PlatformListReq, PlatformListResp } from './cli-protocol/commands/core_pb';
import { CoreClientProvider } from './core-client-provider';
import { BoardListReq, BoardListResp } from './cli-protocol/commands/board_pb';
import { ToolOutputServiceServer } from '../common/protocol/tool-output-service';

@injectable()
export class BoardsServiceImpl implements BoardsService {

    @inject(CoreClientProvider)
    protected readonly coreClientProvider: CoreClientProvider;

    @inject(ToolOutputServiceServer)
    protected readonly toolOutputService: ToolOutputServiceServer;

    protected selectedBoard: Board | undefined;

    public async getAttachedBoards(): Promise<{ boards: Board[] }> {
        const coreClient = await this.coreClientProvider.getClient();
        const boards: Board[] = [];
        if (!coreClient) {
            return { boards };
        }
        const { client, instance } = coreClient;

        const req = new BoardListReq();
        req.setInstance(instance);
        const resp = await new Promise<BoardListResp>((resolve, reject) => client.boardList(req, (err, resp) => (!!err ? reject : resolve)(!!err ? err : resp)));
        for (const portsList of resp.getPortsList()) {
            const protocol = portsList.getProtocol();
            const address = portsList.getAddress();
            for (const board of portsList.getBoardsList()) {
                const name = board.getName() || 'unknown';
                const fqbn = board.getFqbn();
                const port = address;
                if (protocol === 'serial') {
                    boards.push(<AttachedSerialBoard>{
                        name,
                        fqbn,
                        port
                    });
                } else { // We assume, it is a `network` board.
                    boards.push(<AttachedNetworkBoard>{
                        name,
                        fqbn,
                        address,
                        port
                    });
                }
            }
        }
        return { boards };
    }

    async selectBoard(board: Board): Promise<void> {
        this.selectedBoard = board;
    }

    async getSelectBoard(): Promise<Board | undefined> {
        return this.selectedBoard;
    }

    async search(options: { query?: string }): Promise<{ items: BoardPackage[] }> {
        const coreClient = await this.coreClientProvider.getClient();
        if (!coreClient) {
            return { items: [] };
        }
        const { client, instance } = coreClient;

        const installedPlatformsReq = new PlatformListReq();
        installedPlatformsReq.setInstance(instance);
        const installedPlatformsResp = await new Promise<PlatformListResp>((resolve, reject) =>
            client.platformList(installedPlatformsReq, (err, resp) => (!!err ? reject : resolve)(!!err ? err : resp))
        );
        const installedPlatforms = installedPlatformsResp.getInstalledPlatformList();

        const req = new PlatformSearchReq();
        req.setSearchArgs(options.query || "");
        req.setInstance(instance);
        const resp = await new Promise<PlatformSearchResp>((resolve, reject) => client.platformSearch(req, (err, resp) => (!!err ? reject : resolve)(!!err ? err : resp)));

        let items = resp.getSearchOutputList().map(item => {
            let installedVersion: string | undefined;
            const matchingPlatform = installedPlatforms.find(ip => ip.getId().startsWith(`${item.getId()}`));
            if (!!matchingPlatform) {
                installedVersion = matchingPlatform.getInstalled();
            }

            const result: BoardPackage = {
                id: item.getId(),
                name: item.getName(),
                author: item.getMaintainer(),
                availableVersions: [item.getInstalled()],
                description: item.getBoardsList().map(b => b.getName()).join(", "),
                installable: true,
                summary: "Boards included in this package:",
                installedVersion,
                boards: item.getBoardsList().map(b => <Board>{ name: b.getName(), fqbn: b.getFqbn() }),
            }
            return result;
        });

        return { items };
    }

    async install(pkg: BoardPackage): Promise<void> {
        const coreClient = await this.coreClientProvider.getClient();
        if (!coreClient) {
            return;
        }
        const { client, instance } = coreClient;

        const [platform, boardName] = pkg.id.split(":");

        const req = new PlatformInstallReq();
        req.setInstance(instance);
        req.setArchitecture(boardName);
        req.setPlatformPackage(platform);
        req.setVersion(pkg.availableVersions[0]);

        console.info("Starting board installation", pkg);
        const resp = client.platformInstall(req);
        resp.on('data', (r: PlatformInstallResp) => {
            const prog = r.getProgress();
            if (prog && prog.getFile()) {
                this.toolOutputService.publishNewOutput("board download", `downloading ${prog.getFile()}\n`)
            }
        });
        await new Promise<void>((resolve, reject) => {
            resp.on('end', resolve);
            resp.on('error', reject);
        });
        console.info("Board installation done", pkg);
    }

}
