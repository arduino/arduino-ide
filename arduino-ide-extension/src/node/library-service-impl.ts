import { ILogger } from '@theia/core/lib/common/logger';
import { FileUri } from '@theia/core/lib/node';
import { inject, injectable } from '@theia/core/shared/inversify';
import {
  Installable,
  LibraryDependency,
  libraryInstallFailed,
  LibraryLocation,
  LibraryPackage,
  LibrarySearch,
  LibraryService,
  NotificationServiceServer,
  ResponseService,
  sortComponents,
  SortGroup,
} from '../common/protocol';
import { BoardDiscovery } from './board-discovery';
import {
  InstalledLibrary,
  Library,
  LibraryInstallLocation,
  LibraryInstallRequest,
  LibraryListRequest,
  LibraryLocation as GrpcLibraryLocation,
  LibraryRelease,
  LibraryUninstallRequest,
  SearchedLibrary,
  ZipLibraryInstallRequest,
} from './cli-api';
import { CoreClientAware } from './core-client-provider';
import { ExecuteWithProgress } from './grpc-progressible';
import { ServiceError } from './service-error';

@injectable()
export class LibraryServiceImpl
  extends CoreClientAware
  implements LibraryService
{
  @inject(ILogger)
  private readonly logger: ILogger;
  @inject(ResponseService)
  private readonly responseService: ResponseService;
  @inject(BoardDiscovery)
  private readonly boardDiscovery: BoardDiscovery;
  @inject(NotificationServiceServer)
  private readonly notificationServer: NotificationServiceServer;

  async search(options: LibrarySearch): Promise<LibraryPackage[]> {
    const coreClient = await this.coreClient;
    const { client, instance } = coreClient;
    const [listResp, searchResp] = await Promise.all([
      client.libraryList({ instance }),
      client.librarySearch({
        instance,
        omitReleasesDetails: true,
        searchArgs: options.query || '',
      }),
    ]);

    const installedLibs = new Map(
      listResp.installedLibraries
        .filter(hasLibrary)
        .map((library) => [library.library.name, library])
    );

    const items = searchResp.libraries.filter(hasLatest).map((item) => {
      const availableVersions = item.availableVersions
        .sort(Installable.Version.COMPARATOR)
        .reverse();
      let installedVersion: string | undefined;
      const installed = installedLibs.get(item.name);
      if (installed) {
        installedVersion = installed.library.version;
      }
      return toLibrary(
        {
          name: item.name,
          installedVersion,
        },
        item.latest,
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
    const req: Partial<LibraryListRequest> = {
      instance,
    };
    if (fqbn) {
      // Only get libraries from the cores when the FQBN is defined. Otherwise, we retrieve user installed libraries only.
      req.fqbn = fqbn;
      req.all = true; // https://github.com/arduino/arduino-ide/pull/303#issuecomment-815556447
    }
    if (libraryName) {
      req.name = libraryName;
    }

    try {
      const { installedLibraries } = await client.libraryList(req);
      return installedLibraries.filter(hasLibrary).map(({ library }) => {
        const installedVersion = library.version;
        return toLibrary(
          {
            name: library.name,
            installedVersion,
            description: library.paragraph,
            summary: library.sentence,
            moreInfoLink: library.website,
            includes: library.providesIncludes,
            location: this.mapLocation(library.location),
            installDirUri: FileUri.create(library.installDir).toString(),
            exampleUris: library.examples.map((fsPath) =>
              FileUri.create(fsPath).toString()
            ),
          },
          library,
          [library.version]
        );
      });
    } catch (err) {
      if (ServiceError.is(err)) {
        const { message } = err;
        // Required core dependency is missing.
        // https://github.com/arduino/arduino-cli/issues/954
        if (
          message.indexOf('missing platform release') !== -1 &&
          message.indexOf('referenced by board') !== -1
        ) {
          return [];
        }
        // The core for the board is not installed, `lib list` cannot be filtered based on FQBN.
        // https://github.com/arduino/arduino-cli/issues/955
        if (
          message.indexOf('platform') !== -1 &&
          message.indexOf('is not installed') !== -1
        ) {
          return [];
        }
        // It's a hack to handle https://github.com/arduino/arduino-cli/issues/1262 gracefully.
        if (message.indexOf('unknown package') !== -1) {
          return [];
        }
      }
      throw err;
    }
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
    excludeSelf,
  }: {
    item: LibraryPackage;
    version: Installable.Version;
    excludeSelf?: boolean;
  }): Promise<LibraryDependency[]> {
    const coreClient = await this.coreClient;
    const { client, instance } = coreClient;
    try {
      const { dependencies } = await client.libraryResolveDependencies({
        instance,
        name: item.name,
        version,
      });
      const result = dependencies.map((dependency) => ({
        name: dependency.name,
        installedVersion: dependency.versionInstalled,
        requiredVersion: dependency.versionRequired,
      }));
      return excludeSelf
        ? result.filter(({ name }) => name !== item.name)
        : result;
    } catch (err) {
      console.error('Failed to list library dependencies', err);
      // If a gRPC service error, it removes the code and the number to provider more readable error message to the user.
      const unwrappedError = ServiceError.is(err)
        ? new Error(err.details)
        : err;
      throw unwrappedError;
    }
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

    const req: LibraryInstallRequest = {
      instance,
      name: item.name,
      version,
      noDeps: !options.installDependencies,
      noOverwrite: Boolean(options.noOverwrite),
      installLocation:
        options.installLocation === LibraryLocation.USER
          ? LibraryInstallLocation.LIBRARY_INSTALL_LOCATION_USER
          : LibraryInstallLocation.LIBRARY_INSTALL_LOCATION_BUILTIN,
    };

    console.info('>>> Starting library package installation...', item);

    const dataCallback = ExecuteWithProgress.createDataCallback({
      progressId: options.progressId,
      responseService: this.responseService,
    });

    // stop the board discovery
    await this.boardDiscovery.stop();

    try {
      for await (const resp of client.libraryInstall(req)) {
        dataCallback(resp);
      }
    } catch (err) {
      this.responseService.appendToOutput({
        chunk: `${libraryInstallFailed(
          item.name,
          version
        )}\n${err.toString()}\n`,
      });
    } finally {
      this.boardDiscovery.start(); // TODO: remove discovery dependency from boards service. See https://github.com/arduino/arduino-ide/pull/1107 why this is here.
    }

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
    const req: ZipLibraryInstallRequest = {
      instance,
      path: FileUri.fsPath(zipUri),
      overwrite: Boolean(overwrite),
    };

    const dataCallback = ExecuteWithProgress.createDataCallback({
      progressId,
      responseService: this.responseService,
    });

    // stop the board discovery
    await this.boardDiscovery.stop();
    try {
      for await (const resp of client.zipLibraryInstall(req)) {
        dataCallback(resp);
      }
    } finally {
      this.boardDiscovery.start(); // TODO: remove discovery dependency from boards service. See https://github.com/arduino/arduino-ide/pull/1107 why this is here.
    }
    await this.refresh(); // let the CLI re-scan the libraries
    this.notificationServer.notifyLibraryDidInstall({
      item: 'zip-install',
    });
  }

  async uninstall(options: {
    item: LibraryPackage;
    progressId?: string;
  }): Promise<void> {
    const { item, progressId } = options;
    if (!item.installedVersion) {
      throw new Error(
        `Library '${
          item.name
        }' does not have an installed version. ${JSON.stringify(item)}`
      );
    }
    const coreClient = await this.coreClient;
    const { client, instance } = coreClient;
    const req: LibraryUninstallRequest = {
      instance,
      name: item.name,
      version: item.installedVersion,
    };

    const dataCallback = ExecuteWithProgress.createDataCallback({
      progressId,
      responseService: this.responseService,
    });

    console.info('>>> Starting library package uninstallation...', item);

    // stop the board discovery
    await this.boardDiscovery.stop();
    try {
      for await (const resp of client.libraryUninstall(req)) {
        dataCallback(resp);
      }
    } finally {
      this.boardDiscovery.start(); // TODO: remove discovery dependency from boards service. See https://github.com/arduino/arduino-ide/pull/1107 why this is here.
    }
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

    author: lib.author,
    availableVersions,
    includes: lib.providesIncludes,
    description: lib.paragraph,
    moreInfoLink: lib.website,
    summary: lib.sentence,
    category: lib.category,
    types: lib.types,
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

function hasLibrary(
  arg: InstalledLibrary
): arg is InstalledLibrary & { library: Library } {
  return Boolean(arg.library);
}

function hasLatest(
  arg: SearchedLibrary
): arg is SearchedLibrary & { latest: string } {
  return Boolean(arg.latest);
}
