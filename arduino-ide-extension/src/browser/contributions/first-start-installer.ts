import { LocalStorageService } from '@theia/core/lib/browser/storage-service';
import { inject, injectable } from '@theia/core/shared/inversify';
import { BoardsService, LibraryService } from '../../common/protocol';
import { Contribution } from './contribution';

const INIT_LIBS_AND_PACKAGES = 'initializedLibsAndPackages';

@injectable()
export class FirstStartInstaller extends Contribution {
  @inject(LocalStorageService)
  private readonly localStorageService: LocalStorageService;

  @inject(BoardsService)
  private readonly boardsService: BoardsService;

  @inject(LibraryService)
  private readonly libraryService: LibraryService;

  override onReady(): void {
    this.localStorageService
      .getData(INIT_LIBS_AND_PACKAGES)
      .then(async (value) => {
        const isFirstStartup = !value;
        if (isFirstStartup) {
          await this.localStorageService.setData(INIT_LIBS_AND_PACKAGES, true);
          const avrPackage = await this.boardsService.getBoardPackage({
            id: 'arduino:avr',
          });
          const builtInLibrary = (
            await this.libraryService.search({
              query: 'Arduino_BuiltIn',
            })
          )[0];

          !!avrPackage &&
            (await this.boardsService.install({ item: avrPackage }));
          !!builtInLibrary &&
            (await this.libraryService.install({
              item: builtInLibrary,
              installDependencies: true,
            }));
        }
      });
  }
}
