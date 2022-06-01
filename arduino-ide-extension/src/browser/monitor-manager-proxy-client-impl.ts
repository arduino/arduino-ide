import {
  CommandRegistry,
  Disposable,
  Emitter,
  MessageService,
} from '@theia/core';
import { inject, injectable } from '@theia/core/shared/inversify';
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
  // When pluggable monitor messages are received from the backend
  // this event is triggered.
  // Ideally a frontend component is connected to this event
  // to update the UI.
  protected readonly onMessagesReceivedEmitter = new Emitter<{
    messages: string[];
  }>();
  readonly onMessagesReceived = this.onMessagesReceivedEmitter.event;

  protected readonly onMonitorSettingsDidChangeEmitter =
    new Emitter<MonitorSettings>();
  readonly onMonitorSettingsDidChange =
    this.onMonitorSettingsDidChangeEmitter.event;

  protected readonly onMonitorShouldResetEmitter = new Emitter();
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

  constructor(
    @inject(MessageService)
    protected messageService: MessageService,

    // This is necessary to call the backend methods from the frontend
    @inject(MonitorManagerProxyFactory)
    protected server: MonitorManagerProxyFactory,

    @inject(CommandRegistry)
    protected readonly commandRegistry: CommandRegistry,

    @inject(BoardsServiceProvider)
    protected readonly boardsServiceProvider: BoardsServiceProvider
  ) {}

  /**
   * Connects a localhost WebSocket using the specified port.
   * @param addressPort port of the WebSocket
   */
  async connect(addressPort: number): Promise<void> {
    if (!!this.webSocket) {
      if (this.wsPort === addressPort) return;
      else this.disconnect();
    }
    try {
      this.webSocket = new WebSocket(`ws://localhost:${addressPort}`);
    } catch {
      this.messageService.error('Unable to connect to websocket');
      return;
    }

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
  }

  /**
   * Disconnects the WebSocket if connected.
   */
  disconnect(): void {
    if (!this.webSocket) return;
    this.onBoardsConfigChanged?.dispose();
    this.onBoardsConfigChanged = undefined;
    try {
      this.webSocket?.close();
      this.webSocket = undefined;
    } catch {
      this.messageService.error('Unable to close websocket');
    }
  }

  async isWSConnected(): Promise<boolean> {
    return !!this.webSocket;
  }

  async startMonitor(settings?: PluggableMonitorSettings): Promise<void> {
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
              selectedPort?.id !== this.lastConnectedBoard?.selectedPort?.id
            ) {
              this.onMonitorShouldResetEmitter.fire(null);
              this.lastConnectedBoard = {
                selectedBoard: selectedBoard,
                selectedPort: selectedPort,
              };
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
    await this.server().startMonitor(selectedBoard, selectedPort, settings);
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
}
