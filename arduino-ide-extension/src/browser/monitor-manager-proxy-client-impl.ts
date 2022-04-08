import { Emitter, MessageService } from '@theia/core';
import { inject, injectable } from '@theia/core/shared/inversify';
import { Board, Port } from '../common/protocol';
import {
  Monitor,
  MonitorManagerProxyClient,
  MonitorManagerProxyFactory,
  MonitorSettings,
} from '../common/protocol/monitor-service';

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

  protected readonly onWSConnectionChangedEmitter = new Emitter<boolean>();
  readonly onWSConnectionChanged = this.onWSConnectionChangedEmitter.event;

  // WebSocket used to handle pluggable monitor communication between
  // frontend and backend.
  private webSocket?: WebSocket;
  private wsPort?: number;

  getWebSocketPort(): number | undefined {
    return this.wsPort;
  }

  constructor(
    @inject(MessageService)
    protected messageService: MessageService,

    // This is necessary to call the backend methods from the frontend
    @inject(MonitorManagerProxyFactory)
    protected server: MonitorManagerProxyFactory
  ) {}

  /**
   * Connects a localhost WebSocket using the specified port.
   * @param addressPort port of the WebSocket
   */
  connect(addressPort: number): void {
    if (this.webSocket) {
      return;
    }
    try {
      this.webSocket = new WebSocket(`ws://localhost:${addressPort}`);
      this.onWSConnectionChangedEmitter.fire(true);
    } catch {
      this.messageService.error('Unable to connect to websocket');
      return;
    }

    this.webSocket.onmessage = (res) => {
      const messages = JSON.parse(res.data);
      this.onMessagesReceivedEmitter.fire({ messages });
    };
    this.wsPort = addressPort;
  }

  /**
   * Disconnects the WebSocket if connected.
   */
  disconnect(): void {
    try {
      this.webSocket?.close();
      this.webSocket = undefined;
      this.onWSConnectionChangedEmitter.fire(false);
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
    settings?: MonitorSettings
  ): Promise<void> {
    return this.server().startMonitor(board, port, settings);
  }

  getCurrentSettings(board: Board, port: Port): MonitorSettings {
    return this.server().getCurrentSettings(board, port);
  }

  send(message: string): void {
    if (!this.webSocket) {
      return;
    }

    this.webSocket.send(
      JSON.stringify({
        command: Monitor.Command.SEND_MESSAGE,
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
        command: Monitor.Command.CHANGE_SETTINGS,
        // TODO: This might be wrong, verify if it works
        data: settings,
      })
    );
  }
}
