import { LocalStorageService } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import { BoardsService, LibraryService } from '../../common/protocol';
import { Contribution } from './contribution';

@injectable()
export class InitLibsPlatforms extends Contribution {
  @inject(LocalStorageService)
  private readonly localStorageService: LocalStorageService;
  @inject(BoardsService)
  private readonly boardsService: BoardsService;
  @inject(LibraryService)
  private readonly libraryService: LibraryService;

  override async onReady(): Promise<void> {
    const isFirstStartup = !(await this.localStorageService.getData(
      InitLibsPlatforms.INIT_LIBS_AND_PACKAGES
    ));
    if (isFirstStartup) {
      await this.localStorageService.setData(
        InitLibsPlatforms.INIT_LIBS_AND_PACKAGES,
        true
      );
      const avrPackage = await this.boardsService.getBoardPackage({
        id: 'arduino:avr',
      });
      const builtInLibrary = (
        await this.libraryService.search({
          query: 'Arduino_BuiltIn',
        })
      )[0];

      if (avrPackage) {
        try {
          await this.boardsService.install({
            item: avrPackage,
            noOverwrite: true, // We don't want to automatically replace custom platforms the user might already have in place
          });
        } catch {} // If this fails, we still want to install the libraries
      }
      if (builtInLibrary) {
        try {
          await this.libraryService.install({
            item: builtInLibrary,
            installDependencies: true,
            noOverwrite: true, // We don't want to automatically replace custom libraries the user might already have in place
          });
        } catch {}
      }
    }
  }
}
export namespace InitLibsPlatforms {
  export const INIT_LIBS_AND_PACKAGES = 'initializedLibsAndPackages';
}
