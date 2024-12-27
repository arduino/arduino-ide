import { LocalStorageService } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import {
  BoardsService,
  LibraryLocation,
  LibraryService,
  ResponseService,
} from '../../common/protocol';
import { Contribution } from './contribution';
import { ApplicationShell } from '../theia/core/application-shell';
import { BoardSelection } from './board-selection';
import { Progress } from '@theia/core';

const Arduino_BuiltIn = 'Arduino_BuiltIn';

// 下载文件的URL
const lanzouUrl = 'https://zxjian.lanzouv.com/iAViV2ggqife';
const lanzouUrl2 = 'https://zxjian.lanzouv.com/ig9zK2gk43vc';
const lanzouUrl3 = 'https://zxjian.lanzouv.com/iexqm2ggqlqd';
// 指定下载后文件的保存路径
const savePath = 'AppData\\Local\\Lingzhi\\staging\\packages\\lingzhiboard.7z';
const savePath2 =
  'AppData\\Local\\Lingzhi\\staging\\packages\\lingzhiboard2.7z';
const savePath3 =
  'AppData\\Local\\Lingzhi\\staging\\packages\\lingzhiboard3.7z';
// 指定解压缩后的文件存放目录
const extractPath = 'AppData\\Local\\Lingzhi\\packages';

const lingzhiPackagePath = 'AppData\\Local\\Lingzhi\\packages\\lingzhi';

@injectable()
export class FirstStartupInstaller extends Contribution {
  @inject(LocalStorageService)
  private readonly localStorageService: LocalStorageService;
  @inject(BoardsService)
  private readonly boardsService: BoardsService;
  @inject(LibraryService)
  private readonly libraryService: LibraryService;

  @inject(ResponseService)
  private readonly responseService: ResponseService;
  @inject(ApplicationShell)
  protected readonly applicationShell: ApplicationShell;
  @inject(BoardSelection)
  protected readonly boardSelection: BoardSelection;

  private progress: Progress;
  localizationProvider: any;
  async installLingzhiPackage() {
    //=====新增
    const progress = await this.messageService.showProgress({
      text: `正在下载安装零知库（预计3分钟左右），请耐心等待`,
    });
    progress.report({
      // message: "正在下载零知库。。。",
      work: { done: 5, total: 100 },
    });
    let progressList: number[] = [100, 80, 50];
    const packageInstallPromises = [
      this.boardsService
        .installLingzhiPackage(lanzouUrl, savePath, extractPath, 1)
        .then(() => {
          const poppedValue = progressList.pop();
          if (typeof poppedValue === 'number') {
            progress.report({
              // message: "正在下载零知库。。。",
              work: { done: poppedValue, total: 100 },
            });
          }
        }),
      this.boardsService
        .installLingzhiPackage(lanzouUrl2, savePath2, extractPath, 2)
        .then(() => {
          const poppedValue = progressList.pop();
          if (typeof poppedValue === 'number') {
            progress.report({
              // message: "正在下载零知库。。。",
              work: { done: poppedValue, total: 100 },
            });
          }
        }),
      this.boardsService
        .installLingzhiPackage(lanzouUrl3, savePath3, extractPath, 3)
        .then(() => {
          const poppedValue = progressList.pop();
          if (typeof poppedValue === 'number') {
            progress.report({
              // message: "正在下载零知库。。。",
              work: { done: poppedValue, total: 100 },
            });
          }
        }),
    ];
    try {
      await Promise.all(packageInstallPromises);
      console.log('所有软件包安装成功');
    } catch (error) {
      console.error('软件包安装出现问题:', error);
    }
    this.applicationShell.refreshContainer();
    this.progress = progress;
  }

  override async onReady(): Promise<void> {
    const isFirstStartup = !(await this.localStorageService.getData(
      FirstStartupInstaller.INIT_LIBS_AND_PACKAGES
    ));
    if (isFirstStartup) {
      await this.installLingzhiPackage();

      // const avrPackage = await this.boardsService.getBoardPackage({
      //   id: 'arduino:avr',
      // });
      const builtInLibrary = (
        await this.libraryService.search({ query: Arduino_BuiltIn })
      ).find(({ name }) => name === Arduino_BuiltIn); // Filter by `name` to ensure "exact match". See: https://github.com/arduino/arduino-ide/issues/1526.

      let avrPackageError: Error | undefined;
      let builtInLibraryError: Error | undefined;

      // if (avrPackage) {
      //   try {
      //     await this.boardsService.install({
      //       item: avrPackage,
      //       noOverwrite: true, // We don't want to automatically replace custom platforms the user might already have in place
      //     });
      //   } catch (e) {
      //     // There's no error code, I need to parse the error message: https://github.com/arduino/arduino-cli/commit/ffe4232b359fcfa87238d68acf1c3b64a1621f14#diff-10ffbdde46838dd9caa881fd1f2a5326a49f8061f6cfd7c9d430b4875a6b6895R62
      //     if (
      //       e.message.includes(
      //         `Platform ${avrPackage.id}@${avrPackage.installedVersion} already installed`
      //       )
      //     ) {
      //       // If arduino:avr installation fails because it's already installed we don't want to retry on next start-up
      //       console.error(e);
      //     } else {
      //       // But if there is any other error (e.g.: no Internet connection), we want to retry next time
      //       avrPackageError = e;
      //     }
      //   }
      // } else {
      //   avrPackageError = new Error('Could not find platform.');
      // }

      if (builtInLibrary) {
        try {
          await this.libraryService.install({
            item: builtInLibrary,
            installDependencies: true,
            noOverwrite: true, // We don't want to automatically replace custom libraries the user might already have in place
            installLocation: LibraryLocation.BUILTIN,
          });
        } catch (e) {
          // There's no error code, I need to parse the error message: https://github.com/arduino/arduino-cli/commit/2ea3608453b17b1157f8a1dc892af2e13e40f4f0#diff-1de7569144d4e260f8dde0e0d00a4e2a218c57966d583da1687a70d518986649R95
          if (/Library (.*) is already installed/.test(e.message)) {
            // If Arduino_BuiltIn installation fails because it's already installed we don't want to retry on next start-up
            console.log('error installing core', e);
          } else {
            // But if there is any other error (e.g.: no Internet connection), we want to retry next time
            builtInLibraryError = e;
          }
        }
      } else {
        builtInLibraryError = new Error('Could not find library');
      }

      if (avrPackageError) {
        // this.messageService.error(
        //   `无法安装Arduino AVR平台: ${avrPackageError}`
        // );
        const chunk = `无法安装Arduino AVR平台: ${avrPackageError}\n`;
        this.responseService.appendToOutput({ chunk });
      }
      if (builtInLibraryError) {
        // this.messageService.error(
        //   `无法安装 ${Arduino_BuiltIn} 库: ${builtInLibraryError}`
        // );
        // const chunk = `无法安装 ${Arduino_BuiltIn} 库: ${builtInLibraryError}\n`;
        // this.responseService.appendToOutput({ chunk });
      }

      if (!avrPackageError && !builtInLibraryError) {
        await this.localStorageService.setData(
          FirstStartupInstaller.INIT_LIBS_AND_PACKAGES,
          true
        );
      }
      this.progress.cancel();
    }

    let hasLingZhiPackage = await this.boardsService.hasLingZhiPackage(
      lingzhiPackagePath
    );
    if (!hasLingZhiPackage) {
      await this.installLingzhiPackage();
    }
  }
}
export namespace FirstStartupInstaller {
  export const INIT_LIBS_AND_PACKAGES = 'initializedLibsAndPackages';
}
