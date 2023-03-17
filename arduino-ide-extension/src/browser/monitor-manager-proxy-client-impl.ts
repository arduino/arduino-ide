import {
  ApplicationError,
  Disposable,
  Emitter,
  MessageService,
  nls,
} from '@theia/core';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { inject, injectable } from '@theia/core/shared/inversify';
import { NotificationManager } from '@theia/messages/lib/browser/notifications-manager';
import { MessageType } from '@theia/core/lib/common/message-service-protocol';
import { Board, Port } from '../common/protocol';
import {
  Monitor,
  MonitorManagerProxyClient,
  MonitorManagerProxyFactory,
} from '../common/protocol/monitor-service';
import {
  PluggableMonitorSettings,
  MonitorSettings,
} from '../node/monitor-settings/monitor-settings-provider';
import { BoardsConfig } from './boards/boards-config';
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
  private lastConnectedBoard: BoardsConfig.Config;
  private onBoardsConfigChanged: Disposable | undefined;

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
    this.onBoardsConfigChanged?.dispose();
    this.onBoardsConfigChanged = undefined;
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
    await this.boardsServiceProvider.reconciled;
    this.lastConnectedBoard = {
      selectedBoard: this.boardsServiceProvider.boardsConfig.selectedBoard,
      selectedPort: this.boardsServiceProvider.boardsConfig.selectedPort,
    };

    if (!this.onBoardsConfigChanged) {
      this.onBoardsConfigChanged =
        this.boardsServiceProvider.onBoardsConfigChanged(
          async ({ selectedBoard, selectedPort }) => {
            if (
              typeof selectedBoard === 'undefined' ||
              typeof selectedPort === 'undefined'
            )
              return;

            // a board is plugged and it's different from the old connected board
            if (
              selectedBoard?.fqbn !==
                this.lastConnectedBoard?.selectedBoard?.fqbn ||
              Port.keyOf(selectedPort) !==
                (this.lastConnectedBoard.selectedPort
                  ? Port.keyOf(this.lastConnectedBoard.selectedPort)
                  : undefined)
            ) {
              this.lastConnectedBoard = {
                selectedBoard: selectedBoard,
                selectedPort: selectedPort,
              };
              this.onMonitorShouldResetEmitter.fire();
            } else {
              // a board is plugged and it's the same as prev, rerun "this.startMonitor" to
              // recreate the listener callback
              this.startMonitor();
            }
          }
        );
    }

    const { selectedBoard, selectedPort } =
      this.boardsServiceProvider.boardsConfig;
    if (!selectedBoard || !selectedBoard.fqbn || !selectedPort) return;
    try {
      this.clearVisibleNotification();
      await this.server().startMonitor(selectedBoard, selectedPort, settings);
    } catch (err) {
      const message = ApplicationError.is(err) ? err.message : String(err);
      this.previousNotificationId = this.notificationId(message);
      this.messageService.error(message);
    }
  }

  getCurrentSettings(board: Board, port: Port): Promise<MonitorSettings> {
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
