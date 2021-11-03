import { injectable, inject, postConstruct } from 'inversify';
import { deepClone } from '@theia/core/lib/common/objects';
import { Emitter, Event } from '@theia/core/lib/common/event';
import { MessageService } from '@theia/core/lib/common/message-service';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
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

export enum SerialType {
  Monitor = 'Monitor',
  Plotter = 'Plotter',
}

@injectable()
export class MonitorConnection {
  @inject(MonitorModel)
  protected readonly monitorModel: MonitorModel;

  @inject(MonitorService)
  protected readonly monitorService: MonitorService;

  @inject(MonitorServiceClient)
  protected readonly monitorServiceClient: MonitorServiceClient;

  @inject(BoardsService)
  protected readonly boardsService: BoardsService;

  @inject(BoardsServiceProvider)
  protected readonly boardsServiceProvider: BoardsServiceProvider;

  @inject(NotificationCenter)
  protected readonly notificationCenter: NotificationCenter;

  @inject(MessageService)
  protected messageService: MessageService;

  @inject(FrontendApplicationStateService)
  protected readonly applicationState: FrontendApplicationStateService;

  @inject(MonitorModel)
  protected readonly model: MonitorModel;

  @inject(ThemeService)
  protected readonly themeService: ThemeService;

  protected _state: MonitorConnection.State = [];
  protected _connected: boolean;

  /**
   * Note: The idea is to toggle this property from the UI (`Monitor` view)
   * and the boards config and the boards attachment/detachment logic can be at on place, here.
   */
  protected readonly onConnectionChangedEmitter =
    new Emitter<MonitorConnection.State>();
  /**
   * This emitter forwards all read events **iff** the connection is established.
   */
  protected readonly onReadEmitter = new Emitter<{ messages: string[] }>();

  /**
   * Array for storing previous monitor errors received from the server, and based on the number of elements in this array,
   * we adjust the reconnection delay.
   * Super naive way: we wait `array.length * 1000` ms. Once we hit 10 errors, we do not try to reconnect and clean the array.
   */
  protected monitorErrors: MonitorError[] = [];
  protected reconnectTimeout?: number;

  protected wsPort?: number;
  protected webSocket?: WebSocket;
  protected config: Partial<MonitorConfig> = {
    board: undefined,
    port: undefined,
    baudRate: undefined,
  };

  @postConstruct()
  protected init(): void {
    this.monitorServiceClient.onWebSocketChanged(
      this.handleWebSocketChanged.bind(this)
    );
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
    });

    this.themeService.onDidColorThemeChange((theme) => {
      this.monitorService.updateWsConfigParam({
        darkTheme: theme.newTheme.type === 'dark',
      });
    });
  }

  protected setConfig(newConfig: Partial<MonitorConfig>): void {
    let shouldReconnect = false;
    Object.keys(this.config).forEach((key: keyof MonitorConfig) => {
      if (newConfig[key] && newConfig[key] !== this.config[key]) {
        shouldReconnect = true;
        this.config = { ...this.config, [key]: newConfig[key] };
      }
    });
    if (shouldReconnect && this.isSerialOpen()) {
      this.disconnect().then(() => this.connect());
    }
  }

  getWsPort(): number | undefined {
    return this.wsPort;
  }

  handleWebSocketChanged(wsPort: number): void {
    this.wsPort = wsPort;
  }

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

  protected async setState(s: MonitorConnection.State): Promise<Status> {
    const oldState = deepClone(this._state);
    this._state = s;
    this.onConnectionChangedEmitter.fire(this._state);
    let status = Status.OK;

    if (this.isSerialOpen(oldState) && !this.isSerialOpen()) {
      status = await this.disconnect();
    } else if (!this.isSerialOpen(oldState) && this.isSerialOpen()) {
      status = await this.connect();
    }

    // if (this.connected) {
    //   switch (this.state.connected) {
    //     case SerialType.All:
    //       return Status.OK;
    //     case SerialType.Plotter:
    //       if (type === SerialType.Monitor) {
    //         if (this.createWsConnection()) {
    //           this.state = { ...this.state, connected: SerialType.All };
    //           return Status.OK;
    //         }
    //         return Status.NOT_CONNECTED;
    //       }
    //       return Status.OK;
    //     case SerialType.Monitor:
    //       if (type === SerialType.Plotter)
    //         this.state = { ...this.state, connected: SerialType.All };
    //       return SerialType.All;
    //   }
    // }

    return status;
  }

  protected get state(): MonitorConnection.State {
    return this._state;
  }

  isSerialOpen(state?: MonitorConnection.State): boolean {
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
  }

  async openSerial(type: SerialType): Promise<Status> {
    if (this.state.includes(type)) return Status.OK;
    const newState = deepClone(this.state);
    newState.push(type);
    const status = await this.setState(newState);
    if (Status.isOK(status) && type === SerialType.Monitor)
      this.createWsConnection();
    return status;
  }

  async closeSerial(type: SerialType): Promise<Status> {
    const index = this.state.indexOf(type);
    let status = Status.OK;
    if (index >= 0) {
      const newState = deepClone(this.state);
      newState.splice(index, 1);
      status = await this.setState(newState);
      if (
        Status.isOK(status) &&
        type === SerialType.Monitor &&
        this.webSocket
      ) {
        this.webSocket.close();
        this.webSocket = undefined;
      }
    }
    return status;
  }

  handleError(error: MonitorError): void {
    if (!this.connected) return;
    const { code, config } = error;
    const { board, port } = config;
    const options = { timeout: 3000 };
    switch (code) {
      case MonitorError.ErrorCodes.CLIENT_CANCEL: {
        console.debug(
          `Serial connection was canceled by client: ${MonitorConnection.Config.toString(
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
        `<<< Disposed serial connection. Was: ${MonitorConnection.Config.toString(
          this.config
        )}`
      );
      this.wsPort = undefined;
    } else {
      console.warn(
        `<<< Could not dispose serial connection. Activate connection: ${MonitorConnection.Config.toString(
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

  get onConnectionChanged(): Event<MonitorConnection.State> {
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
        // update the baudrate on the config
        this.monitorService.updateWsConfigParam({
          currentBaudrate: baudRate,
        });
        const newConfig: MonitorConfig = { board, port, baudRate };
        this.setConfig(newConfig);
      }
    }
  }
}

export namespace MonitorConnection {
  export type State = SerialType[];

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
