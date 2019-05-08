import { injectable, inject } from 'inversify';
import { Library, LibraryService } from '../common/protocol/library-service';
import { CoreClientProvider } from './core-client-provider';
import { LibrarySearchReq, LibrarySearchResp, LibraryListReq, LibraryListResp, LibraryRelease,
    InstalledLibrary, LibraryInstallReq, LibraryInstallResp } from './cli-protocol/lib_pb';
import { ToolOutputServiceServer } from '../common/protocol/tool-output-service';

@injectable()
export class LibraryServiceImpl implements LibraryService {

    @inject(CoreClientProvider)
    protected readonly coreClientProvider: CoreClientProvider;

    @inject(ToolOutputServiceServer)
    protected readonly toolOutputService: ToolOutputServiceServer;

    async search(options: { query?: string; }): Promise<{ items: Library[] }> {
        const coreClient = await this.coreClientProvider.getClient();
        if (!coreClient) {
            return { items: [] };
        }
        const { client, instance } = coreClient;

        const listReq = new LibraryListReq();
        listReq.setInstance(instance);
        const installedLibsResp = await new Promise<LibraryListResp>((resolve, reject) => client.libraryList(listReq, (err, resp) => !!err ? reject(err) : resolve(resp)));
        const installedLibs = installedLibsResp.getLibrariesList();
        const installedLibsIdx = new Map<string, InstalledLibrary>();
        installedLibs.forEach(l => installedLibsIdx.set(l.getName(), l));

        const req = new LibrarySearchReq();
        req.setQuery(options.query || '');
        req.setInstance(instance);
        const resp = await new Promise<LibrarySearchResp>((resolve, reject) => client.librarySearch(req, (err, resp) => !!err ? reject(err) : resolve(resp)));
        const items = resp.getSearchOutputList()
            .filter(item => !!item.getLatest())
            .slice(0, 50)
            .map(item => {
                let installedVersion: string | undefined;
                const installed = installedLibsIdx.get(item.getName());
                if (installed) {
                    installedVersion = installed.getInstalled()!.getVersion();
                }
                return toLibrary({
                    name: item.getName(),
                    installable: true,
                    installedVersion
                }, item.getLatest()!)
            })

        return { items };
    }

    async install(library: Library): Promise<void> {
        const coreClient = await this.coreClientProvider.getClient();
        if (!coreClient) {
            return;
        }
        const { client, instance } = coreClient;

        const req = new LibraryInstallReq();
        req.setInstance(instance);
        req.setName(library.name);
        req.setVersion(library.availableVersions[0]);

        const resp = client.libraryInstall(req);
        resp.on('data', (r: LibraryInstallResp) => {
            const prog = r.getProgress();
            if (prog) {
                this.toolOutputService.publishNewOutput("library download", `downloading ${prog.getFile()}: ${prog.getCompleted()}%\n`)
            }
        });
        await new Promise<void>((resolve, reject) => {
            resp.on('end', resolve);
            resp.on('error', reject);
        });
    }

}

function toLibrary(tpl: Partial<Library>, release: LibraryRelease): Library {
    return {
        name: "",
        installable: false,
        ...tpl,

        author: release.getAuthor(),
        availableVersions: [release.getVersion()],
        description: release.getSentence(),
        moreInfoLink: release.getWebsite(),
        summary: release.getParagraph()
    }
}
