import { injectable, inject } from 'inversify';
import { MessageService } from '@theia/core/lib/common/message-service';
import { FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application';
import {
  BoardsService,
  BoardsPackage,
  Board,
} from '../../common/protocol/boards-service';
import { BoardsServiceProvider } from './boards-service-provider';
import { BoardsListWidgetFrontendContribution } from './boards-widget-frontend-contribution';
import { BoardsConfig } from './boards-config';
import { Installable } from '../../common/protocol';
import { ResponseServiceImpl } from '../response-service-impl';

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

  @inject(ResponseServiceImpl)
  protected readonly responseService: ResponseServiceImpl;

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
    const { selectedBoard } = config;
    if (
      selectedBoard &&
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
          // tslint:disable-next-line:max-line-length
          this.messageService
            .info(
              `The \`"${candidate.name} ${version}"\` core has to be installed for the currently selected \`"${selectedBoard.name}"\` board. Do you want to install it now?`,
              'Install Manually',
              'Yes'
            )
            .then(async (answer) => {
              const index = this.notifications.findIndex((board) =>
                Board.sameAs(board, selectedBoard)
              );
              if (index !== -1) {
                this.notifications.splice(index, 1);
              }
              if (answer === 'Yes') {
                await Installable.installWithProgress({
                  installable: this.boardsService,
                  item: candidate,
                  messageService: this.messageService,
                  responseService: this.responseService,
                  version: candidate.availableVersions[0],
                });
                return;
              }
              if (answer) {
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
