import { injectable, inject } from 'inversify';
import * as path from 'path';
import { LibraryDependency, LibraryPackage, LibraryService } from '../common/protocol/library-service';
import { CoreClientAware } from './core-client-provider';
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
    LibraryUninstallResp,
    Library,
    LibraryResolveDependenciesReq,
    ZipLibraryInstallReq,
    ZipLibraryInstallResp
} from './cli-protocol/commands/lib_pb';
import { Installable } from '../common/protocol/installable';
import { ILogger, notEmpty } from '@theia/core';
import { FileUri } from '@theia/core/lib/node';
import { OutputService, NotificationServiceServer } from '../common/protocol';


@injectable()
export class LibraryServiceImpl extends CoreClientAware implements LibraryService {

    @inject(ILogger)
    protected logger: ILogger;

    @inject(OutputService)
    protected readonly outputService: OutputService;

    @inject(NotificationServiceServer)
    protected readonly notificationServer: NotificationServiceServer;

    async search(options: { query?: string }): Promise<LibraryPackage[]> {
        const coreClient = await this.coreClient();
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
                const availableVersions = item.getReleasesMap().getEntryList().map(([key, _]) => key).sort(Installable.Version.COMPARATOR).reverse();
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
            });

        return items;
    }

    async list({ fqbn }: { fqbn?: string | undefined }): Promise<LibraryPackage[]> {
        const coreClient = await this.coreClient();
        const { client, instance } = coreClient;
        const req = new LibraryListReq();
        req.setInstance(instance);
        req.setAll(true);
        if (fqbn) {
            req.setFqbn(fqbn);
        }

        const resp = await new Promise<LibraryListResp | undefined>((resolve, reject) => {
            client.libraryList(req, ((error, r) => {
                if (error) {
                    const { message } = error;
                    // Required core dependency is missing.
                    // https://github.com/arduino/arduino-cli/issues/954
                    if (message.indexOf('missing platform release') !== -1 && message.indexOf('referenced by board') !== -1) {
                        resolve(undefined);
                        return;
                    }
                    // The core for the board is not installed, `lib list` cannot be filtered based on FQBN.
                    // https://github.com/arduino/arduino-cli/issues/955
                    if (message.indexOf('platform') !== -1 && message.indexOf('is not installed') !== -1) {
                        resolve(undefined);
                        return;
                    }
                    reject(error);
                    return;
                }
                resolve(r);
            }));
        });
        if (!resp) {
            return [];
        }
        return resp.getInstalledLibraryList().map(item => {
            const library = item.getLibrary();
            if (!library) {
                return undefined;
            }
            const installedVersion = library.getVersion();
            return toLibrary({
                name: library.getName(),
                label: library.getRealName(),
                installedVersion,
                installable: true,
                description: library.getSentence(),
                summary: library.getParagraph(),
                moreInfoLink: library.getWebsite(),
                includes: library.getProvidesIncludesList(),
                location: library.getLocation(),
                installDirUri: FileUri.create(library.getInstallDir()).toString(),
                exampleUris: library.getExamplesList().map(fsPath => FileUri.create(fsPath).toString())
            }, library, [library.getVersion()]);
        }).filter(notEmpty);
    }

    async listDependencies({ item, version, filterSelf }: { item: LibraryPackage, version: Installable.Version, filterSelf?: boolean }): Promise<LibraryDependency[]> {
        const coreClient = await this.coreClient();
        const { client, instance } = coreClient;
        const req = new LibraryResolveDependenciesReq();
        req.setInstance(instance);
        req.setName(item.name);
        req.setVersion(version);
        const dependencies = await new Promise<LibraryDependency[]>((resolve, reject) => {
            client.libraryResolveDependencies(req, (error, resp) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(resp.getDependenciesList().map(dep => <LibraryDependency>{
                    name: dep.getName(),
                    installedVersion: dep.getVersioninstalled(),
                    requiredVersion: dep.getVersionrequired()
                }));
            })
        });
        return filterSelf ? dependencies.filter(({ name }) => name !== item.name) : dependencies;
    }

    async install(options: { item: LibraryPackage, version?: Installable.Version, installDependencies?: boolean }): Promise<void> {
        const item = options.item;
        const version = !!options.version ? options.version : item.availableVersions[0];
        const coreClient = await this.coreClient();
        const { client, instance } = coreClient;

        const req = new LibraryInstallReq();
        req.setInstance(instance);
        req.setName(item.name);
        req.setVersion(version);
        if (options.installDependencies === false) {
            req.setNodeps(true);
        }

        console.info('>>> Starting library package installation...', item);
        const resp = client.libraryInstall(req);
        resp.on('data', (r: LibraryInstallResp) => {
            const prog = r.getProgress();
            if (prog) {
                this.outputService.append({ chunk: `downloading ${prog.getFile()}: ${prog.getCompleted()}%\n` });
            }
        });
        await new Promise<void>((resolve, reject) => {
            resp.on('end', resolve);
            resp.on('error', reject);
        });

        const items = await this.search({});
        const updated = items.find(other => LibraryPackage.equals(other, item)) || item;
        this.notificationServer.notifyLibraryInstalled({ item: updated });
        console.info('<<< Library package installation done.', item);
    }

    async installZip({ zipUri }: { zipUri: string }): Promise<void> {
        const coreClient = await this.coreClient();
        const { client, instance } = coreClient;
        const req = new ZipLibraryInstallReq();
        req.setPath(FileUri.fsPath(zipUri));
        req.setInstance(instance);
        const resp = client.zipLibraryInstall(req);
        resp.on('data', (r: ZipLibraryInstallResp) => {
            const task = r.getTaskProgress();
            if (task && task.getMessage()) {
                this.outputService.append({ chunk: task.getMessage() });
            }
        });
        await new Promise<void>((resolve, reject) => {
            resp.on('end', resolve);
            resp.on('error', error => {
                // This is a hack to have better error messages for the user. We try to get the name of the library from this:
                // Request installZip failed with error: 2 UNKNOWN: copying library: destination /path/to/lib already exists
                const match = error.message.match(/destination (.*?) already exists/);
                if (match && match.length >= 2) {
                    const name = path.basename(match[1].trim());
                    if (name) {
                        reject(new Error(`A library named ${name} already exists.`));
                        return;
                    }
                }
                reject(error);
            });
        });
    }

    async uninstall(options: { item: LibraryPackage }): Promise<void> {
        const item = options.item;
        const coreClient = await this.coreClient();
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
                this.outputService.append({ chunk: `uninstalling ${item.name}:${item.installedVersion}%\n` });
                logged = true;
            }
        });
        await new Promise<void>((resolve, reject) => {
            resp.on('end', resolve);
            resp.on('error', reject);
        });

        this.notificationServer.notifyLibraryUninstalled({ item });
        console.info('<<< Library package uninstallation done.', item);
    }

    dispose(): void {
        this.logger.info('>>> Disposing library service...');
        this.logger.info('<<< Disposed library service.');
    }

}

function toLibrary(pkg: Partial<LibraryPackage>, lib: LibraryRelease | Library, availableVersions: string[]): LibraryPackage {
    return {
        name: '',
        label: '',
        exampleUris: [],
        installable: false,
        location: 0,
        ...pkg,

        author: lib.getAuthor(),
        availableVersions,
        includes: lib.getProvidesIncludesList(),
        description: lib.getSentence(),
        moreInfoLink: lib.getWebsite(),
        summary: lib.getParagraph()
    }
}
