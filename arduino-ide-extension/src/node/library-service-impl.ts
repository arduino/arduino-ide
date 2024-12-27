import { ILogger, MessageService, notEmpty } from '@theia/core';
import { FileUri } from '@theia/core/lib/node';
import { inject, injectable } from '@theia/core/shared/inversify';
import { duration } from '../common/decorators';
import {
  NotificationServiceServer,
  ResponseService,
  sortComponents,
  SortGroup,
} from '../common/protocol';
import {
  Installable,
  libraryInstallFailed,
} from '../common/protocol/installable';
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
import { ServiceError } from './service-error';
import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'node:os';
import { join } from 'node:path';
import * as fs1 from 'fs-extra';
import { path7za } from '7zip-bin';
import { extractFull } from 'node-7z';
import * as https from 'https';

const URL = 'https://www.zxjian.com/api/databook';

@injectable()
export class LibraryServiceImpl
  extends CoreClientAware
  implements LibraryService {
  private librarys: any; // 存储网络请求回来的数据

  @inject(ILogger)
  protected logger: ILogger;

  @inject(ResponseService)
  protected readonly responseService: ResponseService;

  @inject(BoardDiscovery)
  protected readonly boardDiscovery: BoardDiscovery;

  @inject(NotificationServiceServer)
  protected readonly notificationServer: NotificationServiceServer;

  @inject(MessageService)
  private readonly messageService: MessageService;

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

  async getBoardLibraries(): Promise<string[]> {
    const folderNames: string[] = [];

    let lingzhiPath = join(homedir(), 'AppData\\Local\\Lingzhi');
    if (fs.existsSync(lingzhiPath)) {
      // 读取目录下的所有文件和文件夹信息
      lingzhiPath = join(
        homedir(),
        'AppData\\Local\\Lingzhi\\packages\\lingzhi\\hardware'
      );
      const filesAndFolders = fs.readdirSync(lingzhiPath);

      // 遍历每个文件和文件夹
      for (const item of filesAndFolders) {
        // 获取完整路径
        const itemPath = path.join(lingzhiPath, item);
        const libraryPath = join(itemPath, 'libraries');

        // 判断是否为文件夹
        if (fs.statSync(itemPath).isDirectory() && fs.existsSync(libraryPath)) {
          folderNames.push(item);
        }
      }
    }
    return folderNames;
  }

  async installLibrary(
    path: string,
    model: string
  ): Promise<[string, boolean]> {
    try {
      let path1: string;
      if (model === 'GPLibrary') {
        path1 = `AppData\\Local\\Lingzhi\\libraries`;
      } else {
        path1 = `AppData\\Local\\Lingzhi\\packages\\lingzhi\\hardware\\${model}\\libraries`;
      }
      const installLibraryPath = join(homedir(), path1);

      // 判断是否为库文件，判断是否有library.properties文件
      const libraryPropertiesPath = join(path, 'library.properties');
      if (!fs.existsSync(libraryPropertiesPath)) {
        return ['目录无效,选择目录不包含library.properties文件!', false];
      }
      this.copyFolderRecursively(path, installLibraryPath);
    } catch (error) {
      console.error('安装库失败:', error);
      return ['安装本地库失败!', false];
    }
    return ['安装成功!', true];
  }

  async copyFolderRecursively(
    source: string,
    destinationParent: string
  ): Promise<void> {
    try {
      // 获取源文件夹的名称（从完整路径中提取最后一部分作为文件夹名）
      const sourceFolderName = path.basename(source);
      // 拼接出在目标父文件夹下新创建的文件夹路径（与源文件夹同名）
      const newDestination = path.join(destinationParent, sourceFolderName);

      // 先判断目标文件夹是否存在，如果存在则删除整个文件夹及其内容
      if (await fs1.pathExists(newDestination)) {
        await fs1.remove(newDestination);
      }

      // 创建新的目标文件夹
      await fs1.ensureDir(newDestination);

      // 获取源文件夹下的所有文件和子文件夹信息（包括子文件夹中的内容）
      const items = await fs1.readdir(source);

      for (const item of items) {
        const sourceItemPath = path.join(source, item);
        const destinationItemPath = path.join(newDestination, item);
        const itemStat = await fs1.stat(sourceItemPath);

        if (itemStat.isDirectory()) {
          // 如果是子文件夹，递归调用复制函数继续复制该子文件夹及其内容
          await this.copyFolderRecursively(sourceItemPath, newDestination);
        } else {
          // 如果是文件，直接复制文件到目标文件夹对应的位置
          await fs1.copy(sourceItemPath, destinationItemPath);
        }
      }
    } catch (err) {
      console.error('复制文件夹出错: ', err);
    }
  }

  async manualData(value: string, libraryName: string): Promise<string> {
    try {
      let path: string;
      if (value === 'GPLibrary') {
        path = `AppData\\Local\\Lingzhi\\libraries\\${libraryName}\\manual.html`;
      } else {
        path = `AppData\\Local\\Lingzhi\\packages\\lingzhi\\hardware\\${value}\\libraries\\${libraryName}\\manual.html`;
      }
      const directoryPath = join(homedir(), path);

      if (fs.existsSync(directoryPath)) {
        const manual = fs.readFileSync(directoryPath, { encoding: 'utf8' });
        return manual;
      }
    } catch (error) {
      console.error('读取目录失败:', error);
    }
    return '';
  }

  async netWorkingGetLibraryData(value: string): Promise<LibInfo[]> {
    let libraryData: any;
    let response: Response | null = await fetch(`${URL}/libraryData.json`);
    libraryData = response.ok ? await response.json() : null;
    this.librarys = libraryData;

    libraryData = await this.libraryData(value);
    return libraryData;
  }

  async libraryData(value: string): Promise<LibInfo[]> {
    const libInfo: LibInfo[] = [];

    try {
      let path1: string;
      if (value === 'GPLibrary') {
        path1 = `AppData\\Local\\Lingzhi\\libraries`;
      } else {
        path1 = `AppData\\Local\\Lingzhi\\packages\\lingzhi\\hardware\\${value}\\libraries`;
      }
      const directoryPath = join(homedir(), path1);
      // 读取目录下的所有文件和文件夹信息
      const filesAndFolders = fs.readdirSync(directoryPath);

      this.responseLibrary.set(value, []);
      // 遍历每个文件和文件夹
      for (const item of filesAndFolders) {
        // 获取完整路径
        const itemPath = path.join(directoryPath, item);

        // 网络请求libraryData.josn的数据
        const itemLibInfo = await this.responseLibraryData(value, item);

        // 详细说明文件夹
        const libInfoPath = path.join(directoryPath, `${item}\\libinfo.ini`);
        const libraryPath = path.join(
          directoryPath,
          `${item}\\library.properties`
        );

        // 判断是否为文件夹
        if (fs.statSync(itemPath).isDirectory()) {
          const lib = new LibInfo();
          const libvers = new Libvers();
          let version = '';
          if (fs.existsSync(libInfoPath)) {
            const data = fs.readFileSync(libInfoPath, { encoding: 'utf8' });
            data.split('\n').forEach(async (line) => {
              const [key, value] = line.split('=');
              switch (key) {
                case 'name':
                  lib.name = value;
                  break;
                case 'brief':
                  libvers.brief = value;
                  break;
                case 'libver':
                  version = value;
                  libvers.libver = value;
                  break;
                case 'classname':
                  lib.className = value;
                  break;
                case 'incfile':
                  lib.incfile = value;
                  break;
              }
            });
          } else {
            if (fs.existsSync(libraryPath)) {
              const data = fs.readFileSync(libraryPath, { encoding: 'utf8' });
              data.split('\n').forEach((line) => {
                const [key, value] = line.split('=');
                switch (key) {
                  case 'name':
                    lib.name = value;
                    break;
                  case 'version':
                    version = value;
                    libvers.libver = value;
                    break;
                  case 'paragraph':
                    libvers.brief = value;
                    break;
                }
              });
            } else {
              lib.name = item;
              libvers.libver = '1.0';
            }
          }
          libvers.isCurrentVersion = true;
          lib.libvers = [libvers];
          lib.libraryName = item;
          lib.state = 'installed';
          if (!itemLibInfo) {
            libInfo.push(lib);
          } else {
            let isLowVersion = false;
            itemLibInfo.libvers.forEach(async (item) => {
              const result = await this.compareVersions(version, item.libver);
              if (result < 0) {
                itemLibInfo.state = 'renewable';
                item.isCurrentVersion = false;
                isLowVersion = true;
              } else if (result === 0) {
                if (!isLowVersion) {
                  itemLibInfo.state = 'installed';
                } else {
                  itemLibInfo.state = 'renewable';
                }
                item.isCurrentVersion = true;
              } else if (result > 0) {
                itemLibInfo.state = 'installed';
                item.isCurrentVersion = false;
              }
              if (version === '') {
                itemLibInfo.state = 'installed';
                item.isCurrentVersion = true;
              }
            });
            const items = this.responseLibrary.get(value) as string[];
            items.push(item);
            this.responseLibrary.set(value, items);
            libInfo.push(itemLibInfo);
          }
        }
      }

      const libraryData = this.librarys;
      if (libraryData) {
        for (const board of libraryData.boards) {
          if (board.name === value) {
            for (const lib of board.libraries) {
              const responseLibrary = this.responseLibrary.get(
                value
              ) as string[];
              let i = 0;
              for (const item of responseLibrary) {
                if (lib.name !== item) {
                  i++;
                }
              }
              if (i === responseLibrary.length) {
                const library = new LibInfo();
                library.name = lib.name;
                library.className = lib.className;
                library.incfile = lib.incfile;
                lib.libvers.forEach((libver: Libvers) => {
                  libver.isCurrentVersion = false;
                });
                library.libvers = lib.libvers;
                library.libraryName = lib.name;
                library.state = 'uninstalled';
                libInfo.push(library);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('读取目录失败:', error);
    }
    return libInfo;
  }

  private responseLibrary: Map<string, string[]> = new Map();

  private async responseLibraryData(
    value: string,
    libraryName: string
  ): Promise<LibInfo | void> {
    let libraryData: any;
    if (this.librarys === undefined) {
      let response: Response | null = await fetch(`${URL}/libraryData.json`);
      libraryData = response.ok ? await response.json() : null;
      this.librarys = libraryData;
    } else {
      libraryData = this.librarys;
    }

    if (libraryData) {
      for (const board of libraryData.boards) {
        if (board.name === value) {
          for (const lib of board.libraries) {
            if (lib.name === libraryName) {
              const libInfo = new LibInfo();
              libInfo.name = lib.name;
              libInfo.className = lib.className;
              libInfo.incfile = lib.incfile;
              libInfo.libvers = lib.libvers;
              libInfo.libraryName = lib.name;
              return libInfo;
            }
          }
        }
      }
    }
  }

  async compareVersions(versionA: string, versionB: string): Promise<number> {
    const partsA = versionA.split('.').map(Number);
    const partsB = versionB.split('.').map(Number);
    const maxLength = Math.max(partsA.length, partsB.length);

    for (let i = 0; i < maxLength; i++) {
      const numA = partsA[i] || 0;
      const numB = partsB[i] || 0;
      if (numA < numB) {
        return -1;
      } else if (numA > numB) {
        return 1;
      }
    }

    return 0;
  }

  async installationLibrary(
    url: string,
    savePath: string,
    extractDir: string
  ): Promise<boolean> {
    savePath = join(homedir(), savePath);
    extractDir = join(homedir(), extractDir);
    const message = await this.messageService.showProgress({
      text: '安装中，请稍等...',
    });
    await this.downloadFile(url, savePath);
    const success = await this.extract7zFile(savePath, extractDir, url);
    message.cancel();
    if (success) {
      this.messageService.log('安装成功！', { timeout: 3000 });
    } else {
      this.messageService.log('安装失败！', { timeout: 3000 });
    }
    return success;
  }

  async downloadFile(url: string, savePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const dirname = savePath.substring(0, savePath.lastIndexOf('\\'));
      if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname, { recursive: true });
      }
      const fileStream = fs.createWriteStream(savePath);
      const req = https.get(url, (response) => {
        response.pipe(fileStream);
      });
      fileStream.on('finish', () => {
        resolve();
      });
      req.on('error', (err) => {
        reject(err);
      });
      fileStream.on('error', (err) => {
        reject(err);
      });
    });
  }

  async extract7zFile(
    savePath: string,
    extractDir: string,
    url: string
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(extractDir)) {
        fs.mkdirSync(extractDir, { recursive: true });
      }
      // 删除文件
      const fileName = url.split('/').pop() as string;
      const index = fileName.lastIndexOf('-');
      let mkName = '';
      if (index > -1) {
        mkName = fileName.substring(0, index);
      } else {
        mkName = fileName.split('.').shift() as string;
      }
      const mkPath = join(extractDir, mkName);
      try {
        if (fs.existsSync(mkPath)) {
          fs.rmSync(mkPath, { recursive: true });
        }
      } catch (err) {
        console.error('删除文件夹失败：', err);
      }

      const seven = extractFull(savePath, extractDir, {
        $bin: path7za,
      });
      seven.on('end', async () => {
        console.log('7z文件解压成功！');
        resolve(true);
      });
      seven.on('error', async (err) => {
        console.error('7z文件解压过程中出现错误：', err);
        resolve(false);
        reject(err);
      });
    });
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
            description: library.getParagraph(),
            summary: library.getSentence(),
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
            console.error('Failed to list library dependencies', error);
            // If a gRPC service error, it removes the code and the number to provider more readable error message to the user.
            const unwrappedError = ServiceError.is(error)
              ? new Error(error.details)
              : error;
            reject(unwrappedError);
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
          chunk: `${libraryInstallFailed(item.name, version)}\n`,
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
    description: lib.getParagraph(),
    moreInfoLink: lib.getWebsite(),
    summary: lib.getSentence(),
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

export class LibInfo {
  name: string;
  libvers: Libvers[];
  className = '';
  incfile = '';
  libraryName: string;
  state: 'installed' | 'uninstalled' | 'renewable';
}

export class Libvers {
  libver: string;
  brief = '';
  isCurrentVersion: boolean;
  url = '';
}
