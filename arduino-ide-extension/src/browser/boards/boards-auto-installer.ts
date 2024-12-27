import { FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { MessageService } from '@theia/core/lib/common/message-service';
import { MessageType } from '@theia/core/lib/common/message-service-protocol';
import { nls } from '@theia/core/lib/common/nls';
import { notEmpty } from '@theia/core/lib/common/objects';
import { inject, injectable } from '@theia/core/shared/inversify';
import { NotificationManager } from '@theia/messages/lib/browser/notifications-manager';
import { InstallManually } from '../../common/nls';
import { Installable, ResponseServiceClient } from '../../common/protocol';
import {
  BoardIdentifier,
  BoardsPackage,
  BoardsService,
  createPlatformIdentifier,
  isBoardIdentifierChangeEvent,
  PlatformIdentifier,
  platformIdentifierEquals,
  serializePlatformIdentifier,
} from '../../common/protocol/boards-service';
import { NotificationCenter } from '../notification-center';
import { BoardsServiceProvider } from './boards-service-provider';
import { BoardsListWidgetFrontendContribution } from './boards-widget-frontend-contribution';

/**
 * Listens on `BoardsConfigChangeEvent`s, if a board is selected which does not
 * have the corresponding core installed, it proposes the user to install the core.
 */
@injectable()
export class BoardsAutoInstaller implements FrontendApplicationContribution {
  @inject(NotificationCenter)
  private readonly notificationCenter: NotificationCenter;
  @inject(MessageService)
  private readonly messageService: MessageService;
  @inject(NotificationManager)
  private readonly notificationManager: NotificationManager;
  @inject(BoardsService)
  private readonly boardsService: BoardsService;
  @inject(BoardsServiceProvider)
  private readonly boardsServiceProvider: BoardsServiceProvider;
  @inject(ResponseServiceClient)
  private readonly responseService: ResponseServiceClient;
  @inject(BoardsListWidgetFrontendContribution)
  private readonly boardsManagerWidgetContribution: BoardsListWidgetFrontendContribution;

  // Workaround for https://github.com/eclipse-theia/theia/issues/9349
  private readonly installNotificationInfos: Readonly<{
    boardName: string;
    platformId: string;
    notificationId: string;
  }>[] = [];
  private readonly toDispose = new DisposableCollection();

  onStart(): void {
    this.toDispose.pushAll([
      this.boardsServiceProvider.onBoardsConfigDidChange((event) => {
        if (isBoardIdentifierChangeEvent(event)) {
          this.ensureCoreExists(event.selectedBoard);
        }
      }),
      this.notificationCenter.onPlatformDidInstall((event) =>
        this.clearAllNotificationForPlatform(event.item.id)
      ),
    ]);
    this.boardsServiceProvider.ready.then(() => {
      const { selectedBoard } = this.boardsServiceProvider.boardsConfig;
      this.ensureCoreExists(selectedBoard);
    });
  }

  private async findPlatformToInstall(
    selectedBoard: BoardIdentifier
  ): Promise<BoardsPackage | undefined> {
    const platformId = await this.findPlatformIdToInstall(selectedBoard);
    if (!platformId) {
      return undefined;
    }
    const id = serializePlatformIdentifier(platformId);
    const platform = await this.boardsService.getBoardPackage({ id });
    if (!platform) {
      console.warn(`Could not resolve platform for ID: ${id}`);
      return undefined;
    }
    if (platform.installedVersion) {
      return undefined;
    }
    return platform;
  }

  private async findPlatformIdToInstall(
    selectedBoard: BoardIdentifier
  ): Promise<PlatformIdentifier | undefined> {
    const selectedBoardPlatformId = createPlatformIdentifier(selectedBoard);
    // The board is installed or the FQBN is available from the `board list watch` for Arduino boards. The latter might change!
    if (selectedBoardPlatformId) {
      const installedPlatforms =
        await this.boardsService.getInstalledPlatforms();
      const installedPlatformIds = installedPlatforms
        .map((platform) => createPlatformIdentifier(platform.id))
        .filter(notEmpty);
      if (
        installedPlatformIds.every(
          (installedPlatformId) =>
            !platformIdentifierEquals(
              installedPlatformId,
              selectedBoardPlatformId
            )
        )
      ) {
        return selectedBoardPlatformId;
      }
    } else {
      // IDE2 knows that selected board is not installed. Look for board `name` match in not yet installed platforms.
      // The order should be correct when there is a board name collision (e.g. Arduino Nano RP2040 from Arduino Mbed OS Nano Boards, [DEPRECATED] Arduino Mbed OS Nano Boards). The CLI boosts the platforms, so picking the first name match should be fine.
      const platforms = await this.boardsService.search({});
      for (const platform of platforms) {
        // Ignore installed platforms
        if (platform.installedVersion) {
          continue;
        }
        if (
          platform.boards.some((board) => board.name === selectedBoard.name)
        ) {
          const platformId = createPlatformIdentifier(platform.id);
          if (platformId) {
            return platformId;
          }
        }
      }
    }
    return undefined;
  }

  private async ensureCoreExists(
    selectedBoard: BoardIdentifier | undefined
  ): Promise<void> {
    if (!selectedBoard) {
      return;
    }
    const candidate = await this.findPlatformToInstall(selectedBoard);
    if (!candidate) {
      return;
    }
    const platformIdToInstall = candidate.id;
    const selectedBoardName = selectedBoard.name;
    if (
      this.installNotificationInfos.some(
        ({ boardName, platformId }) =>
          platformIdToInstall === platformId && selectedBoardName === boardName
      )
    ) {
      // Already has a notification for the board with the same platform. Nothing to do.
      return;
    }
    this.clearAllNotificationForPlatform(platformIdToInstall);

    const version = candidate.availableVersions[0]
      ? `[v ${candidate.availableVersions[0]}]`
      : '';
    const yes = nls.localize('vscode/extensionsUtils/yes', 'Yes');
    const message = nls.localize(
      'arduino/board/installNow',
      '必须为当前选择的“{2}”板安装“{0}{1}”核心。您想现在安装吗？',
      candidate.name,
      version,
      selectedBoard.name
    );
    const notificationId = this.notificationId(message, InstallManually, yes);
    this.installNotificationInfos.push({
      boardName: selectedBoardName,
      platformId: platformIdToInstall,
      notificationId,
    });
    const answer = await this.messageService.info(
      message,
      InstallManually,
      yes
    );
    if (answer) {
      const index = this.installNotificationInfos.findIndex(
        ({ boardName, platformId }) =>
          platformIdToInstall === platformId && selectedBoardName === boardName
      );
      if (index !== -1) {
        this.installNotificationInfos.splice(index, 1);
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
      if (answer === InstallManually) {
        this.boardsManagerWidgetContribution
          .openView({ reveal: true })
          .then((widget) =>
            widget.refresh({
              query: candidate.name.toLocaleLowerCase(),
              type: 'All',
            })
          );
      }
    }
  }

  private clearAllNotificationForPlatform(predicatePlatformId: string): void {
    // Discard all install notifications for the same platform.
    const notificationsLength = this.installNotificationInfos.length;
    for (let i = notificationsLength - 1; i >= 0; i--) {
      const { notificationId, platformId } = this.installNotificationInfos[i];
      if (platformId === predicatePlatformId) {
        this.installNotificationInfos.splice(i, 1);
        this.notificationManager.clear(notificationId);
      }
    }
  }

  private notificationId(message: string, ...actions: string[]): string {
    return this.notificationManager['getMessageId']({
      text: message,
      actions,
      type: MessageType.Info,
    });
  }
}
