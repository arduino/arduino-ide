import { injectable, inject } from '@theia/core/shared/inversify';
import { MessageService } from '@theia/core/lib/common/message-service';
import { FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application';
import {
  BoardsService,
  BoardsPackage,
  Board,
} from '../../common/protocol/boards-service';
import { BoardsServiceProvider } from './boards-service-provider';
import { BoardsConfig } from './boards-config';
import { Installable, ResponseServiceArduino } from '../../common/protocol';
import { BoardsListWidgetFrontendContribution } from './boards-widget-frontend-contribution';
import { nls } from '@theia/core/lib/common';

/**
 * Listens on `BoardsConfig.Config` changes, if a board is selected which does not
 * have the corresponding core installed, it proposes the user to install the core.
 */
@injectable()
export class BoardsAutoInstaller implements FrontendApplicationContribution {
  @inject(MessageService)
  protected readonly messageService: MessageService;

  @inject(BoardsService)
  protected readonly boardsService: BoardsService;

  @inject(BoardsServiceProvider)
  protected readonly boardsServiceClient: BoardsServiceProvider;

  @inject(ResponseServiceArduino)
  protected readonly responseService: ResponseServiceArduino;

  @inject(BoardsListWidgetFrontendContribution)
  protected readonly boardsManagerFrontendContribution: BoardsListWidgetFrontendContribution;

  // Workaround for https://github.com/eclipse-theia/theia/issues/9349
  protected notifications: Board[] = [];

  onStart(): void {
    this.boardsServiceClient.onBoardsConfigChanged(
      this.ensureCoreExists.bind(this)
    );
    this.ensureCoreExists(this.boardsServiceClient.boardsConfig);
  }

  protected ensureCoreExists(config: BoardsConfig.Config): void {
    const { selectedBoard, selectedPort } = config;
    if (
      selectedBoard &&
      selectedPort &&
      !this.notifications.find((board) => Board.sameAs(board, selectedBoard))
    ) {
      this.notifications.push(selectedBoard);
      this.boardsService.search({}).then((packages) => {
        // filter packagesForBoard selecting matches from the cli (installed packages)
        // and matches based on the board name
        // NOTE: this ensures the Deprecated & new packages are all in the array
        // so that we can check if any of the valid packages is already installed
        const packagesForBoard = packages.filter(
          (pkg) =>
            BoardsPackage.contains(selectedBoard, pkg) ||
            pkg.boards.some((board) => board.name === selectedBoard.name)
        );

        // check if one of the packages for the board is already installed. if so, no hint
        if (
          packagesForBoard.some(({ installedVersion }) => !!installedVersion)
        ) {
          return;
        }

        // filter the installable (not installed) packages,
        // CLI returns the packages already sorted with the deprecated ones at the end of the list
        // in order to ensure the new ones are preferred
        const candidates = packagesForBoard.filter(
          ({ installable, installedVersion }) =>
            installable && !installedVersion
        );

        const candidate = candidates[0];
        if (candidate) {
          const version = candidate.availableVersions[0]
            ? `[v ${candidate.availableVersions[0]}]`
            : '';
          const yes = nls.localize('vscode/extensionsUtils/yes', 'Yes');
          const manualInstall = nls.localize(
            'arduino/board/installManually',
            'Install Manually'
          );
          // tslint:disable-next-line:max-line-length
          this.messageService
            .info(
              nls.localize(
                'arduino/board/installNow',
                'The "{0} {1}" core has to be installed for the currently selected "{2}" board. Do you want to install it now?',
                candidate.name,
                version,
                selectedBoard.name
              ),
              manualInstall,
              yes
            )
            .then(async (answer) => {
              const index = this.notifications.findIndex((board) =>
                Board.sameAs(board, selectedBoard)
              );
              if (index !== -1) {
                this.notifications.splice(index, 1);
              }
              if (answer === yes) {
                await Installable.installWithProgress({
                  installable: this.boardsService,
                  item: candidate,
                  messageService: this.messageService,
                  responseService: this.responseService,
                  version: candidate.availableVersions[0],
                });
                return;
              }
              if (answer === manualInstall) {
                this.boardsManagerFrontendContribution
                  .openView({ reveal: true })
                  .then((widget) =>
                    widget.refresh(candidate.name.toLocaleLowerCase())
                  );
              }
            });
        }
      });
    }
  }
}
