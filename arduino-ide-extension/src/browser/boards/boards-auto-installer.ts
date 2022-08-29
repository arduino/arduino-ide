import { injectable, inject } from '@theia/core/shared/inversify';
import { MessageService } from '@theia/core/lib/common/message-service';
import { FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application';
import {
  BoardsService,
  BoardsPackage,
  Board,
  Port,
} from '../../common/protocol/boards-service';
import { BoardsServiceProvider } from './boards-service-provider';
import { Installable, ResponseServiceClient } from '../../common/protocol';
import { BoardsListWidgetFrontendContribution } from './boards-widget-frontend-contribution';
import { nls } from '@theia/core/lib/common';
import { NotificationCenter } from '../notification-center';
import { InstallManually } from '../../common/nls';

interface AutoInstallPromptAction {
  // isAcceptance, whether or not the action indicates acceptance of auto-install proposal
  isAcceptance?: boolean;
  key: string;
  handler: (...args: unknown[]) => unknown;
}

type AutoInstallPromptActions = AutoInstallPromptAction[];

/**
 * Listens on `BoardsConfig.Config` changes, if a board is selected which does not
 * have the corresponding core installed, it proposes the user to install the core.
 */

// * Cases in which we do not show the auto-install prompt:
// 1. When a related platform is already installed
// 2. When a prompt is already showing in the UI
// 3. When a board is unplugged
@injectable()
export class BoardsAutoInstaller implements FrontendApplicationContribution {
  @inject(NotificationCenter)
  private readonly notificationCenter: NotificationCenter;

  @inject(MessageService)
  protected readonly messageService: MessageService;

  @inject(BoardsService)
  protected readonly boardsService: BoardsService;

  @inject(BoardsServiceProvider)
  protected readonly boardsServiceClient: BoardsServiceProvider;

  @inject(ResponseServiceClient)
  protected readonly responseService: ResponseServiceClient;

  @inject(BoardsListWidgetFrontendContribution)
  protected readonly boardsManagerFrontendContribution: BoardsListWidgetFrontendContribution;

  // Workaround for https://github.com/eclipse-theia/theia/issues/9349
  protected notifications: Board[] = [];

  // * "refusal" meaning a "prompt action" not accepting the auto-install offer ("X" or "install manually")
  // we can use "portSelectedOnLastRefusal" to deduce when a board is unplugged after a user has "refused"
  // an auto-install prompt. Important to know as we do not want "an unplug" to trigger a "refused" prompt
  // showing again
  private portSelectedOnLastRefusal: Port | undefined;
  private lastRefusedPackageId: string | undefined;

  onStart(): void {
    const setEventListeners = () => {
      this.boardsServiceClient.onBoardsConfigChanged((config) => {
        const { selectedBoard, selectedPort } = config;

        const boardWasUnplugged =
          !selectedPort && this.portSelectedOnLastRefusal;

        this.clearLastRefusedPromptInfo();

        if (
          boardWasUnplugged ||
          !selectedBoard ||
          this.promptAlreadyShowingForBoard(selectedBoard)
        ) {
          return;
        }

        this.ensureCoreExists(selectedBoard, selectedPort);
      });

      // we "clearRefusedPackageInfo" if a "refused" package is eventually
      // installed, though this is not strictly necessary. It's more of a
      // cleanup, to ensure the related variables are representative of
      // current state.
      this.notificationCenter.onPlatformDidInstall((installed) => {
        if (this.lastRefusedPackageId === installed.item.id) {
          this.clearLastRefusedPromptInfo();
        }
      });
    };

    // we should invoke this.ensureCoreExists only once we're sure
    // everything has been reconciled
    this.boardsServiceClient.reconciled.then(() => {
      const { selectedBoard, selectedPort } =
        this.boardsServiceClient.boardsConfig;

      if (selectedBoard) {
        this.ensureCoreExists(selectedBoard, selectedPort);
      }

      setEventListeners();
    });
  }

  private removeNotificationByBoard(selectedBoard: Board): void {
    const index = this.notifications.findIndex((notification) =>
      Board.sameAs(notification, selectedBoard)
    );
    if (index !== -1) {
      this.notifications.splice(index, 1);
    }
  }

  private clearLastRefusedPromptInfo(): void {
    this.lastRefusedPackageId = undefined;
    this.portSelectedOnLastRefusal = undefined;
  }

  private setLastRefusedPromptInfo(
    packageId: string,
    selectedPort?: Port
  ): void {
    this.lastRefusedPackageId = packageId;
    this.portSelectedOnLastRefusal = selectedPort;
  }

  private promptAlreadyShowingForBoard(board: Board): boolean {
    return Boolean(
      this.notifications.find((notification) =>
        Board.sameAs(notification, board)
      )
    );
  }

  protected ensureCoreExists(selectedBoard: Board, selectedPort?: Port): void {
    this.notifications.push(selectedBoard);
    this.boardsService.search({}).then((packages) => {
      const candidate = this.getInstallCandidate(packages, selectedBoard);

      if (candidate) {
        this.showAutoInstallPrompt(candidate, selectedBoard, selectedPort);
      } else {
        this.removeNotificationByBoard(selectedBoard);
      }
    });
  }

  private getInstallCandidate(
    packages: BoardsPackage[],
    selectedBoard: Board
  ): BoardsPackage | undefined {
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
    if (packagesForBoard.some(({ installedVersion }) => !!installedVersion)) {
      return;
    }

    // filter the installable (not installed) packages,
    // CLI returns the packages already sorted with the deprecated ones at the end of the list
    // in order to ensure the new ones are preferred
    const candidates = packagesForBoard.filter(
      ({ installable, installedVersion }) => installable && !installedVersion
    );

    return candidates[0];
  }

  private showAutoInstallPrompt(
    candidate: BoardsPackage,
    selectedBoard: Board,
    selectedPort?: Port
  ): void {
    const candidateName = candidate.name;
    const version = candidate.availableVersions[0]
      ? `[v ${candidate.availableVersions[0]}]`
      : '';

    const info = this.generatePromptInfoText(
      candidateName,
      version,
      selectedBoard.name
    );

    const actions = this.createPromptActions(candidate);

    const onRefuse = () => {
      this.setLastRefusedPromptInfo(candidate.id, selectedPort);
    };
    const handleAction = this.createOnAnswerHandler(actions, onRefuse);

    const onAnswer = (answer: string) => {
      this.removeNotificationByBoard(selectedBoard);

      handleAction(answer);
    };

    this.messageService
      .info(info, ...actions.map((action) => action.key))
      .then(onAnswer);
  }

  private generatePromptInfoText(
    candidateName: string,
    version: string,
    boardName: string
  ): string {
    return nls.localize(
      'arduino/board/installNow',
      'The "{0} {1}" core has to be installed for the currently selected "{2}" board. Do you want to install it now?',
      candidateName,
      version,
      boardName
    );
  }

  private createPromptActions(
    candidate: BoardsPackage
  ): AutoInstallPromptActions {
    const yes = nls.localize('vscode/extensionsUtils/yes', 'Yes');

    const actions: AutoInstallPromptActions = [
      {
        key: InstallManually,
        handler: () => {
          this.boardsManagerFrontendContribution
            .openView({ reveal: true })
            .then((widget) =>
              widget.refresh({
                query: candidate.name.toLocaleLowerCase(),
                type: 'All',
              })
            );
        },
      },
      {
        isAcceptance: true,
        key: yes,
        handler: () => {
          return Installable.installWithProgress({
            installable: this.boardsService,
            item: candidate,
            messageService: this.messageService,
            responseService: this.responseService,
            version: candidate.availableVersions[0],
          });
        },
      },
    ];

    return actions;
  }

  private createOnAnswerHandler(
    actions: AutoInstallPromptActions,
    onRefuse?: () => void
  ): (answer: string) => void {
    return (answer) => {
      const actionToHandle = actions.find((action) => action.key === answer);
      actionToHandle?.handler();

      if (!actionToHandle?.isAcceptance && onRefuse) {
        onRefuse();
      }
    };
  }
}
