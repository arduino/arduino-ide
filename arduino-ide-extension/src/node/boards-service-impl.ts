import { ILogger } from '@theia/core/lib/common/logger';
import { nls } from '@theia/core/lib/common/nls';
import { notEmpty } from '@theia/core/lib/common/objects';
import { Mutable } from '@theia/core/lib/common/types';
import { inject, injectable } from '@theia/core/shared/inversify';
import {
  BoardDetails,
  BoardSearch,
  BoardUserField,
  BoardWithPackage,
  BoardsPackage,
  BoardsService,
  CheckDebugEnabledParams,
  ConfigOption,
  ConfigValue,
  DetectedPorts,
  Installable,
  NotificationServiceServer,
  Programmer,
  ResponseService,
  SortGroup,
  createPlatformIdentifier,
  platformIdentifierEquals,
  platformInstallFailed,
  sortComponents,
} from '../common/protocol';
import { BoardDiscovery } from './board-discovery';
import {
  BoardDetailsRequest,
  BoardDetailsResponse,
  BoardListAllRequest,
  BoardListAllResponse,
  BoardSearchRequest,
} from './cli-protocol/cc/arduino/cli/commands/v1/board_pb';
import { PlatformSummary } from './cli-protocol/cc/arduino/cli/commands/v1/common_pb';
import {
  PlatformInstallRequest,
  PlatformSearchRequest,
  PlatformSearchResponse,
  PlatformUninstallRequest,
} from './cli-protocol/cc/arduino/cli/commands/v1/core_pb';
import { IsDebugSupportedRequest } from './cli-protocol/cc/arduino/cli/commands/v1/debug_pb';
import {
  ListProgrammersAvailableForUploadRequest,
  ListProgrammersAvailableForUploadResponse,
  SupportedUserFieldsRequest,
  SupportedUserFieldsResponse,
} from './cli-protocol/cc/arduino/cli/commands/v1/upload_pb';
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

    const requiredTools = detailsResp.getToolsDependenciesList().map((t) => ({
      name: t.getName(),
      packager: t.getPackager(),
      version: t.getVersion(),
    }));

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
    const defaultProgrammerId = detailsResp.getDefaultProgrammerId();

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
    const buildProperties = detailsResp.getBuildPropertiesList();

    return {
      fqbn,
      requiredTools,
      configOptions,
      programmers,
      VID,
      PID,
      buildProperties,
      ...(defaultProgrammerId ? { defaultProgrammerId } : {}),
    };
  }

  async checkDebugEnabled(params: CheckDebugEnabledParams): Promise<string> {
    const { fqbn, programmer } = params;
    const { client, instance } = await this.coreClient;
    const req = new IsDebugSupportedRequest()
      .setInstance(instance)
      .setFqbn(fqbn)
      .setProgrammer(programmer ?? '');
    try {
      const debugFqbn = await new Promise<string>((resolve, reject) =>
        client.isDebugSupported(req, (err, resp) => {
          if (err) {
            reject(err);
            return;
          }
          if (resp.getDebuggingSupported()) {
            const debugFqbn = resp.getDebugFqbn();
            if (debugFqbn) {
              resolve(debugFqbn);
            }
          }
          reject(new Error(`Debugging is not supported.`));
        })
      );
      return debugFqbn;
    } catch (err) {
      console.error(`Failed to get debug config: ${fqbn}, ${programmer}`, err);
      throw err;
    }
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

  async getInstalledPlatforms(): Promise<BoardsPackage[]> {
    const { instance, client } = await this.coreClient;
    const resp = await new Promise<PlatformSearchResponse>(
      (resolve, reject) => {
        client.platformSearch(
          new PlatformSearchRequest()
            .setInstance(instance)
            .setManuallyInstalled(true), // include core manually installed to the sketchbook
          (err, resp) => (err ? reject(err) : resolve(resp))
        );
      }
    );
    const searchOutput = resp.getSearchOutputList();
    return searchOutput
      .map((message) => message.toObject(false))
      .filter((summary) => summary.installedVersion) // only installed ones
      .map(createBoardsPackage)
      .filter(notEmpty);
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
            const metadata = platform.getMetadata();
            if (!metadata) {
              console.warn(
                `Platform metadata is missing for platform: ${JSON.stringify(
                  platform.toObject(false)
                )}. Skipping`
              );
              continue;
            }
            const platformId = metadata.getId();
            const release = platform.getRelease();
            if (!release) {
              console.warn(
                `Platform release is missing for platform: ${platformId}. Skipping`
              );
              continue;
            }
            const fqbn = board.getFqbn() || undefined; // prefer undefined over empty string
            const parsedPlatformId = createPlatformIdentifier(platformId);
            if (!parsedPlatformId) {
              console.warn(
                `Could not create platform identifier from platform ID input: ${platformId}. Skipping`
              );
              continue;
            }
            if (fqbn) {
              const checkPlatformId = createPlatformIdentifier(board.getFqbn());
              if (!checkPlatformId) {
                console.warn(
                  `Could not create platform identifier from FQBN input: ${board.getFqbn()}. Skipping`
                );
                continue;
              }
              if (
                !platformIdentifierEquals(parsedPlatformId, checkPlatformId)
              ) {
                console.warn(
                  `Mismatching platform identifiers. Platform: ${JSON.stringify(
                    parsedPlatformId
                  )}, FQBN: ${JSON.stringify(checkPlatformId)}. Skipping`
                );
                continue;
              }
            }
            boards.push({
              name: board.getName(),
              fqbn: board.getFqbn(),
              packageId: parsedPlatformId,
              packageName: release.getName(),
              manuallyInstalled: metadata.getManuallyInstalled(),
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

    // `core search` returns with all platform versions when the command is executed via gRPC or with `--format json`
    // The `--all` flag is applicable only when filtering for the human-readable (`--format text`) output of the CLI
    const resp = await new Promise<PlatformSearchResponse>(
      (resolve, reject) => {
        client.platformSearch(
          new PlatformSearchRequest()
            .setInstance(instance)
            .setSearchArgs(options.query ?? ''),
          (err, resp) => (err ? reject(err) : resolve(resp))
        );
      }
    );
    const typeFilter = this.typePredicate(options);
    const searchOutput = resp.getSearchOutputList();
    const boardsPackages = searchOutput
      .map((message) => message.toObject(false))
      .map(createBoardsPackage)
      .filter(notEmpty)
      .filter(typeFilter);
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

    const req = new PlatformInstallRequest();
    req.setInstance(instance);
    req.setArchitecture(architecture);
    req.setPlatformPackage(platform);
    req.setVersion(version);
    req.setNoOverwrite(Boolean(options.noOverwrite));
    if (options.skipPostInstall) {
      req.setSkipPostInstall(true);
    }

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
          chunk: `${platformInstallFailed(item.id, version)}\n`,
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

function createBoardsPackage(
  summary: PlatformSummary.AsObject
): BoardsPackage | undefined {
  if (!isPlatformSummaryWithMetadata(summary)) {
    return undefined;
  }
  const versionReleaseMap = new Map(summary.releasesMap);
  const actualRelease =
    versionReleaseMap.get(summary.installedVersion) ??
    versionReleaseMap.get(summary.latestVersion);
  if (!actualRelease) {
    return undefined;
  }
  const { name, typeList, boardsList, deprecated, compatible } = actualRelease;
  if (!compatible) {
    return undefined; // never show incompatible platforms
  }
  const { id, website, maintainer } = summary.metadata;
  const availableVersions = Array.from(versionReleaseMap.keys())
    .sort(Installable.Version.COMPARATOR)
    .reverse();
  const boardsPackage: Mutable<BoardsPackage> = {
    id,
    name,
    summary: nls.localize(
      'arduino/component/boardsIncluded',
      'Boards included in this package:'
    ),
    description: boardsList.map(({ name }) => name).join(', '),
    boards: boardsList,
    types: typeList,
    moreInfoLink: website,
    author: maintainer,
    deprecated,
    availableVersions,
  };
  if (summary.installedVersion) {
    boardsPackage.installedVersion = summary.installedVersion;
  }
  return boardsPackage;
}

type PlatformSummaryWithMetadata = PlatformSummary.AsObject &
  Required<Pick<PlatformSummary.AsObject, 'metadata'>>;
function isPlatformSummaryWithMetadata(
  summary: PlatformSummary.AsObject
): summary is PlatformSummaryWithMetadata {
  return Boolean(summary.metadata);
}
