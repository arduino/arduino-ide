import { injectable, inject } from 'inversify';
import { Library, LibraryService } from '../common/protocol/library-service';
import { CoreClientProvider } from './core-client-provider';
import {
    LibrarySearchReq,
    LibrarySearchResp,
    LibraryListReq,
    LibraryListResp,
    LibraryRelease,
    InstalledLibrary,
    LibraryInstallReq,
    LibraryInstallResp,
    LibraryUninstallReq,
    LibraryUninstallResp
} from './cli-protocol/commands/lib_pb';
import { ToolOutputServiceServer } from '../common/protocol/tool-output-service';
import { Installable } from '../common/protocol/installable';

@injectable()
export class LibraryServiceImpl implements LibraryService {

    @inject(CoreClientProvider)
    protected readonly coreClientProvider: CoreClientProvider;

    @inject(ToolOutputServiceServer)
    protected readonly toolOutputService: ToolOutputServiceServer;

    async search(options: { query?: string }): Promise<Library[]> {
        const coreClient = await this.coreClientProvider.client();
        if (!coreClient) {
            return [];
        }
        const { client, instance } = coreClient;

        const listReq = new LibraryListReq();
        listReq.setInstance(instance);
        const installedLibsResp = await new Promise<LibraryListResp>((resolve, reject) => client.libraryList(listReq, (err, resp) => !!err ? reject(err) : resolve(resp)));
        const installedLibs = installedLibsResp.getInstalledLibraryList();
        const installedLibsIdx = new Map<string, InstalledLibrary>();
        for (const installedLib of installedLibs) {
            if (installedLib.hasLibrary()) {
                const lib = installedLib.getLibrary();
                if (lib) {
                    installedLibsIdx.set(lib.getRealName(), installedLib);
                }
            }
        }

        const req = new LibrarySearchReq();
        req.setQuery(options.query || '');
        req.setInstance(instance);
        const resp = await new Promise<LibrarySearchResp>((resolve, reject) => client.librarySearch(req, (err, resp) => !!err ? reject(err) : resolve(resp)));
        const items = resp.getLibrariesList()
            .filter(item => !!item.getLatest())
            .slice(0, 50)
            .map(item => {
                // TODO: This seems to contain only the latest item instead of all of the items.
                const availableVersions = item.getReleasesMap().getEntryList().map(([key, _]) => key).sort(Installable.Version.COMPARATOR);
                let installedVersion: string | undefined;
                const installed = installedLibsIdx.get(item.getName());
                if (installed) {
                    installedVersion = installed.getLibrary()!.getVersion();
                }
                return toLibrary({
                    name: item.getName(),
                    installable: true,
                    installedVersion,
                }, item.getLatest()!, availableVersions)
            })

        return items;
    }

    async install(options: { item: Library, version?: Installable.Version }): Promise<void> {
        const library = options.item;
        const version = !!options.version ? options.version : library.availableVersions[0];
        const coreClient = await this.coreClientProvider.client();
        if (!coreClient) {
            return;
        }
        const { client, instance } = coreClient;

        const req = new LibraryInstallReq();
        req.setInstance(instance);
        req.setName(library.name);
        req.setVersion(version);

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

    async uninstall(options: { item: Library }): Promise<void> {
        const library = options.item;
        const coreClient = await this.coreClientProvider.client();
        if (!coreClient) {
            return;
        }
        const { client, instance } = coreClient;

        const req = new LibraryUninstallReq();
        req.setInstance(instance);
        req.setName(library.name);
        req.setVersion(library.installedVersion!);

        let logged = false;
        const resp = client.libraryUninstall(req);
        resp.on('data', (_: LibraryUninstallResp) => {
            if (!logged) {
                this.toolOutputService.publishNewOutput("library uninstall", `uninstalling ${library.name}:${library.installedVersion}%\n`)
                logged = true;
            }
        });
        await new Promise<void>((resolve, reject) => {
            resp.on('end', resolve);
            resp.on('error', reject);
        });
    }

}

function toLibrary(tpl: Partial<Library>, release: LibraryRelease, availableVersions: string[]): Library {
    return {
        name: "",
        installable: false,
        ...tpl,

        author: release.getAuthor(),
        availableVersions,
        description: release.getSentence(),
        moreInfoLink: release.getWebsite(),
        summary: release.getParagraph()
    }
}
