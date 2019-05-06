import { injectable, inject } from 'inversify';
import { BoardsService, Board } from '../common/protocol/boards-service';
import { PlatformSearchReq, PlatformSearchResp, PlatformInstallReq, PlatformInstallResp, PlatformListReq, PlatformListResp } from './cli-protocol/core_pb';
import { CoreClientProvider } from './core-client-provider';

@injectable()
export class BoardsServiceImpl implements BoardsService {

    @inject(CoreClientProvider)
    protected readonly coreClientProvider: CoreClientProvider;

    async connectedBoards(): Promise<{ boards: Board[], current?: Board }> {
        return { boards: [] };
    }

    async search(options: { query?: string }): Promise<{ items: Board[] }> {
        const { client, instance } = await this.coreClientProvider.getClient();

        const installedPlatformsReq = new PlatformListReq();
        installedPlatformsReq.setInstance(instance);
        const installedPlatformsResp = await new Promise<PlatformListResp>((resolve, reject) =>
            client.platformList(installedPlatformsReq,  (err, resp) => (!!err ? reject : resolve)(!!err ? err : resp))
        );
        const installedPlatforms = installedPlatformsResp.getInstalledPlatformList();
        console.info("Installed platforms", installedPlatforms);

        const req = new PlatformSearchReq();
        req.setSearchArgs(options.query || "");
        req.setInstance(instance);
        const resp = await new Promise<PlatformSearchResp>((resolve, reject) => client.platformSearch(req, (err, resp) => (!!err ? reject : resolve)(!!err ? err : resp)));

        let items = resp.getSearchOutputList().map(o => {
            let installedVersion: string | undefined;
            const matchingPlatform = installedPlatforms.find(ip => ip.getId().startsWith(`${o.getId()}@`));
            if (!!matchingPlatform) {
                installedVersion = matchingPlatform.getInstalled();
            }

            const result: Board = {
                id: o.getId(),
                name: o.getName(),
                author: "Someone",
                availableVersions: [ o.getVersion() ],
                description: "lorem ipsum sit dolor amet",
                installable: true,
                summary: "has none",
                installedVersion,
            }
            return result;
        }).sort((a, b) => {
            if (a.name < b.name) {
                return -1;
            } else if (a.name === b.name) {
                return 0;
            } else {
                return 1;
            }
        });

        return { items };
    }

    async install(board: Board): Promise<void> {
        const { client, instance } = await this.coreClientProvider.getClient();

        const [ platform, boardName ] = board.id.split(":");

        const req = new PlatformInstallReq();
        req.setArchitecture(boardName);
        req.setPlatformPackage(platform);
        req.setVersion(board.availableVersions[0]);
        req.setInstance(instance);

        console.info("Starting board installation", board);
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
        console.info("Board installation done", board);
    }

}
