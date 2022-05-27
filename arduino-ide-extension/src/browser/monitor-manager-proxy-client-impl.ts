import { CommandRegistry, Emitter, MessageService } from '@theia/core';
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
import { MonitorViewContribution } from './serial/monitor/monitor-view-contribution';

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

  // WebSocket used to handle pluggable monitor communication between
  // frontend and backend.
  private webSocket?: WebSocket;
  private wsPort?: number;
  private lastConnectedBoard: BoardsConfig.Config;

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
    protected readonly commandRegistry: CommandRegistry
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

  async startMonitor(
    board: Board,
    port: Port,
    settings?: PluggableMonitorSettings
  ): Promise<void> {
    await this.server().startMonitor(board, port, settings);
    if (
      board.fqbn !== this.lastConnectedBoard?.selectedBoard?.fqbn ||
      port.id !== this.lastConnectedBoard?.selectedPort?.id
    )
      await this.commandRegistry.executeCommand(
        MonitorViewContribution.RESET_SERIAL_MONITOR
      );
    this.lastConnectedBoard = {
      selectedBoard: board,
      selectedPort: port,
    };
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
