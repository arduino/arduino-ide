import { LocalStorageService } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import {
  BoardsService,
  LibraryLocation,
  LibraryService,
} from '../../common/protocol';
import { Contribution } from './contribution';

@injectable()
export class FirstStartupInstaller extends Contribution {
  @inject(LocalStorageService)
  private readonly localStorageService: LocalStorageService;
  @inject(BoardsService)
  private readonly boardsService: BoardsService;
  @inject(LibraryService)
  private readonly libraryService: LibraryService;

  override async onReady(): Promise<void> {
    const isFirstStartup = !(await this.localStorageService.getData(
      FirstStartupInstaller.INIT_LIBS_AND_PACKAGES
    ));
    if (isFirstStartup) {
      const avrPackage = await this.boardsService.getBoardPackage({
        id: 'arduino:avr',
      });
      const builtInLibrary = (
        await this.libraryService.search({ query: 'Arduino_BuiltIn' })
      )[0];

      let avrPackageError: Error | undefined;
      let builtInLibraryError: Error | undefined;

      if (avrPackage) {
        try {
          await this.boardsService.install({
            item: avrPackage,
            noOverwrite: true, // We don't want to automatically replace custom platforms the user might already have in place
          });
        } catch (e) {
          // There's no error code, I need to parse the error message: https://github.com/arduino/arduino-cli/commit/ffe4232b359fcfa87238d68acf1c3b64a1621f14#diff-10ffbdde46838dd9caa881fd1f2a5326a49f8061f6cfd7c9d430b4875a6b6895R62
          if (
            e.message.includes(
              `Platform ${avrPackage.id}@${avrPackage.installedVersion} already installed`
            )
          ) {
            // If arduino:avr installation fails because it's already installed we don't want to retry on next start-up
            console.error(e);
          } else {
            // But if there is any other error (e.g.: no Internet connection), we want to retry next time
            avrPackageError = e;
          }
        }
      } else {
        avrPackageError = new Error('Could not find platform.');
      }

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
        this.messageService.error(
          `Could not install Arduino AVR platform: ${avrPackageError}`
        );
      }
      if (builtInLibraryError) {
        this.messageService.error(
          `Could not install ${builtInLibrary.name} library: ${builtInLibraryError}`
        );
      }

      if (!avrPackageError && !builtInLibraryError) {
        await this.localStorageService.setData(
          FirstStartupInstaller.INIT_LIBS_AND_PACKAGES,
          true
        );
      }
    }
  }
}
export namespace FirstStartupInstaller {
  export const INIT_LIBS_AND_PACKAGES = 'initializedLibsAndPackages';
}
