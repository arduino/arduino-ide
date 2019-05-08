import { injectable, inject } from 'inversify';
import { BoardsService, AttachedSerialBoard, AttachedNetworkBoard, BoardPackage, Board } from '../common/protocol/boards-service';
import { PlatformSearchReq, PlatformSearchResp, PlatformInstallReq, PlatformInstallResp, PlatformListReq, PlatformListResp } from './cli-protocol/core_pb';
import { CoreClientProvider } from './core-client-provider';
import { BoardListReq, BoardListResp } from './cli-protocol/board_pb';

@injectable()
export class BoardsServiceImpl implements BoardsService {

    @inject(CoreClientProvider)
    protected readonly coreClientProvider: CoreClientProvider;

    protected selectedBoard: Board | undefined;

    public async getAttachedBoards(): Promise<{ boards: Board[] }> {
        const { client, instance } = await this.coreClientProvider.getClient();

        const req = new BoardListReq();
        req.setInstance(instance);
        const resp = await new Promise<BoardListResp>((resolve, reject) => client.boardList(req, (err, resp) => (!!err ? reject : resolve)(!!err ? err : resp)));

        const serialBoards: Board[] = resp.getSerialList().map(b =>  <AttachedSerialBoard>{
            name: b.getName() || "unknown",
            fqbn: b.getFqbn(),
            port: b.getPort(),
            serialNumber: b.getSerialnumber(),
            productID: b.getProductid(),
            vendorID: b.getVendorid()
        });
        const networkBoards: Board[] = resp.getNetworkList().map(b => <AttachedNetworkBoard>{
            name: b.getName(),
            fqbn: b.getFqbn(),
            address: b.getAddress(),
            info: b.getInfo(),
            port: b.getPort(),
        });

        return { boards: serialBoards.concat(networkBoards) };
    }

    async selectBoard(board: Board): Promise<void> {
        this.selectedBoard = board;
    }

    async getSelectBoard(): Promise<Board | undefined> {
        return this.selectedBoard;
    }

    async search(options: { query?: string }): Promise<{ items: BoardPackage[] }> {
        const { client, instance } = await this.coreClientProvider.getClient();

        const installedPlatformsReq = new PlatformListReq();
        installedPlatformsReq.setInstance(instance);
        const installedPlatformsResp = await new Promise<PlatformListResp>((resolve, reject) =>
            client.platformList(installedPlatformsReq,  (err, resp) => (!!err ? reject : resolve)(!!err ? err : resp))
        );
        const installedPlatforms = installedPlatformsResp.getInstalledPlatformList();

        const req = new PlatformSearchReq();
        req.setSearchArgs(options.query || "");
        req.setInstance(instance);
        const resp = await new Promise<PlatformSearchResp>((resolve, reject) => client.platformSearch(req, (err, resp) => (!!err ? reject : resolve)(!!err ? err : resp)));

        let items = resp.getSearchOutputList().map(item => {
            let installedVersion: string | undefined;
            const matchingPlatform = installedPlatforms.find(ip => ip.getId().startsWith(`${item.getId()}@`));
            if (!!matchingPlatform) {
                installedVersion = matchingPlatform.getInstalled();
            }

            const result: BoardPackage = {
                id: item.getId(),
                name: item.getName(),
                author: item.getAuthor(),
                availableVersions: [ item.getVersion() ],
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
        const { client, instance } = await this.coreClientProvider.getClient();

        const [ platform, boardName ] = pkg.id.split(":");

        const req = new PlatformInstallReq();
        req.setInstance(instance);
        req.setArchitecture(boardName);
        req.setPlatformPackage(platform);
        req.setVersion(pkg.availableVersions[0]);

        console.info("Starting board installation", pkg);
        const resp = client.platformInstall(req);
        resp.on('data', (r: PlatformInstallResp) => {
            const prog = r.getProgress();
            if (prog) {
                console.info(`downloading ${prog.getFile()}: ${prog.getCompleted()}%`)
            }
        });
        await new Promise<void>((resolve, reject) => {
            resp.on('end', resolve);
            resp.on('error', reject);
        });
        console.info("Board installation done", pkg);
    }

}
