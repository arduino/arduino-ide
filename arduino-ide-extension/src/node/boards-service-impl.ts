import { nls } from '@theia/core/lib/common';
import { ILogger } from '@theia/core/lib/common/logger';
import { notEmpty } from '@theia/core/lib/common/objects';
import { inject, injectable } from '@theia/core/shared/inversify';
import {
  Board,
  BoardDetails,
  BoardSearch,
  BoardsPackage,
  BoardsService,
  BoardUserField,
  BoardWithPackage,
  ConfigOption,
  ConfigValue,
  createPlatformIdentifier,
  DetectedPorts,
  Installable,
  NotificationServiceServer,
  platformIdentifierEquals,
  platformInstallFailed,
  ResponseService,
  sortComponents,
  SortGroup,
} from '../common/protocol';
import { BoardDiscovery } from './board-discovery';
import type {
  BoardListAllResponse,
  BoardSearchResponse,
  Platform,
  PlatformInstallRequest,
  PlatformUninstallRequest,
} from './cli-api/';
import { CoreClientAware } from './core-client-provider';
import { ExecuteWithProgress } from './grpc-progressible';
import { ServiceError } from './service-error';

@injectable()
export class BoardsServiceImpl
  extends CoreClientAware
  implements BoardsService
{
  @inject(ILogger)
  protected logger: ILogger;

  @inject(ResponseService)
  protected readonly responseService: ResponseService;

  @inject(NotificationServiceServer)
  protected readonly notificationService: NotificationServiceServer;

  @inject(BoardDiscovery)
  protected readonly boardDiscovery: BoardDiscovery;

  async getDetectedPorts(): Promise<DetectedPorts> {
    return this.boardDiscovery.detectedPorts;
  }

  async getBoardDetails(options: {
    fqbn: string;
  }): Promise<BoardDetails | undefined> {
    const coreClient = await this.coreClient;
    const { client, instance } = coreClient;
    const { fqbn } = options;

    const [detailsResult, programmersResult] = await Promise.allSettled([
      client.boardDetails({ instance, fqbn }),
      client.listProgrammersAvailableForUpload({ instance, fqbn }),
    ]);

    if (detailsResult.status === 'rejected') {
      if (isMissingPlatformError(detailsResult.reason)) {
        return undefined;
      }
      throw detailsResult.reason;
    }
    if (programmersResult.status === 'rejected') {
      throw programmersResult.reason;
    }

    const detailsResp = detailsResult.value;
    const { programmers } = programmersResult.value;
    const { debuggingSupported } = detailsResp;

    const requiredTools = detailsResp.toolsDependencies.map(
      ({ name, packager, version }) => ({
        name,
        packager,
        version,
      })
    );

    const configOptions = detailsResp.configOptions.map(
      ({ option, optionLabel, values }) =>
        <ConfigOption>{
          label: optionLabel,
          option,
          values: values.map(
            ({ value, valueLabel, selected }) =>
              <ConfigValue>{
                value,
                label: valueLabel,
                selected,
              }
          ),
        }
    );

    let VID = 'N/A';
    let PID = 'N/A';
    const prop = detailsResp.identificationProperties
      .map((item) => item.properties)
      .find(notEmpty);
    if (prop) {
      VID = prop['vid'] || '';
      PID = prop['pid'] || '';
    }
    const { buildProperties } = detailsResp;

    return {
      fqbn,
      requiredTools,
      configOptions,
      programmers,
      debuggingSupported,
      VID,
      PID,
      buildProperties,
    };
  }

  async getBoardPackage(options: {
    id: string;
  }): Promise<BoardsPackage | undefined> {
    const { id: expectedId } = options;
    if (!expectedId) {
      return undefined;
    }
    const packages = await this.search({ query: expectedId });
    return packages.find(({ id }) => id === expectedId);
  }

  async getContainerBoardPackage(options: {
    fqbn: string;
  }): Promise<BoardsPackage | undefined> {
    const { fqbn: expectedFqbn } = options;
    if (!expectedFqbn) {
      return undefined;
    }
    const packages = await this.search({});
    return packages.find(({ boards }) =>
      boards.some(({ fqbn }) => fqbn === expectedFqbn)
    );
  }

  async searchBoards({
    query,
  }: {
    query?: string;
  }): Promise<BoardWithPackage[]> {
    const { instance, client } = await this.coreClient;
    const searchArgs = query || '';
    return this.handleListBoards(() =>
      client.boardSearch({ instance, searchArgs })
    );
  }

  async getInstalledBoards(): Promise<BoardWithPackage[]> {
    const { instance, client } = await this.coreClient;
    return this.handleListBoards(() => client.boardListAll({ instance }));
  }

  async getInstalledPlatforms(): Promise<BoardsPackage[]> {
    const { instance, client } = await this.coreClient;
    const { installedPlatforms } = await client.platformList({ instance });
    return installedPlatforms.map((platform, _, installedPlatforms) =>
      toBoardsPackage(platform, installedPlatforms)
    );
  }

  private async handleListBoards(
    task: () => Promise<BoardListAllResponse | BoardSearchResponse>
  ): Promise<BoardWithPackage[]> {
    const { boards } = await task();
    const result: Array<BoardWithPackage> = [];
    for (const board of boards) {
      const { platform } = board;
      if (platform) {
        const platformId = platform.id;
        const fqbn = board.fqbn || undefined; // prefer undefined over empty string
        const parsedPlatformId = createPlatformIdentifier(platformId);
        if (!parsedPlatformId) {
          console.warn(
            `Could not create platform identifier from platform ID input: ${platform.id}. Skipping`
          );
          continue;
        }
        if (fqbn) {
          const checkPlatformId = createPlatformIdentifier(board.fqbn);
          if (!checkPlatformId) {
            console.warn(
              `Could not create platform identifier from FQBN input: ${board.fqbn}. Skipping`
            );
            continue;
          }
          if (!platformIdentifierEquals(parsedPlatformId, checkPlatformId)) {
            console.warn(
              `Mismatching platform identifiers. Platform: ${JSON.stringify(
                parsedPlatformId
              )}, FQBN: ${JSON.stringify(checkPlatformId)}. Skipping`
            );
            continue;
          }
        }
        result.push({
          name: board.name,
          fqbn: board.fqbn,
          packageId: parsedPlatformId,
          packageName: platform.name,
          manuallyInstalled: platform.manuallyInstalled,
        });
      }
    }
    return result;
  }

  async getBoardUserFields(options: {
    fqbn: string;
    protocol: string;
  }): Promise<BoardUserField[]> {
    const coreClient = await this.coreClient;
    const { client, instance } = coreClient;
    const { fqbn, protocol } = options;
    try {
      const { userFields } = await client.supportedUserFields({
        fqbn,
        protocol,
        instance,
      });
      return userFields.map((userField) => ({ ...userField, value: '' }));
    } catch (err) {
      if (isMissingPlatformError(err)) {
        return [];
      }
      throw err;
    }
  }

  async search(options: BoardSearch): Promise<BoardsPackage[]> {
    const coreClient = await this.coreClient;
    const { client, instance } = coreClient;
    const searchArgs = options.query || '';

    const [installedPlatformsResp, searchResp] = await Promise.all([
      client.platformList({ instance }), // TODO: cache the installed platforms until an `onPlatformDid(Install|Uninstall)` event
      client.platformSearch({ instance, searchArgs }),
    ]);
    const installedPlatforms = installedPlatformsResp.installedPlatforms;
    const packages = new Map<string, BoardsPackage>();
    // We must group the cores by ID, and sort platforms by, first the installed version, then version alphabetical order.
    // Otherwise we lose the FQBN information.
    const groupedById: Map<string, Platform[]> = new Map();
    for (const platform of searchResp.searchOutput) {
      const { id } = platform;
      const idGroup = groupedById.get(id);
      if (idGroup) {
        idGroup.push(platform);
      } else {
        groupedById.set(id, [platform]);
      }
    }
    const installedAwareVersionComparator = (
      left: Platform,
      right: Platform
    ) => {
      // XXX: we cannot rely on `platform.getInstalled()`, it is always an empty string.
      const leftInstalled = !!installedPlatforms.find(
        (ip) => ip.id === left.id && ip.installed === left.latest
      );
      const rightInstalled = !!installedPlatforms.find(
        (ip) => ip.id === right.id && ip.installed === right.latest
      );
      if (leftInstalled && !rightInstalled) {
        return -1;
      }
      if (!leftInstalled && rightInstalled) {
        return 1;
      }

      const invertedVersionComparator =
        Installable.Version.COMPARATOR(left.latest, right.latest) * -1;
      // Higher version comes first.

      return invertedVersionComparator;
    };
    for (const value of groupedById.values()) {
      value.sort(installedAwareVersionComparator);
    }

    for (const value of groupedById.values()) {
      for (const platform of value) {
        const { id } = platform;
        const pkg = packages.get(id);
        if (pkg) {
          pkg.availableVersions.push(platform.latest);
          pkg.availableVersions.sort(Installable.Version.COMPARATOR).reverse();
        } else {
          packages.set(id, toBoardsPackage(platform, installedPlatforms));
        }
      }
    }

    const filter = this.typePredicate(options);
    const boardsPackages = [...packages.values()].filter(filter);
    return sortComponents(boardsPackages, boardsPackageSortGroup);
  }

  private typePredicate(
    options: BoardSearch
  ): (item: BoardsPackage) => boolean {
    const { type } = options;
    if (!type || type === 'All') {
      return () => true;
    }
    switch (options.type) {
      case 'Updatable':
        return Installable.Updateable;
      case 'Arduino':
      case 'Partner':
      case 'Arduino@Heart':
      case 'Contributed':
      case 'Arduino Certified':
        return ({ types }: BoardsPackage) => !!types && types?.includes(type);
      default:
        throw new Error(`Unhandled type: ${options.type}`);
    }
  }

  async install(options: {
    item: BoardsPackage;
    progressId?: string;
    version?: Installable.Version;
    noOverwrite?: boolean;
    skipPostInstall?: boolean;
  }): Promise<void> {
    const item = options.item;
    const version = !!options.version
      ? options.version
      : item.availableVersions[0];
    const coreClient = await this.coreClient;
    const { client, instance } = coreClient;
    const [platform, architecture] = item.id.split(':');

    const req: PlatformInstallRequest = {
      instance,
      architecture,
      platformPackage: platform,
      version,
      noOverwrite: Boolean(options.noOverwrite),
      skipPostInstall: Boolean(options.skipPostInstall),
    };

    const dataCallback = ExecuteWithProgress.createDataCallback({
      progressId: options.progressId,
      responseService: this.responseService,
    });

    console.info('>>> Starting boards package installation...', item);

    // stop the board discovery
    await this.boardDiscovery.stop();
    try {
      for await (const resp of client.platformInstall(req)) {
        dataCallback(resp);
      }
    } catch (err) {
      this.responseService.appendToOutput({
        chunk: `${platformInstallFailed(
          item.id,
          version
        )}\n${err.toString()}\n`,
      });
      throw err;
    } finally {
      this.boardDiscovery.start(); // TODO: remove discovery dependency from boards service. See https://github.com/arduino/arduino-ide/pull/1107 why this is here.
    }
    const items = await this.search({});
    const updated =
      items.find((other) => BoardsPackage.equals(other, item)) || item;
    this.notificationService.notifyPlatformDidInstall({ item: updated });
    console.info('<<< Boards package installation done.', item);
  }

  async uninstall(options: {
    item: BoardsPackage;
    progressId?: string;
  }): Promise<void> {
    const { item, progressId } = options;
    const coreClient = await this.coreClient;
    const { client, instance } = coreClient;

    const [platform, architecture] = item.id.split(':');

    const req: PlatformUninstallRequest = {
      instance,
      architecture,
      platformPackage: platform,
    };
    const dataCallback = ExecuteWithProgress.createDataCallback({
      progressId,
      responseService: this.responseService,
    });

    console.info('>>> Starting boards package uninstallation...', item);

    // stop the board discovery
    await this.boardDiscovery.stop();
    try {
      for await (const resp of client.platformUninstall(req)) {
        dataCallback(resp);
      }
    } finally {
      this.boardDiscovery.start(); // TODO: remove discovery dependency from boards service. See https://github.com/arduino/arduino-ide/pull/1107 why this is here.
    }
    // Here, unlike at `install` we send out the argument `item`. Otherwise, we would not know about the board FQBN.
    this.notificationService.notifyPlatformDidUninstall({ item });
    console.info('<<< Boards package uninstallation done.', item);
  }
}

function isMissingPlatformError(error: unknown): boolean {
  if (ServiceError.is(error)) {
    const message = error.details;
    // TODO: check gRPC status code? `9 FAILED_PRECONDITION` (https://grpc.github.io/grpc/core/md_doc_statuscodes.html)

    // When installing a 3rd party core that depends on a missing Arduino core.
    // https://github.com/arduino/arduino-cli/issues/954
    if (
      message.includes('missing platform release') &&
      message.includes('referenced by board')
    ) {
      return true;
    }

    // When the platform is not installed.
    if (message.includes('platform') && message.includes('not installed')) {
      return true;
    }

    // It's a hack to handle https://github.com/arduino/arduino-cli/issues/1262 gracefully.
    if (message.includes('unknown package')) {
      return true;
    }
  }
  return false;
}

function boardsPackageSortGroup(boardsPackage: BoardsPackage): SortGroup {
  const types: string[] = [];
  if (boardsPackage.types.includes('Arduino')) {
    types.push('Arduino');
  }
  if (boardsPackage.deprecated) {
    types.push('Retired');
  }
  return types.join('-') as SortGroup;
}

function toBoardsPackage(
  platform: Platform,
  installedPlatforms: Platform[]
): BoardsPackage {
  let installedVersion: string | undefined;
  const matchingPlatform = installedPlatforms.find(
    (ip) => ip.id === platform.id
  );
  if (!!matchingPlatform) {
    installedVersion = matchingPlatform.installed;
  }
  return {
    id: platform.id,
    name: platform.name,
    author: platform.maintainer,
    availableVersions: [platform.latest],
    description: platform.boards.map(({ name }) => name).join(', '),
    types: platform.type,
    deprecated: platform.deprecated,
    summary: nls.localize(
      'arduino/component/boardsIncluded',
      'Boards included in this package:'
    ),
    installedVersion,
    boards: platform.boards.map(({ name, fqbn }) => <Board>{ name, fqbn }),
    moreInfoLink: platform.website,
  };
}
