import { ILogger, notEmpty } from '@theia/core';
import { FileUri } from '@theia/core/lib/node';
import { inject, injectable } from '@theia/core/shared/inversify';
import { duration } from '../common/decorators';
import {
  NotificationServiceServer,
  ResponseService,
  sortComponents,
  SortGroup,
} from '../common/protocol';
import { Installable } from '../common/protocol/installable';
import {
  LibraryDependency,
  LibraryLocation,
  LibraryPackage,
  LibrarySearch,
  LibraryService,
} from '../common/protocol/library-service';
import { BoardDiscovery } from './board-discovery';
import {
  InstalledLibrary,
  Library,
  LibraryInstallLocation,
  LibraryInstallRequest,
  LibraryListRequest,
  LibraryListResponse,
  LibraryLocation as GrpcLibraryLocation,
  LibraryRelease,
  LibraryResolveDependenciesRequest,
  LibrarySearchRequest,
  LibrarySearchResponse,
  LibraryUninstallRequest,
  ZipLibraryInstallRequest,
} from './cli-protocol/cc/arduino/cli/commands/v1/lib_pb';
import { CoreClientAware } from './core-client-provider';
import { ExecuteWithProgress } from './grpc-progressible';

@injectable()
export class LibraryServiceImpl
  extends CoreClientAware
  implements LibraryService
{
  @inject(ILogger)
  protected logger: ILogger;

  @inject(ResponseService)
  protected readonly responseService: ResponseService;

  @inject(BoardDiscovery)
  protected readonly boardDiscovery: BoardDiscovery;

  @inject(NotificationServiceServer)
  protected readonly notificationServer: NotificationServiceServer;

  @duration()
  async search(options: LibrarySearch): Promise<LibraryPackage[]> {
    const coreClient = await this.coreClient;
    const { client, instance } = coreClient;

    const listReq = new LibraryListRequest();
    listReq.setInstance(instance);
    const installedLibsResp = await new Promise<LibraryListResponse>(
      (resolve, reject) =>
        client.libraryList(listReq, (err, resp) =>
          !!err ? reject(err) : resolve(resp)
        )
    );
    const installedLibs = installedLibsResp.getInstalledLibrariesList();
    const installedLibsIdx = new Map<string, InstalledLibrary>();
    for (const installedLib of installedLibs) {
      if (installedLib.hasLibrary()) {
        const lib = installedLib.getLibrary();
        if (lib) {
          installedLibsIdx.set(lib.getName(), installedLib);
        }
      }
    }

    const req = new LibrarySearchRequest();
    req.setQuery(options.query || '');
    req.setInstance(instance);
    req.setOmitReleasesDetails(true);
    const resp = await new Promise<LibrarySearchResponse>((resolve, reject) =>
      client.librarySearch(req, (err, resp) =>
        !!err ? reject(err) : resolve(resp)
      )
    );
    const items = resp
      .getLibrariesList()
      .filter((item) => !!item.getLatest())
      .map((item) => {
        const availableVersions = item
          .getAvailableVersionsList()
          .sort(Installable.Version.COMPARATOR)
          .reverse();
        let installedVersion: string | undefined;
        const installed = installedLibsIdx.get(item.getName());
        if (installed) {
          installedVersion = installed.getLibrary()!.getVersion();
        }
        return toLibrary(
          {
            name: item.getName(),
            installedVersion,
          },
          item.getLatest()!,
          availableVersions
        );
      });

    const typePredicate = this.typePredicate(options);
    const topicPredicate = this.topicPredicate(options);
    const libraries = items.filter(
      (item) => typePredicate(item) && topicPredicate(item)
    );
    return sortComponents(libraries, librarySortGroup);
  }

  private typePredicate(
    options: LibrarySearch
  ): (item: LibraryPackage) => boolean {
    const { type } = options;
    if (!type || type === 'All') {
      return () => true;
    }
    switch (options.type) {
      case 'Installed':
        return Installable.Installed;
      case 'Updatable':
        return Installable.Updateable;
      case 'Arduino':
      case 'Partner':
      case 'Recommended':
      case 'Contributed':
      case 'Retired':
        return ({ types }: LibraryPackage) => !!types && types.includes(type);
      default:
        throw new Error(`Unhandled type: ${options.type}`);
    }
  }

  private topicPredicate(
    options: LibrarySearch
  ): (item: LibraryPackage) => boolean {
    const { topic } = options;
    if (!topic || topic === 'All') {
      return () => true;
    }
    return (item: LibraryPackage) => item.category === topic;
  }

  async list({
    fqbn,
    libraryName,
  }: {
    fqbn?: string | undefined;
    libraryName?: string | undefined;
  }): Promise<LibraryPackage[]> {
    const coreClient = await this.coreClient;
    const { client, instance } = coreClient;
    const req = new LibraryListRequest();
    req.setInstance(instance);
    if (fqbn) {
      // Only get libraries from the cores when the FQBN is defined. Otherwise, we retrieve user installed libraries only.
      req.setAll(true); // https://github.com/arduino/arduino-ide/pull/303#issuecomment-815556447
      req.setFqbn(fqbn);
    }
    if (libraryName) {
      req.setName(libraryName);
    }

    const resp = await new Promise<LibraryListResponse | undefined>(
      (resolve, reject) => {
        client.libraryList(req, (error, r) => {
          if (error) {
            const { message } = error;
            // Required core dependency is missing.
            // https://github.com/arduino/arduino-cli/issues/954
            if (
              message.indexOf('missing platform release') !== -1 &&
              message.indexOf('referenced by board') !== -1
            ) {
              resolve(undefined);
              return;
            }
            // The core for the board is not installed, `lib list` cannot be filtered based on FQBN.
            // https://github.com/arduino/arduino-cli/issues/955
            if (
              message.indexOf('platform') !== -1 &&
              message.indexOf('is not installed') !== -1
            ) {
              resolve(undefined);
              return;
            }

            // It's a hack to handle https://github.com/arduino/arduino-cli/issues/1262 gracefully.
            if (message.indexOf('unknown package') !== -1) {
              resolve(undefined);
              return;
            }

            reject(error);
            return;
          }
          resolve(r);
        });
      }
    );
    if (!resp) {
      return [];
    }
    return resp
      .getInstalledLibrariesList()
      .map((item) => {
        const library = item.getLibrary();
        if (!library) {
          return undefined;
        }
        const installedVersion = library.getVersion();
        return toLibrary(
          {
            name: library.getName(),
            installedVersion,
            description: library.getSentence(),
            summary: library.getParagraph(),
            moreInfoLink: library.getWebsite(),
            includes: library.getProvidesIncludesList(),
            location: this.mapLocation(library.getLocation()),
            installDirUri: FileUri.create(library.getInstallDir()).toString(),
            exampleUris: library
              .getExamplesList()
              .map((fsPath) => FileUri.create(fsPath).toString()),
          },
          library,
          [library.getVersion()]
        );
      })
      .filter(notEmpty);
  }

  private mapLocation(location: GrpcLibraryLocation): LibraryLocation {
    switch (location) {
      case GrpcLibraryLocation.LIBRARY_LOCATION_BUILTIN:
        return LibraryLocation.BUILTIN;
      case GrpcLibraryLocation.LIBRARY_LOCATION_USER:
        return LibraryLocation.USER;
      case GrpcLibraryLocation.LIBRARY_LOCATION_PLATFORM_BUILTIN:
        return LibraryLocation.PLATFORM_BUILTIN;
      case GrpcLibraryLocation.LIBRARY_LOCATION_REFERENCED_PLATFORM_BUILTIN:
        return LibraryLocation.REFERENCED_PLATFORM_BUILTIN;
      default:
        throw new Error(`Unexpected location ${location}.`);
    }
  }

  async listDependencies({
    item,
    version,
    filterSelf,
  }: {
    item: LibraryPackage;
    version: Installable.Version;
    filterSelf?: boolean;
  }): Promise<LibraryDependency[]> {
    const coreClient = await this.coreClient;
    const { client, instance } = coreClient;
    const req = new LibraryResolveDependenciesRequest();
    req.setInstance(instance);
    req.setName(item.name);
    req.setVersion(version);
    const dependencies = await new Promise<LibraryDependency[]>(
      (resolve, reject) => {
        client.libraryResolveDependencies(req, (error, resp) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(
            resp.getDependenciesList().map(
              (dep) =>
                <LibraryDependency>{
                  name: dep.getName(),
                  installedVersion: dep.getVersionInstalled(),
                  requiredVersion: dep.getVersionRequired(),
                }
            )
          );
        });
      }
    );
    return filterSelf
      ? dependencies.filter(({ name }) => name !== item.name)
      : dependencies;
  }

  async install(options: {
    item: LibraryPackage;
    progressId?: string;
    version?: Installable.Version;
    installDependencies?: boolean;
    noOverwrite?: boolean;
    installLocation?: LibraryLocation.BUILTIN | LibraryLocation.USER;
  }): Promise<void> {
    const item = options.item;
    const version = !!options.version
      ? options.version
      : item.availableVersions[0];
    const coreClient = await this.coreClient;
    const { client, instance } = coreClient;

    const req = new LibraryInstallRequest();
    req.setInstance(instance);
    req.setName(item.name);
    req.setVersion(version);
    req.setNoDeps(!options.installDependencies);
    req.setNoOverwrite(Boolean(options.noOverwrite));
    if (options.installLocation === LibraryLocation.BUILTIN) {
      req.setInstallLocation(
        LibraryInstallLocation.LIBRARY_INSTALL_LOCATION_BUILTIN
      );
    } else if (options.installLocation === LibraryLocation.USER) {
      req.setInstallLocation(
        LibraryInstallLocation.LIBRARY_INSTALL_LOCATION_USER
      );
    }

    console.info('>>> Starting library package installation...', item);

    // stop the board discovery
    await this.boardDiscovery.stop();

    const resp = client.libraryInstall(req);
    resp.on(
      'data',
      ExecuteWithProgress.createDataCallback({
        progressId: options.progressId,
        responseService: this.responseService,
      })
    );
    await new Promise<void>((resolve, reject) => {
      resp.on('end', () => {
        this.boardDiscovery.start(); // TODO: remove discovery dependency from boards service. See https://github.com/arduino/arduino-ide/pull/1107 why this is here.
        resolve();
      });
      resp.on('error', (error) => {
        this.responseService.appendToOutput({
          chunk: `Failed to install library: ${item.name}${
            version ? `:${version}` : ''
          }.\n`,
        });
        this.responseService.appendToOutput({
          chunk: `${error.toString()}\n`,
        });
        reject(error);
      });
    });

    const items = await this.search({});
    const updated =
      items.find((other) => LibraryPackage.equals(other, item)) || item;
    this.notificationServer.notifyLibraryDidInstall({ item: updated });
    console.info('<<< Library package installation done.', item);
  }

  async installZip({
    zipUri,
    progressId,
    overwrite,
  }: {
    zipUri: string;
    progressId?: string;
    overwrite?: boolean;
  }): Promise<void> {
    const coreClient = await this.coreClient;
    const { client, instance } = coreClient;
    const req = new ZipLibraryInstallRequest();
    req.setPath(FileUri.fsPath(zipUri));
    req.setInstance(instance);
    if (typeof overwrite === 'boolean') {
      req.setOverwrite(overwrite);
    }

    // stop the board discovery
    await this.boardDiscovery.stop();
    try {
      const resp = client.zipLibraryInstall(req);
      resp.on(
        'data',
        ExecuteWithProgress.createDataCallback({
          progressId,
          responseService: this.responseService,
        })
      );
      await new Promise<void>((resolve, reject) => {
        resp.on('end', resolve);
        resp.on('error', reject);
      });
      await this.refresh(); // let the CLI re-scan the libraries
      this.notificationServer.notifyLibraryDidInstall({
        item: 'zip-install',
      });
    } finally {
      this.boardDiscovery.start(); // TODO: remove discovery dependency from boards service. See https://github.com/arduino/arduino-ide/pull/1107 why this is here.
    }
  }

  async uninstall(options: {
    item: LibraryPackage;
    progressId?: string;
  }): Promise<void> {
    const { item, progressId } = options;
    const coreClient = await this.coreClient;
    const { client, instance } = coreClient;

    const req = new LibraryUninstallRequest();
    req.setInstance(instance);
    req.setName(item.name);
    req.setVersion(item.installedVersion!);

    console.info('>>> Starting library package uninstallation...', item);

    // stop the board discovery
    await this.boardDiscovery.stop();

    const resp = client.libraryUninstall(req);
    resp.on(
      'data',
      ExecuteWithProgress.createDataCallback({
        progressId,
        responseService: this.responseService,
      })
    );
    await new Promise<void>((resolve, reject) => {
      resp.on('end', () => {
        this.boardDiscovery.start(); // TODO: remove discovery dependency from boards service. See https://github.com/arduino/arduino-ide/pull/1107 why this is here.
        resolve();
      });
      resp.on('error', reject);
    });

    this.notificationServer.notifyLibraryDidUninstall({ item });
    console.info('<<< Library package uninstallation done.', item);
  }

  dispose(): void {
    this.logger.info('>>> Disposing library service...');
    this.logger.info('<<< Disposed library service.');
  }
}

function toLibrary(
  pkg: Partial<LibraryPackage>,
  lib: LibraryRelease | Library,
  availableVersions: string[]
): LibraryPackage {
  return {
    name: '',
    exampleUris: [],
    location: LibraryLocation.BUILTIN,
    ...pkg,

    author: lib.getAuthor(),
    availableVersions,
    includes: lib.getProvidesIncludesList(),
    description: lib.getSentence(),
    moreInfoLink: lib.getWebsite(),
    summary: lib.getParagraph(),
    category: lib.getCategory(),
    types: lib.getTypesList(),
  };
}

// Libraries do not have a deprecated property. The deprecated information is inferred if 'Retired' is in 'types'
function librarySortGroup(library: LibraryPackage): SortGroup {
  const types: string[] = [];
  for (const type of ['Arduino', 'Retired']) {
    if (library.types.includes(type)) {
      types.push(type);
    }
  }
  return types.join('-') as SortGroup;
}
