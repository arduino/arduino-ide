import { injectable, inject } from 'inversify';
import { BoardsService, Board } from '../common/protocol/boards-service';
import { PlatformSearchReq, PlatformSearchResp } from './cli-protocol/core_pb';
import { CoreClientProvider } from './core-client-provider';

@injectable()
export class BoardsServiceImpl implements BoardsService {

    @inject(CoreClientProvider)
    protected readonly coreClientProvider: CoreClientProvider;

    async connectedBoards(): Promise<{ boards: Board[], current?: Board }> {
        return { boards: [] };
    }

    async search(options: { query?: string }): Promise<{ items: Board[] }> {
        let items: Board[] = [];

        const { client, instance } = await this.coreClientProvider.getClient();

        const req = new PlatformSearchReq();
        req.setSearchArgs(options.query || "");
        req.setInstance(instance);
        const resp = await new Promise<PlatformSearchResp>((resolve, reject) => client.platformSearch(req, (err, resp) => (!!err ? reject : resolve)(!!err ? err : resp)));
        items = resp.getSearchOutputList().map(o => <Board>{
            name: o.getName(),
            author: "Someone",
            availableVersions: [],
            description: "lorem ipsum sit dolor amet",
            installable: false,
            summary: "has none"
        });

        return { items };
    }

}
