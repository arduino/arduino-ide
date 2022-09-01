import { ApplicationError } from '@theia/core/lib/common/application-error';
import { Disposable } from '@theia/core/lib/common/disposable';
import { Emitter } from '@theia/core/lib/common/event';
import { MessageService } from '@theia/core/lib/common/message-service';
import { MessageType } from '@theia/core/lib/common/message-service-protocol';
import { nls } from '@theia/core/lib/common/nls';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { inject, injectable } from '@theia/core/shared/inversify';
import { NotificationManager } from '@theia/messages/lib/browser/notifications-manager';
import { BoardIdentifier, PortIdentifier } from '../common/protocol';
import {
  BoardListItem,
  boardListItemEquals,
  getInferredBoardOrBoard,
} from '../common/protocol/board-list';
import {
  Monitor,
  MonitorManagerProxyClient,
  MonitorManagerProxyFactory,
  MonitorSettings,
  PluggableMonitorSettings,
} from '../common/protocol/monitor-service';
import { BoardsServiceProvider } from './boards/boards-service-provider';

@injectable()
export class MonitorManagerProxyClientImpl
  implements MonitorManagerProxyClient
{
  @inject(MessageService)
  private readonly messageService: MessageService;
  // This is necessary to call the backend methods from the frontend
  @inject(MonitorManagerProxyFactory)
  private readonly server: MonitorManagerProxyFactory;
  @inject(BoardsServiceProvider)
  private readonly boardsServiceProvider: BoardsServiceProvider;
  @inject(NotificationManager)
  private readonly notificationManager: NotificationManager;

  // When pluggable monitor messages are received from the backend
  // this event is triggered.
  // Ideally a frontend component is connected to this event
  // to update the UI.
  private readonly onMessagesReceivedEmitter = new Emitter<{
    messages: string[];
  }>();
  readonly onMessagesReceived = this.onMessagesReceivedEmitter.event;

  private readonly onMonitorSettingsDidChangeEmitter =
    new Emitter<MonitorSettings>();
  readonly onMonitorSettingsDidChange =
    this.onMonitorSettingsDidChangeEmitter.event;

  private readonly onMonitorShouldResetEmitter = new Emitter<void>();
  readonly onMonitorShouldReset = this.onMonitorShouldResetEmitter.event;

  // WebSocket used to handle pluggable monitor communication between
  // frontend and backend.
  private webSocket?: WebSocket;
  private wsPort?: number;
  private lastConnectedBoard: BoardListItem | undefined;
  private onBoardListDidChange: Disposable | undefined;

  getWebSocketPort(): number | undefined {
    return this.wsPort;
  }

  /**
   * Connects a localhost WebSocket using the specified port.
   * @param addressPort port of the WebSocket
   */
  async connect(addressPort: number): Promise<void> {
    if (this.webSocket) {
      if (this.wsPort === addressPort) {
        return;
      }
      this.disconnect();
    }
    try {
      this.webSocket = new WebSocket(`ws://localhost:${addressPort}`);
    } catch {
      this.messageService.error(
        nls.localize(
          'arduino/monitor/unableToConnectToWebSocket',
          'Unable to connect to websocket'
        )
      );
      return;
    }

    const opened = new Deferred<void>();
    this.webSocket.onopen = () => opened.resolve();
    this.webSocket.onerror = () => opened.reject();
    this.webSocket.onmessage = (message) => {
      const parsedMessage = JSON.parse(message.data);
      if (Array.isArray(parsedMessage))
        this.onMessagesReceivedEmitter.fire({ messages: parsedMessage });
      else if (
        parsedMessage.command ===
        Monitor.MiddlewareCommand.ON_SETTINGS_DID_CHANGE
      ) {
        this.onMonitorSettingsDidChangeEmitter.fire(parsedMessage.data);
      }
    };
    this.wsPort = addressPort;
    return opened.promise;
  }

  /**
   * Disconnects the WebSocket if connected.
   */
  disconnect(): void {
    if (!this.webSocket) {
      return;
    }
    this.onBoardListDidChange?.dispose();
    this.onBoardListDidChange = undefined;
    try {
      this.webSocket.close();
      this.webSocket = undefined;
    } catch (err) {
      console.error(
        'Could not close the websocket connection for the monitor.',
        err
      );
      this.messageService.error(
        nls.localize(
          'arduino/monitor/unableToCloseWebSocket',
          'Unable to close websocket'
        )
      );
    }
  }

  async isWSConnected(): Promise<boolean> {
    return !!this.webSocket;
  }

  async startMonitor(settings?: PluggableMonitorSettings): Promise<void> {
    const { boardList } = this.boardsServiceProvider;
    this.lastConnectedBoard = boardList[boardList.selectedIndex];
    if (!this.onBoardListDidChange) {
      this.onBoardListDidChange =
        this.boardsServiceProvider.onBoardListDidChange(
          async (newBoardList) => {
            const currentConnectedBoard =
              newBoardList[newBoardList.selectedIndex];
            if (!currentConnectedBoard) {
              return;
            }

            if (
              !this.lastConnectedBoard ||
              boardListItemEquals(
                currentConnectedBoard,
                this.lastConnectedBoard
              )
            ) {
              // a board is plugged and it's the same as prev, rerun "this.startMonitor" to
              // recreate the listener callback
              this.startMonitor();
            } else {
              // a board is plugged and it's different from the old connected board
              this.lastConnectedBoard = currentConnectedBoard;
              this.onMonitorShouldResetEmitter.fire();
            }
          }
        );
    }

    if (!this.lastConnectedBoard) {
      return;
    }

    const board = getInferredBoardOrBoard(this.lastConnectedBoard);
    if (!board) {
      return;
    }
    try {
      this.clearVisibleNotification();
      await this.server().startMonitor(
        board,
        this.lastConnectedBoard.port,
        settings
      );
    } catch (err) {
      const message = ApplicationError.is(err) ? err.message : String(err);
      this.previousNotificationId = this.notificationId(message);
      this.messageService.error(message);
    }
  }

  getCurrentSettings(
    board: BoardIdentifier,
    port: PortIdentifier
  ): Promise<MonitorSettings> {
    return this.server().getCurrentSettings(board, port);
  }

  send(message: string): void {
    if (!this.webSocket) {
      return;
    }

    this.webSocket.send(
      JSON.stringify({
        command: Monitor.ClientCommand.SEND_MESSAGE,
        data: message,
      })
    );
  }

  changeSettings(settings: MonitorSettings): void {
    if (!this.webSocket) {
      return;
    }

    this.webSocket.send(
      JSON.stringify({
        command: Monitor.ClientCommand.CHANGE_SETTINGS,
        data: settings,
      })
    );
  }

  /**
   * This is the internal (Theia) ID of the notification that is currently visible.
   * It's stored here as a field to be able to close it before starting a new monitor connection. It's a hack.
   */
  private previousNotificationId: string | undefined;
  private clearVisibleNotification(): void {
    if (this.previousNotificationId) {
      this.notificationManager.clear(this.previousNotificationId);
      this.previousNotificationId = undefined;
    }
  }

  private notificationId(message: string, ...actions: string[]): string {
    return this.notificationManager['getMessageId']({
      text: message,
      actions,
      type: MessageType.Error,
    });
  }
}
