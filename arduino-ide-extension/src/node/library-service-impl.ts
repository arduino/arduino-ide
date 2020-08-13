import { injectable, inject, postConstruct } from 'inversify';
import { LibraryPackage, LibraryService, LibraryServiceClient } from '../common/protocol/library-service';
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
import { ILogger, notEmpty } from '@theia/core';
import { Deferred } from '@theia/core/lib/common/promise-util';

@injectable()
export class LibraryServiceImpl implements LibraryService {

    @inject(ILogger)
    protected logger: ILogger;

    @inject(CoreClientProvider)
    protected readonly coreClientProvider: CoreClientProvider;

    @inject(ToolOutputServiceServer)
    protected readonly toolOutputService: ToolOutputServiceServer;

    protected ready = new Deferred<void>();
    protected client: LibraryServiceClient | undefined;

    @postConstruct()
    protected init(): void {
        this.coreClientProvider.client().then(client => {
            if (client) {
                this.ready.resolve();
            } else {
                this.coreClientProvider.onClientReady(() => this.ready.resolve());
            }
        })
    }

    async search(options: { query?: string }): Promise<LibraryPackage[]> {
        await this.ready.promise;
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

    async list({ fqbn }: { fqbn?: string | undefined }): Promise<LibraryPackage[]> {
        await this.ready.promise;
        const coreClient = await this.coreClientProvider.client();
        if (!coreClient) {
            return [];
        }
        const { client, instance } = coreClient;

        const req = new LibraryListReq();
        req.setInstance(instance);
        req.setAll(true);
        const resp = await new Promise<LibraryListResp>((resolve, reject) => client.libraryList(req, ((error, resp) => !!error ? reject(error) : resolve(resp))));
        const x = resp.getInstalledLibraryList().map(item => {
            const release = item.getRelease();
            const library = item.getLibrary();
            if (!release || !library) {
                return undefined;
            }
            // https://arduino.github.io/arduino-cli/latest/rpc/commands/#librarylocation
            // 0: In the libraries subdirectory of the Arduino IDE installation. (`ide_builtin`)
            // 1: In the libraries subdirectory of the user directory (sketchbook). (`user`)
            // 2: In the libraries subdirectory of a platform. (`platform_builtin`)
            // 3: When LibraryLocation is used in a context where a board is specified, this indicates the library is
            // in the libraries subdirectory of a platform referenced by the board's platform. (`referenced_platform_builtin`)
            // If 0, we ignore it.
            // If 1, we include always.
            // If 2, we include iff `fqbn` is specified and the platform matches.
            // if 3, TODO
            const location = library.getLocation();

            if (location === 0) {
                return undefined;
            }

            if (location === 2) {
                if (!fqbn) {
                    return undefined;
                }
                const architectures = library.getArchitecturesList();
                const [platform] = library.getContainerPlatform().split(':');
                if (!platform) {
                    return undefined;
                }
                const [boardPlatform, boardArchitecture] = fqbn.split(':');
                if (boardPlatform !== platform || architectures.indexOf(boardArchitecture) === -1) {
                    return undefined;
                }
            }

            const installedVersion = library.getVersion();
            return toLibrary({
                name: library.getName(),
                installedVersion,
                installable: true,
                description: library.getSentence(),
                summary: library.getParagraph(),
                includes: release.getProvidesIncludesList(),
                moreInfoLink: library.getWebsite()
            }, release, [library.getVersion()]);
        }).filter(notEmpty);
        console.log(x);
        return x;
    }

    async install(options: { item: LibraryPackage, version?: Installable.Version }): Promise<void> {
        await this.ready.promise;
        const item = options.item;
        const version = !!options.version ? options.version : item.availableVersions[0];
        const coreClient = await this.coreClientProvider.client();
        if (!coreClient) {
            return;
        }
        const { client, instance } = coreClient;

        const req = new LibraryInstallReq();
        req.setInstance(instance);
        req.setName(item.name);
        req.setVersion(version);

        console.info('>>> Starting library package installation...', item);
        const resp = client.libraryInstall(req);
        resp.on('data', (r: LibraryInstallResp) => {
            const prog = r.getProgress();
            if (prog) {
                this.toolOutputService.append({ tool: 'library', chunk: `downloading ${prog.getFile()}: ${prog.getCompleted()}%\n` });
            }
        });
        await new Promise<void>((resolve, reject) => {
            resp.on('end', resolve);
            resp.on('error', reject);
        });

        if (this.client) {
            const items = await this.search({});
            const updated = items.find(other => LibraryPackage.equals(other, item)) || item;
            this.client.notifyInstalled({ item: updated });
        }

        console.info('<<< Library package installation done.', item);
    }

    async uninstall(options: { item: LibraryPackage }): Promise<void> {
        const item = options.item;
        const coreClient = await this.coreClientProvider.client();
        if (!coreClient) {
            return;
        }
        const { client, instance } = coreClient;

        const req = new LibraryUninstallReq();
        req.setInstance(instance);
        req.setName(item.name);
        req.setVersion(item.installedVersion!);

        console.info('>>> Starting library package uninstallation...', item);
        let logged = false;
        const resp = client.libraryUninstall(req);
        resp.on('data', (_: LibraryUninstallResp) => {
            if (!logged) {
                this.toolOutputService.append({ tool: 'library', chunk: `uninstalling ${item.name}:${item.installedVersion}%\n` });
                logged = true;
            }
        });
        await new Promise<void>((resolve, reject) => {
            resp.on('end', resolve);
            resp.on('error', reject);
        });
        if (this.client) {
            this.client.notifyUninstalled({ item });
        }
        console.info('<<< Library package uninstallation done.', item);
    }

    setClient(client: LibraryServiceClient | undefined): void {
        this.client = client;
    }

    dispose(): void {
        this.logger.info('>>> Disposing library service...');
        this.client = undefined;
        this.logger.info('<<< Disposed library service.');
    }

}

function toLibrary(tpl: Partial<LibraryPackage>, release: LibraryRelease, availableVersions: string[]): LibraryPackage {
    return {
        name: '',
        installable: false,
        ...tpl,

        author: release.getAuthor(),
        availableVersions,
        includes: release.getProvidesIncludesList(),
        description: release.getSentence(),
        moreInfoLink: release.getWebsite(),
        summary: release.getParagraph()
    }
}
