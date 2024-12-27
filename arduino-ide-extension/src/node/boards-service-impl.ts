import { ILogger } from '@theia/core/lib/common/logger';
import { nls } from '@theia/core/lib/common/nls';
import { notEmpty } from '@theia/core/lib/common/objects';
import { inject, injectable } from '@theia/core/shared/inversify';
import {
  Board,
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
import { Platform } from './cli-protocol/cc/arduino/cli/commands/v1/common_pb';
import {
  PlatformInstallRequest,
  PlatformListRequest,
  PlatformListResponse,
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

import { path7za } from '7zip-bin';
import { extractFull } from 'node-7z';
import fs from 'fs';
import * as https from 'https';
import { homedir } from 'node:os';
import { join } from 'node:path';

const getZhiLink = 'https://zxjian.com/api/version/getLinkPwdByLink?url=';

let downloadNumber = 0;
let successNumber = 0;

@injectable()
export class BoardsServiceImpl
  extends CoreClientAware
  implements BoardsService {
  private totalBytes = 0;
  private downloadedBytes = 0;

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

  async installLingzhiPackage(
    lanzouUrl: string,
    savePath: string,
    extractDir: string,
    taskNumber: number
  ): Promise<void> {
    // 如果下载次数大于2
    if (downloadNumber > 2) {
      // 返回一个Promise对象
      return new Promise((resolve, reject) => {
        // 设置一个定时器，每隔100毫秒执行一次
        let timerId = setInterval(() => {
          // 如果成功的次数大于等于任务的总数
          if (successNumber >= taskNumber) {
            // 清除定时器
            clearTimeout(timerId);
            // 解析Promise对象
            resolve();
          }
        }, 100);
      });
    }
    // 下载次数加1
    downloadNumber++;
    savePath = join(homedir(), savePath);
    extractDir = join(homedir(), extractDir);
    await this.downloadFile(lanzouUrl, savePath);
    await this.extract7zFile(savePath, extractDir);
  }

  async hasLingZhiPackage(path: string): Promise<boolean> {
    try {
      await fs.promises.stat(join(homedir(), path));
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return false;
      }
      console.log(error);
      throw false;
    }
  }

  async downloadFile(lanzouUrl: string, savePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // 获取下载链接
      let url = getZhiLink + lanzouUrl;
      // 发送https请求
      https.get(url, (resp) => {
        let zhiLink = '';
        // 监听data事件，获取返回的数据
        resp.on('data', (chunk) => {
          zhiLink += chunk;
        });
        // 监听end事件，表示数据接收完毕
        resp.on('end', () => {
          // 获取保存路径的目录名
          const dirname = savePath.substring(0, savePath.lastIndexOf('\\'));
          // 如果目录不存在，则创建目录
          if (!fs.existsSync(dirname)) {
            fs.mkdirSync(dirname, { recursive: true });
          }
          // 创建文件写入流
          const fileStream = fs.createWriteStream(savePath);
          // 发送https请求，获取文件数据
          const req = https.get(
            zhiLink.substring(1, zhiLink.length - 1),
            (response) => {
              // 如果响应头中有content-length字段，则将文件大小累加到totalBytes
              if (response.headers['content-length']) {
                this.totalBytes += parseInt(
                  response.headers['content-length'],
                  10
                );
              }
              // 将文件数据写入文件
              response.pipe(fileStream);
              // 监听data事件，获取已下载的字节数
              response.on('data', (chunk) => {
                this.downloadedBytes += chunk.length;
              });
            }
          );
          // 监听finish事件，表示文件写入完毕
          fileStream.on('finish', () => {
            resolve();
          });
          // 监听error事件，表示请求出错
          req.on('error', (err) => {
            reject(err);
          });
          // 监听error事件，表示文件写入出错
          fileStream.on('error', (err) => {
            reject(err);
          });
        });
      });
    });
  }

  async extract7zFile(filePath: string, extractDir: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const dirname = extractDir.substring(0, extractDir.lastIndexOf('\\'));
      if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname, { recursive: true });
      }
      const seven = extractFull(filePath, extractDir, {
        $bin: path7za,
      });
      seven.on('end', () => {
        console.log('7z文件解压成功！');
        successNumber++;
        resolve();
      });
      // 处理解压过程中的错误
      seven.on('error', (err) => {
        console.error('7z文件解压过程中出现错误：', err);
        reject(err);
      });
    });
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

  // 异步获取已安装的板子
  async getInstalledBoards(): Promise<BoardWithPackage[]> {
    // 获取coreClient实例和客户端
    const { instance, client } = await this.coreClient;
    const req = new BoardListAllRequest();
    req.setInstance(instance);
    // 处理获取板子的请求
    return this.handleListBoards(client.boardListAll.bind(client), req);
  }

  async getInstalledPlatforms(): Promise<BoardsPackage[]> {
    const { instance, client } = await this.coreClient;
    return new Promise<BoardsPackage[]>((resolve, reject) => {
      client.platformList(
        new PlatformListRequest().setInstance(instance),
        (err, response) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(
            response
              .getInstalledPlatformsList()
              .map((platform, _, installedPlatforms) =>
                toBoardsPackage(platform, installedPlatforms)
              )
          );
        }
      );
    });
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
            const platformId = platform.getId();
            const fqbn = board.getFqbn() || undefined; // prefer undefined over empty string
            const parsedPlatformId = createPlatformIdentifier(platformId);
            if (!parsedPlatformId) {
              console.warn(
                `Could not create platform identifier from platform ID input: ${platform.getId()}. Skipping`
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
    // 获取版本号，如果没有指定版本号，则使用item.availableVersions[0]
    const version = !!options.version
      ? options.version
      : item.availableVersions[0];
    // 获取coreClient
    const coreClient = await this.coreClient;
    // 获取client和instance
    const { client, instance } = coreClient;

    // 获取platform和architecture
    const [platform, architecture] = item.id.split(':');

    // 创建PlatformInstallRequest
    // 创建一个新的PlatformInstallRequest对象
    const req = new PlatformInstallRequest();
    // 设置实例
    req.setInstance(instance);
    // 设置架构
    req.setArchitecture(architecture);
    // 设置平台包
    req.setPlatformPackage(platform);
    // 设置版本
    req.setVersion(version);
    // 设置是否覆盖
    req.setNoOverwrite(Boolean(options.noOverwrite));
    // 如果跳过后安装，则设置跳过后安装为true
    if (options.skipPostInstall) {
      req.setSkipPostInstall(true);
    }

    console.info('>>> Starting boards package installation...', item);

    // stop the board discovery
    // 停止板子发现
    await this.boardDiscovery.stop();

    // 发起平台安装请求
    const resp = client.platformInstall(req);
    // 注册数据回调函数
    // 监听data事件，当有数据返回时执行回调函数
    resp.on(
      'data',
      // 创建一个带有进度id和响应服务的回调函数
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

function toBoardsPackage(
  platform: Platform,
  installedPlatforms: Platform[]
): BoardsPackage {
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
}
