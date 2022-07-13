import { injectable, inject } from '@theia/core/shared/inversify';
import { ILogger } from '@theia/core/lib/common/logger';
import { notEmpty } from '@theia/core/lib/common/objects';
import {
  BoardsService,
  Installable,
  BoardsPackage,
  Board,
  Port,
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
  BoardSearchRequest,
} from './cli-protocol/cc/arduino/cli/commands/v1/board_pb';
import {
  ListProgrammersAvailableForUploadRequest,
  ListProgrammersAvailableForUploadResponse,
  SupportedUserFieldsRequest,
  SupportedUserFieldsResponse,
} from './cli-protocol/cc/arduino/cli/commands/v1/upload_pb';
import { ExecuteWithProgress } from './grpc-progressible';

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

  async getAttachedBoards(): Promise<Board[]> {
    return this.boardDiscovery.getAttachedBoards();
  }

  async getAvailablePorts(): Promise<Port[]> {
    return this.boardDiscovery.getAvailablePorts();
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
            // Required cores are not installed manually: https://github.com/arduino/arduino-cli/issues/954
            if (
              (err.message.indexOf('missing platform release') !== -1 &&
                err.message.indexOf('referenced by board') !== -1) ||
              // Platform is not installed.
              (err.message.indexOf('platform') !== -1 &&
                err.message.indexOf('not installed') !== -1)
            ) {
              resolve(undefined);
              return;
            }
            // It's a hack to handle https://github.com/arduino/arduino-cli/issues/1262 gracefully.
            if (err.message.indexOf('unknown package') !== -1) {
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
    const boards = await new Promise<BoardWithPackage[]>((resolve, reject) => {
      client.boardSearch(req, (error, resp) => {
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

    const supportedUserFieldsReq = new SupportedUserFieldsRequest();
    supportedUserFieldsReq.setInstance(instance);
    supportedUserFieldsReq.setFqbn(options.fqbn);
    supportedUserFieldsReq.setProtocol(options.protocol);

    const supportedUserFieldsResp =
      await new Promise<SupportedUserFieldsResponse>((resolve, reject) => {
        client.supportedUserFields(supportedUserFieldsReq, (err, resp) => {
          !!err ? reject(err) : resolve(resp);
        });
      });
    return supportedUserFieldsResp.getUserFieldsList().map((e) => {
      return {
        toolId: e.getToolId(),
        name: e.getName(),
        label: e.getLabel(),
        secret: e.getSecret(),
        value: '',
      };
    });
  }

  async search(options: { query?: string }): Promise<BoardsPackage[]> {
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
        deprecated: platform.getDeprecated(),
        summary: 'Boards included in this package:',
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

    return [...packages.values()];
  }

  async install(options: {
    item: BoardsPackage;
    progressId?: string;
    version?: Installable.Version;
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
          chunk: error.toString(),
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
