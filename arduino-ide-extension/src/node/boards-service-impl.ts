import { injectable, inject } from '@theia/core/shared/inversify';
import { ILogger } from '@theia/core/lib/common/logger';
import { notEmpty } from '@theia/core/lib/common/objects';
import {
  BoardsService,
  Installable,
  BoardsPackage,
  Board,
  BoardDetails,
  Tool,
  ConfigOption,
  ConfigValue,
  Programmer,
  ResponseService,
  NotificationServiceServer,
  AvailablePorts,
  BoardWithPackage,
  BoardUserField,
  BoardSearch,
} from '../common/protocol';
import {
  PlatformInstallRequest,
  PlatformListRequest,
  PlatformListResponse,
  PlatformSearchRequest,
  PlatformSearchResponse,
  PlatformUninstallRequest,
} from './cli-protocol/cc/arduino/cli/commands/v1/core_pb';
import { Platform } from './cli-protocol/cc/arduino/cli/commands/v1/common_pb';
import { BoardDiscovery } from './board-discovery';
import { CoreClientAware } from './core-client-provider';
import {
  BoardDetailsRequest,
  BoardDetailsResponse,
  BoardListAllRequest,
  BoardListAllResponse,
  BoardSearchRequest,
} from './cli-protocol/cc/arduino/cli/commands/v1/board_pb';
import {
  ListProgrammersAvailableForUploadRequest,
  ListProgrammersAvailableForUploadResponse,
  SupportedUserFieldsRequest,
  SupportedUserFieldsResponse,
} from './cli-protocol/cc/arduino/cli/commands/v1/upload_pb';
import { ExecuteWithProgress } from './grpc-progressible';
import { ServiceError } from './service-error';
import { nls } from '@theia/core/lib/common';

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

  async getState(): Promise<AvailablePorts> {
    return this.boardDiscovery.availablePorts;
  }

  async getBoardDetails(options: {
    fqbn: string;
  }): Promise<BoardDetails | undefined> {
    const coreClient = await this.coreClient;
    const { client, instance } = coreClient;
    const { fqbn } = options;
    const detailsReq = new BoardDetailsRequest();
    detailsReq.setInstance(instance);
    detailsReq.setFqbn(fqbn);
    const detailsResp = await new Promise<BoardDetailsResponse | undefined>(
      (resolve, reject) =>
        client.boardDetails(detailsReq, (err, resp) => {
          if (err) {
            if (isMissingPlatformError(err)) {
              resolve(undefined);
              return;
            }
            reject(err);
            return;
          }
          resolve(resp);
        })
    );

    if (!detailsResp) {
      return undefined;
    }

    const debuggingSupported = detailsResp.getDebuggingSupported();

    const requiredTools = detailsResp.getToolsDependenciesList().map(
      (t) =>
        <Tool>{
          name: t.getName(),
          packager: t.getPackager(),
          version: t.getVersion(),
        }
    );

    const configOptions = detailsResp.getConfigOptionsList().map(
      (c) =>
        <ConfigOption>{
          label: c.getOptionLabel(),
          option: c.getOption(),
          values: c.getValuesList().map(
            (v) =>
              <ConfigValue>{
                value: v.getValue(),
                label: v.getValueLabel(),
                selected: v.getSelected(),
              }
          ),
        }
    );

    const listReq = new ListProgrammersAvailableForUploadRequest();
    listReq.setInstance(instance);
    listReq.setFqbn(fqbn);
    const listResp =
      await new Promise<ListProgrammersAvailableForUploadResponse>(
        (resolve, reject) =>
          client.listProgrammersAvailableForUpload(listReq, (err, resp) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(resp);
          })
      );

    const programmers = listResp.getProgrammersList().map(
      (p) =>
        <Programmer>{
          id: p.getId(),
          name: p.getName(),
          platform: p.getPlatform(),
        }
    );

    let VID = 'N/A';
    let PID = 'N/A';
    const prop = detailsResp
      .getIdentificationPropertiesList()
      .map((item) => item.getPropertiesMap())
      .find(notEmpty);
    if (prop) {
      VID = prop.get('vid') || '';
      PID = prop.get('pid') || '';
    }

    return {
      fqbn,
      requiredTools,
      configOptions,
      programmers,
      debuggingSupported,
      VID,
      PID,
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
    const req = new BoardSearchRequest();
    req.setSearchArgs(query || '');
    req.setInstance(instance);
    return this.handleListBoards(client.boardSearch.bind(client), req);
  }

  async getInstalledBoards(): Promise<BoardWithPackage[]> {
    const { instance, client } = await this.coreClient;
    const req = new BoardListAllRequest();
    req.setInstance(instance);
    return this.handleListBoards(client.boardListAll.bind(client), req);
  }

  private async handleListBoards(
    getBoards: (
      request: BoardListAllRequest | BoardSearchRequest,
      callback: (
        error: ServiceError | null,
        response: BoardListAllResponse
      ) => void
    ) => void,
    request: BoardListAllRequest | BoardSearchRequest
  ): Promise<BoardWithPackage[]> {
    const boards = await new Promise<BoardWithPackage[]>((resolve, reject) => {
      getBoards(request, (error, resp) => {
        if (error) {
          reject(error);
          return;
        }
        const boards: Array<BoardWithPackage> = [];
        for (const board of resp.getBoardsList()) {
          const platform = board.getPlatform();
          if (platform) {
            boards.push({
              name: board.getName(),
              fqbn: board.getFqbn(),
              packageId: platform.getId(),
              packageName: platform.getName(),
              manuallyInstalled: platform.getManuallyInstalled(),
            });
          }
        }
        resolve(boards);
      });
    });
    return boards;
  }

  async getBoardUserFields(options: {
    fqbn: string;
    protocol: string;
  }): Promise<BoardUserField[]> {
    const coreClient = await this.coreClient;
    const { client, instance } = coreClient;

    const req = new SupportedUserFieldsRequest();
    req.setInstance(instance);
    req.setFqbn(options.fqbn);
    req.setProtocol(options.protocol);

    const resp = await new Promise<SupportedUserFieldsResponse | undefined>(
      (resolve, reject) => {
        client.supportedUserFields(req, (err, resp) => {
          if (err) {
            if (isMissingPlatformError(err)) {
              resolve(undefined);
              return;
            }
            reject(err);
            return;
          }
          resolve(resp);
        });
      }
    );

    if (!resp) {
      return [];
    }

    return resp.getUserFieldsList().map((e) => ({
      toolId: e.getToolId(),
      name: e.getName(),
      label: e.getLabel(),
      secret: e.getSecret(),
      value: '',
    }));
  }

  async search(options: BoardSearch): Promise<BoardsPackage[]> {
    const coreClient = await this.coreClient;
    const { client, instance } = coreClient;

    const installedPlatformsReq = new PlatformListRequest();
    installedPlatformsReq.setInstance(instance);
    const installedPlatformsResp = await new Promise<PlatformListResponse>(
      (resolve, reject) => {
        client.platformList(installedPlatformsReq, (err, resp) => {
          !!err ? reject(err) : resolve(resp);
        });
      }
    );
    const installedPlatforms =
      installedPlatformsResp.getInstalledPlatformsList();

    const req = new PlatformSearchRequest();
    req.setSearchArgs(options.query || '');
    req.setAllVersions(true);
    req.setInstance(instance);
    const resp = await new Promise<PlatformSearchResponse>(
      (resolve, reject) => {
        client.platformSearch(req, (err, resp) => {
          !!err ? reject(err) : resolve(resp);
        });
      }
    );
    const packages = new Map<string, BoardsPackage>();
    const toPackage = (platform: Platform) => {
      let installedVersion: string | undefined;
      const matchingPlatform = installedPlatforms.find(
        (ip) => ip.getId() === platform.getId()
      );
      if (!!matchingPlatform) {
        installedVersion = matchingPlatform.getInstalled();
      }
      return {
        id: platform.getId(),
        name: platform.getName(),
        author: platform.getMaintainer(),
        availableVersions: [platform.getLatest()],
        description: platform
          .getBoardsList()
          .map((b) => b.getName())
          .join(', '),
        installable: true,
        types: platform.getTypeList(),
        deprecated: platform.getDeprecated(),
        summary: nls.localize(
          'arduino/component/boardsIncluded',
          'Boards included in this package:'
        ),
        installedVersion,
        boards: platform
          .getBoardsList()
          .map((b) => <Board>{ name: b.getName(), fqbn: b.getFqbn() }),
        moreInfoLink: platform.getWebsite(),
      };
    };

    // We must group the cores by ID, and sort platforms by, first the installed version, then version alphabetical order.
    // Otherwise we lose the FQBN information.
    const groupedById: Map<string, Platform[]> = new Map();
    for (const platform of resp.getSearchOutputList()) {
      const id = platform.getId();
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
        (ip) =>
          ip.getId() === left.getId() && ip.getInstalled() === left.getLatest()
      );
      const rightInstalled = !!installedPlatforms.find(
        (ip) =>
          ip.getId() === right.getId() &&
          ip.getInstalled() === right.getLatest()
      );
      if (leftInstalled && !rightInstalled) {
        return -1;
      }
      if (!leftInstalled && rightInstalled) {
        return 1;
      }

      const invertedVersionComparator =
        Installable.Version.COMPARATOR(left.getLatest(), right.getLatest()) *
        -1;
      // Higher version comes first.

      return invertedVersionComparator;
    };
    for (const value of groupedById.values()) {
      value.sort(installedAwareVersionComparator);
    }

    for (const value of groupedById.values()) {
      for (const platform of value) {
        const id = platform.getId();
        const pkg = packages.get(id);
        if (pkg) {
          pkg.availableVersions.push(platform.getLatest());
          pkg.availableVersions.sort(Installable.Version.COMPARATOR).reverse();
        } else {
          packages.set(id, toPackage(platform));
        }
      }
    }

    const filter = this.typePredicate(options);
    return [...packages.values()].filter(filter);
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
  }): Promise<void> {
    const item = options.item;
    const version = !!options.version
      ? options.version
      : item.availableVersions[0];
    const coreClient = await this.coreClient;
    const { client, instance } = coreClient;

    const [platform, architecture] = item.id.split(':');

    const req = new PlatformInstallRequest();
    req.setInstance(instance);
    req.setArchitecture(architecture);
    req.setPlatformPackage(platform);
    req.setVersion(version);
    req.setNoOverwrite(Boolean(options.noOverwrite));

    console.info('>>> Starting boards package installation...', item);

    // stop the board discovery
    await this.boardDiscovery.stop();

    const resp = client.platformInstall(req);
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
          chunk: `Failed to install platform: ${item.id}.\n`,
        });
        this.responseService.appendToOutput({
          chunk: `${error.toString()}\n`,
        });
        reject(error);
      });
    });

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

    const req = new PlatformUninstallRequest();
    req.setInstance(instance);
    req.setArchitecture(architecture);
    req.setPlatformPackage(platform);

    console.info('>>> Starting boards package uninstallation...', item);

    // stop the board discovery
    await this.boardDiscovery.stop();

    const resp = client.platformUninstall(req);
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
