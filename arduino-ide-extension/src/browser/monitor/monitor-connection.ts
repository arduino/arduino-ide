import { injectable, inject } from 'inversify';
import { deepClone } from '@theia/core/lib/common/objects';
import { Emitter, Event } from '@theia/core/lib/common/event';
import { MessageService } from '@theia/core/lib/common/message-service';
import {
  MonitorService,
  MonitorConfig,
  MonitorError,
  Status,
  MonitorServiceClient,
} from '../../common/protocol/monitor-service';
import { BoardsServiceProvider } from '../boards/boards-service-provider';
import {
  Port,
  Board,
  BoardsService,
  AttachedBoardsChangeEvent,
} from '../../common/protocol/boards-service';
import { BoardsConfig } from '../boards/boards-config';
import { MonitorModel } from './monitor-model';
import { NotificationCenter } from '../notification-center';
import { ThemeService } from '@theia/core/lib/browser/theming';
import { nls } from '@theia/core/lib/browser/nls';

@injectable()
export class SerialConnectionManager {
  protected _state: Serial.State = [];
  protected _connected = false;
  protected config: Partial<MonitorConfig> = {
    board: undefined,
    port: undefined,
    baudRate: undefined,
  };

  /**
   * Note: The idea is to toggle this property from the UI (`Monitor` view)
   * and the boards config and the boards attachment/detachment logic can be at on place, here.
   */
  protected readonly onConnectionChangedEmitter = new Emitter<boolean>();

  /**
   * This emitter forwards all read events **if** the connection is established.
   */
  protected readonly onReadEmitter = new Emitter<{ messages: string[] }>();

  /**
   * Array for storing previous monitor errors received from the server, and based on the number of elements in this array,
   * we adjust the reconnection delay.
   * Super naive way: we wait `array.length * 1000` ms. Once we hit 10 errors, we do not try to reconnect and clean the array.
   */
  protected monitorErrors: MonitorError[] = [];
  protected reconnectTimeout?: number;

  /**
   * When the websocket server is up on the backend, we save the port here, so that the client knows how to connect to it
   * */
  protected wsPort?: number;
  protected webSocket?: WebSocket;

  constructor(
    @inject(MonitorModel) protected readonly monitorModel: MonitorModel,
    @inject(MonitorService) protected readonly monitorService: MonitorService,
    @inject(MonitorServiceClient)
    protected readonly monitorServiceClient: MonitorServiceClient,
    @inject(BoardsService) protected readonly boardsService: BoardsService,
    @inject(BoardsServiceProvider)
    protected readonly boardsServiceProvider: BoardsServiceProvider,
    @inject(NotificationCenter)
    protected readonly notificationCenter: NotificationCenter,
    @inject(MessageService) protected messageService: MessageService,
    @inject(ThemeService) protected readonly themeService: ThemeService
  ) {
    this.monitorServiceClient.onWebSocketChanged(
      this.handleWebSocketChanged.bind(this)
    );
    this.monitorServiceClient.onBaudRateChanged((baudRate) => {
      if (this.monitorModel.baudRate !== baudRate) {
        this.monitorModel.baudRate = baudRate;
      }
    });
    this.monitorServiceClient.onLineEndingChanged((lineending) => {
      if (this.monitorModel.lineEnding !== lineending) {
        this.monitorModel.lineEnding = lineending;
      }
    });

    this.monitorServiceClient.onError(this.handleError.bind(this));
    this.boardsServiceProvider.onBoardsConfigChanged(
      this.handleBoardConfigChange.bind(this)
    );
    this.notificationCenter.onAttachedBoardsChanged(
      this.handleAttachedBoardsChanged.bind(this)
    );
    // Handles the `baudRate` changes by reconnecting if required.
    this.monitorModel.onChange(({ property }) => {
      if (property === 'baudRate' && this.connected) {
        const { boardsConfig } = this.boardsServiceProvider;
        this.handleBoardConfigChange(boardsConfig);
      }

      // update the current values in the backend and propagate to websocket clients
      this.monitorService.updateWsConfigParam({
        ...(property === 'baudRate' && {
          currentBaudrate: this.monitorModel.baudRate,
        }),
        ...(property === 'lineEnding' && {
          currentLineEnding: this.monitorModel.lineEnding,
        }),
      });
    });

    this.themeService.onDidColorThemeChange((theme) => {
      this.monitorService.updateWsConfigParam({
        darkTheme: theme.newTheme.type === 'dark',
      });
    });
  }

  /**
   * Set the config passing only the properties that has changed. If some has changed and the serial is open,
   * we try to reconnect
   *
   * @param newConfig the porperties of the config that has changed
   */
  setConfig(newConfig: Partial<MonitorConfig>): void {
    let configHasChanged = false;
    Object.keys(this.config).forEach((key: keyof MonitorConfig) => {
      if (newConfig[key] && newConfig[key] !== this.config[key]) {
        configHasChanged = true;
        this.config = { ...this.config, [key]: newConfig[key] };
      }
    });
    if (configHasChanged && this.isSerialOpen()) {
      this.disconnect().then(() => this.connect());
    }
  }

  getConfig(): Partial<MonitorConfig> {
    return this.config;
  }

  getWsPort(): number | undefined {
    return this.wsPort;
  }

  isWebSocketConnected(): boolean {
    return !!this.webSocket?.url;
  }

  protected handleWebSocketChanged(wsPort: number): void {
    this.wsPort = wsPort;
  }

  /**
   * When the serial monitor is open and the frontend is connected to the serial, we create the websocket here
   */
  protected createWsConnection(): boolean {
    if (this.wsPort) {
      try {
        this.webSocket = new WebSocket(`ws://localhost:${this.wsPort}`);
        this.webSocket.onmessage = (res) => {
          const messages = JSON.parse(res.data);
          this.onReadEmitter.fire({ messages });
        };
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  /**
   * Sets the types of connections needed by the client.
   *
   * @param s The new types of connections (can be 'Monitor', 'Plotter', none or both).
   *          If the previuos state was empty and 's' is not, it tries to reconnect to the serial service
   *          If the provios state was NOT empty and now it is, it disconnects to the serial service
   * @returns The status of the operation
   */
  protected async setState(s: Serial.State): Promise<Status> {
    const oldState = deepClone(this._state);
    this._state = s;
    let status = Status.OK;

    if (this.isSerialOpen(oldState) && !this.isSerialOpen()) {
      status = await this.disconnect();
    } else if (!this.isSerialOpen(oldState) && this.isSerialOpen()) {
      status = await this.connect();
    }

    return status;
  }

  protected get state(): Serial.State {
    return this._state;
  }

  isSerialOpen(state?: Serial.State): boolean {
    return (state ? state : this._state).length > 0;
  }

  get monitorConfig(): MonitorConfig | undefined {
    return isMonitorConfig(this.config)
      ? (this.config as MonitorConfig)
      : undefined;
  }

  get connected(): boolean {
    return this._connected;
  }

  set connected(c: boolean) {
    this._connected = c;
    this.onConnectionChangedEmitter.fire(this._connected);
  }
  /**
   * Called when a client opens the serial from the GUI
   *
   * @param type could be either 'Monitor' or 'Plotter'. If it's 'Monitor' we also connect to the websocket and
   *             listen to the message events
   * @returns the status of the operation
   */
  async openSerial(type: Serial.Type): Promise<Status> {
    if (this.state.includes(type)) return Status.OK;
    const newState = deepClone(this.state);
    newState.push(type);
    const status = await this.setState(newState);
    if (Status.isOK(status) && type === Serial.Type.Monitor)
      this.createWsConnection();
    return status;
  }

  /**
   * Called when a client closes the serial from the GUI
   *
   * @param type could be either 'Monitor' or 'Plotter'. If it's 'Monitor' we close the websocket connection
   * @returns the status of the operation
   */
  async closeSerial(type: Serial.Type): Promise<Status> {
    const index = this.state.indexOf(type);
    let status = Status.OK;
    if (index >= 0) {
      const newState = deepClone(this.state);
      newState.splice(index, 1);
      status = await this.setState(newState);
      if (
        Status.isOK(status) &&
        type === Serial.Type.Monitor &&
        this.webSocket
      ) {
        this.webSocket.close();
        this.webSocket = undefined;
      }
    }
    return status;
  }

  /**
   * Handles error on the MonitorServiceClient and try to reconnect, eventually
   */
  handleError(error: MonitorError): void {
    if (!this.connected) return;
    const { code, config } = error;
    const { board, port } = config;
    const options = { timeout: 3000 };
    switch (code) {
      case MonitorError.ErrorCodes.CLIENT_CANCEL: {
        console.debug(
          `Serial connection was canceled by client: ${Serial.Config.toString(
            this.config
          )}.`
        );
        break;
      }
      case MonitorError.ErrorCodes.DEVICE_BUSY: {
        this.messageService.warn(
          nls.localize(
            'arduino/monitor/connectionBusy',
            'Connection failed. Serial port is busy: {0}',
            Port.toString(port)
          ),
          options
        );
        this.monitorErrors.push(error);
        break;
      }
      case MonitorError.ErrorCodes.DEVICE_NOT_CONFIGURED: {
        this.messageService.info(
          nls.localize(
            'arduino/monitor/disconnected',
            'Disconnected {0} from {1}.',
            Board.toString(board, {
              useFqbn: false,
            }),
            Port.toString(port)
          ),
          options
        );
        break;
      }
      case undefined: {
        this.messageService.error(
          nls.localize(
            'arduino/monitor/unexpectedError',
            'Unexpected error. Reconnecting {0} on port {1}.',
            Board.toString(board),
            Port.toString(port)
          ),
          options
        );
        console.error(JSON.stringify(error));
        break;
      }
    }
    this.connected = false;

    if (this.isSerialOpen()) {
      if (this.monitorErrors.length >= 10) {
        this.messageService.warn(
          nls.localize(
            'arduino/monitor/failedReconnect',
            'Failed to reconnect {0} to serial after 10 consecutive attempts. The {1} serial port is busy.',
            Board.toString(board, {
              useFqbn: false,
            }),
            Port.toString(port)
          )
        );
        this.monitorErrors.length = 0;
      } else {
        const attempts = this.monitorErrors.length || 1;
        if (this.reconnectTimeout !== undefined) {
          // Clear the previous timer.
          window.clearTimeout(this.reconnectTimeout);
        }
        const timeout = attempts * 1000;
        this.messageService.warn(
          nls.localize(
            'arduino/monitor/reconnect',
            'Reconnecting {0} to {1} in {2] seconds...',
            Board.toString(board, {
              useFqbn: false,
            }),
            Port.toString(port),
            attempts.toString()
          )
        );
        this.reconnectTimeout = window.setTimeout(
          () => this.connect(),
          timeout
        );
      }
    }
  }

  handleAttachedBoardsChanged(event: AttachedBoardsChangeEvent): void {
    const { boardsConfig } = this.boardsServiceProvider;
    if (
      this.boardsServiceProvider.canUploadTo(boardsConfig, {
        silent: false,
      })
    ) {
      const { attached } = AttachedBoardsChangeEvent.diff(event);
      if (
        attached.boards.some(
          (board) =>
            !!board.port && BoardsConfig.Config.sameAs(boardsConfig, board)
        )
      ) {
        const { selectedBoard: board, selectedPort: port } = boardsConfig;
        const { baudRate } = this.monitorModel;
        const newConfig = { board, port, baudRate };
        this.setConfig(newConfig);
      }
    }
  }

  async connect(): Promise<Status> {
    if (this.connected) return Status.ALREADY_CONNECTED;
    if (!isMonitorConfig(this.config)) {
      this.messageService.error(
        `Please select a board and a port to open the serial connection.`
      );
      return Status.NOT_CONNECTED;
    }

    console.info(
      `>>> Creating serial connection for ${Board.toString(
        this.config.board
      )} on port ${Port.toString(this.config.port)}...`
    );
    const connectStatus = await this.monitorService.connect(this.config);
    if (Status.isOK(connectStatus)) {
      this.connected = true;
      console.info(
        `<<< Serial connection created for ${Board.toString(this.config.board, {
          useFqbn: false,
        })} on port ${Port.toString(this.config.port)}.`
      );
    }

    return Status.isOK(connectStatus);
  }

  async disconnect(): Promise<Status> {
    if (!this.connected) {
      return Status.OK;
    }

    console.log('>>> Disposing existing serial connection...');
    const status = await this.monitorService.disconnect();
    if (Status.isOK(status)) {
      this.connected = false;
      console.log(
        `<<< Disposed serial connection. Was: ${Serial.Config.toString(
          this.config
        )}`
      );
      this.wsPort = undefined;
    } else {
      console.warn(
        `<<< Could not dispose serial connection. Activate connection: ${Serial.Config.toString(
          this.config
        )}`
      );
    }

    return status;
  }

  /**
   * Sends the data to the connected serial monitor.
   * The desired EOL is appended to `data`, you do not have to add it.
   * It is a NOOP if connected.
   */
  async send(data: string): Promise<Status> {
    if (!this.connected) {
      return Status.NOT_CONNECTED;
    }
    return new Promise<Status>((resolve) => {
      this.monitorService
        .sendMessageToSerial(data + this.monitorModel.lineEnding)
        .then(() => resolve(Status.OK));
    });
  }

  get onConnectionChanged(): Event<boolean> {
    return this.onConnectionChangedEmitter.event;
  }

  get onRead(): Event<{ messages: string[] }> {
    return this.onReadEmitter.event;
  }

  protected async handleBoardConfigChange(
    boardsConfig: BoardsConfig.Config
  ): Promise<void> {
    if (
      this.boardsServiceProvider.canUploadTo(boardsConfig, {
        silent: false,
      })
    ) {
      // Instead of calling `getAttachedBoards` and filtering for `AttachedSerialBoard` we have to check the available ports.
      // The connected board might be unknown. See: https://github.com/arduino/arduino-pro-ide/issues/127#issuecomment-563251881
      const ports = await this.boardsService.getAvailablePorts();
      if (ports.some((port) => Port.equals(port, boardsConfig.selectedPort))) {
        const { selectedBoard: board, selectedPort: port } = boardsConfig;
        const { baudRate } = this.monitorModel;
        const newConfig: MonitorConfig = { board, port, baudRate };
        this.setConfig(newConfig);
      }
    }
  }
}

export namespace Serial {
  export enum Type {
    Monitor = 'Monitor',
    Plotter = 'Plotter',
  }

  /**
   * The state represents which types of connections are needed by the client, and it should match whether the Serial Monitor
   * or the Serial Plotter are open or not in the GUI. It's an array cause it's possible to have both, none or only one of
   * them open
   */
  export type State = Serial.Type[];

  export namespace Config {
    export function toString(config: Partial<MonitorConfig>): string {
      if (!isMonitorConfig(config)) return '';
      const { board, port } = config;
      return `${Board.toString(board)} ${Port.toString(port)}`;
    }
  }
}

function isMonitorConfig(
  config: Partial<MonitorConfig>
): config is MonitorConfig {
  return !!config.board && !!config.baudRate && !!config.port;
}
