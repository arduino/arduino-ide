import { injectable, inject } from 'inversify';
import { LibraryDependency, LibraryLocation, LibraryPackage, LibraryService } from '../common/protocol/library-service';
import { CoreClientAware } from './core-client-provider';
import {
    InstalledLibrary, Library, LibraryInstallRequest, LibraryListRequest, LibraryListResponse, LibraryLocation as GrpcLibraryLocation, LibraryRelease,
    LibraryResolveDependenciesRequest, LibraryUninstallRequest, ZipLibraryInstallRequest, LibrarySearchRequest,
    LibrarySearchResponse
} from './cli-protocol/cc/arduino/cli/commands/v1/lib_pb';
import { Installable } from '../common/protocol/installable';
import { ILogger, notEmpty } from '@theia/core';
import { FileUri } from '@theia/core/lib/node';
import { ResponseService, NotificationServiceServer } from '../common/protocol';
import { InstallWithProgress } from './grpc-installable';

@injectable()
export class LibraryServiceImpl extends CoreClientAware implements LibraryService {

    @inject(ILogger)
    protected logger: ILogger;

    @inject(ResponseService)
    protected readonly responseService: ResponseService;

    @inject(NotificationServiceServer)
    protected readonly notificationServer: NotificationServiceServer;

    async search(options: { query?: string }): Promise<LibraryPackage[]> {
        const coreClient = await this.coreClient();
        const { client, instance } = coreClient;

        const listReq = new LibraryListRequest();
        listReq.setInstance(instance);
        const installedLibsResp = await new Promise<LibraryListResponse>((resolve, reject) => client.libraryList(listReq, (err, resp) => !!err ? reject(err) : resolve(resp)));
        const installedLibs = installedLibsResp.getInstalledLibrariesList();
        const installedLibsIdx = new Map<string, InstalledLibrary>();
        for (const installedLib of installedLibs) {
            if (installedLib.hasLibrary()) {
                const lib = installedLib.getLibrary();
                if (lib) {
                    installedLibsIdx.set(lib.getRealName(), installedLib);
                }
            }
        }

        const req = new LibrarySearchRequest();
        req.setQuery(options.query || '');
        req.setInstance(instance);
        const resp = await new Promise<LibrarySearchResponse>((resolve, reject) => client.librarySearch(req, (err, resp) => !!err ? reject(err) : resolve(resp)));
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
        const req = new LibraryListRequest();
        req.setInstance(instance);
        if (fqbn) {
            // Only get libraries from the cores when the FQBN is defined. Otherwise, we retrieve user installed libraries only.
            req.setAll(true); // https://github.com/arduino/arduino-ide/pull/303#issuecomment-815556447
            req.setFqbn(fqbn);
        }

        const resp = await new Promise<LibraryListResponse | undefined>((resolve, reject) => {
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
        return resp.getInstalledLibrariesList().map(item => {
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
                location: this.mapLocation(library.getLocation()),
                installDirUri: FileUri.create(library.getInstallDir()).toString(),
                exampleUris: library.getExamplesList().map(fsPath => FileUri.create(fsPath).toString())
            }, library, [library.getVersion()]);
        }).filter(notEmpty);
    }

    private mapLocation(location: GrpcLibraryLocation): LibraryLocation {
        switch (location) {
            case GrpcLibraryLocation.LIBRARY_LOCATION_IDE_BUILTIN: return LibraryLocation.IDE_BUILTIN;
            case GrpcLibraryLocation.LIBRARY_LOCATION_USER: return LibraryLocation.USER;
            case GrpcLibraryLocation.LIBRARY_LOCATION_PLATFORM_BUILTIN: return LibraryLocation.PLATFORM_BUILTIN;
            case GrpcLibraryLocation.LIBRARY_LOCATION_REFERENCED_PLATFORM_BUILTIN: return LibraryLocation.REFERENCED_PLATFORM_BUILTIN;
            default: throw new Error(`Unexpected location ${location}.`);
        }
    }

    async listDependencies({ item, version, filterSelf }: { item: LibraryPackage, version: Installable.Version, filterSelf?: boolean }): Promise<LibraryDependency[]> {
        const coreClient = await this.coreClient();
        const { client, instance } = coreClient;
        const req = new LibraryResolveDependenciesRequest();
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
                    installedVersion: dep.getVersionInstalled(),
                    requiredVersion: dep.getVersionRequired()
                }));
            })
        });
        return filterSelf ? dependencies.filter(({ name }) => name !== item.name) : dependencies;
    }

    async install(options: { item: LibraryPackage, progressId?: string, version?: Installable.Version, installDependencies?: boolean }): Promise<void> {
        const item = options.item;
        const version = !!options.version ? options.version : item.availableVersions[0];
        const coreClient = await this.coreClient();
        const { client, instance } = coreClient;

        const req = new LibraryInstallRequest();
        req.setInstance(instance);
        req.setName(item.name);
        req.setVersion(version);
        if (options.installDependencies === false) {
            req.setNoDeps(true);
        }

        console.info('>>> Starting library package installation...', item);
        const resp = client.libraryInstall(req);
        resp.on('data', InstallWithProgress.createDataCallback({ progressId: options.progressId, responseService: this.responseService }));
        await new Promise<void>((resolve, reject) => {
            resp.on('end', resolve);
            resp.on('error', error => {
                this.responseService.appendToOutput({ chunk: `Failed to install library: ${item.name}${version ? `:${version}` : ''}.\n` });
                this.responseService.appendToOutput({ chunk: error.toString() });
                reject(error);
            });
        });

        const items = await this.search({});
        const updated = items.find(other => LibraryPackage.equals(other, item)) || item;
        this.notificationServer.notifyLibraryInstalled({ item: updated });
        console.info('<<< Library package installation done.', item);
    }

    async installZip({ zipUri, progressId, overwrite }: { zipUri: string, progressId?: string, overwrite?: boolean }): Promise<void> {
        const coreClient = await this.coreClient();
        const { client, instance } = coreClient;
        const req = new ZipLibraryInstallRequest();
        req.setPath(FileUri.fsPath(zipUri));
        req.setInstance(instance);
        if (typeof overwrite === 'boolean') {
            req.setOverwrite(overwrite);
        }
        const resp = client.zipLibraryInstall(req);
        resp.on('data', InstallWithProgress.createDataCallback({ progressId, responseService: this.responseService }));
        await new Promise<void>((resolve, reject) => {
            resp.on('end', resolve);
            resp.on('error', reject);
        });
    }

    async uninstall(options: { item: LibraryPackage, progressId?: string }): Promise<void> {
        const { item, progressId } = options;
        const coreClient = await this.coreClient();
        const { client, instance } = coreClient;

        const req = new LibraryUninstallRequest();
        req.setInstance(instance);
        req.setName(item.name);
        req.setVersion(item.installedVersion!);

        console.info('>>> Starting library package uninstallation...', item);
        const resp = client.libraryUninstall(req);
        resp.on('data', InstallWithProgress.createDataCallback({ progressId, responseService: this.responseService }));
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
