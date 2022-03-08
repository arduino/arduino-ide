import { injectable, inject } from '@theia/core/shared/inversify';
import { Emitter, Event } from '@theia/core/lib/common/event';
import { MessageService } from '@theia/core/lib/common/message-service';
import {
  SerialService,
  SerialConfig,
  SerialError,
  Status,
  SerialServiceClient,
} from '../../common/protocol/serial-service';
import { BoardsServiceProvider } from '../boards/boards-service-provider';
import {
  Board,
  BoardsService,
} from '../../common/protocol/boards-service';
import { BoardsConfig } from '../boards/boards-config';
import { SerialModel } from './serial-model';
import { ThemeService } from '@theia/core/lib/browser/theming';
import { CoreService } from '../../common/protocol';
import { nls } from '@theia/core/lib/common/nls';

@injectable()
export class SerialConnectionManager {
  protected config: Partial<SerialConfig> = {
    board: undefined,
    port: undefined,
    baudRate: undefined,
  };

  protected readonly onConnectionChangedEmitter = new Emitter<boolean>();

  /**
   * This emitter forwards all read events **if** the connection is established.
   */
  protected readonly onReadEmitter = new Emitter<{ messages: string[] }>();

  /**
   * Array for storing previous serial errors received from the server, and based on the number of elements in this array,
   * we adjust the reconnection delay.
   * Super naive way: we wait `array.length * 1000` ms. Once we hit 10 errors, we do not try to reconnect and clean the array.
   */
  protected serialErrors: SerialError[] = [];
  protected reconnectTimeout?: number;

  /**
   * When the websocket server is up on the backend, we save the port here, so that the client knows how to connect to it
   * */
  protected wsPort?: number;
  protected webSocket?: WebSocket;

  constructor(
    @inject(SerialModel) protected readonly serialModel: SerialModel,
    @inject(SerialService) protected readonly serialService: SerialService,
    @inject(SerialServiceClient)
    protected readonly serialServiceClient: SerialServiceClient,
    @inject(BoardsService) protected readonly boardsService: BoardsService,
    @inject(BoardsServiceProvider)
    protected readonly boardsServiceProvider: BoardsServiceProvider,
    @inject(MessageService) protected messageService: MessageService,
    @inject(ThemeService) protected readonly themeService: ThemeService,
    @inject(CoreService) protected readonly core: CoreService,
    @inject(BoardsServiceProvider)
    protected readonly boardsServiceClientImpl: BoardsServiceProvider
  ) {
    this.serialServiceClient.onWebSocketChanged(
      this.handleWebSocketChanged.bind(this)
    );
    this.serialServiceClient.onBaudRateChanged((baudRate) => {
      if (this.serialModel.baudRate !== baudRate) {
        this.serialModel.baudRate = baudRate;
      }
    });
    this.serialServiceClient.onLineEndingChanged((lineending) => {
      if (this.serialModel.lineEnding !== lineending) {
        this.serialModel.lineEnding = lineending;
      }
    });
    this.serialServiceClient.onInterpolateChanged((interpolate) => {
      if (this.serialModel.interpolate !== interpolate) {
        this.serialModel.interpolate = interpolate;
      }
    });

    this.serialServiceClient.onError(this.handleError.bind(this));
    this.boardsServiceProvider.onBoardsConfigChanged(
      this.handleBoardConfigChange.bind(this)
    );

    // Handles the `baudRate` changes by reconnecting if required.
    this.serialModel.onChange(async ({ property }) => {
      if (
        property === 'baudRate' &&
        (await this.serialService.isSerialPortOpen())
      ) {
        const { boardsConfig } = this.boardsServiceProvider;
        this.handleBoardConfigChange(boardsConfig);
      }

      // update the current values in the backend and propagate to websocket clients
      this.serialService.updateWsConfigParam({
        ...(property === 'lineEnding' && {
          currentLineEnding: this.serialModel.lineEnding,
        }),
        ...(property === 'interpolate' && {
          interpolate: this.serialModel.interpolate,
        }),
      });
    });

    this.themeService.onDidColorThemeChange((theme) => {
      this.serialService.updateWsConfigParam({
        darkTheme: theme.newTheme.type === 'dark',
      });
    });
  }

  /**
   * Updated the config in the BE passing only the properties that has changed.
   * BE will create a new connection if needed.
   *
   * @param newConfig the porperties of the config that has changed
   */
  async setConfig(newConfig: Partial<SerialConfig>): Promise<void> {
    let configHasChanged = false;
    Object.keys(this.config).forEach((key: keyof SerialConfig) => {
      if (newConfig[key] !== this.config[key]) {
        configHasChanged = true;
        this.config = { ...this.config, [key]: newConfig[key] };
      }
    });

    if (configHasChanged) {
      this.serialService.updateWsConfigParam({
        currentBaudrate: this.config.baudRate,
        serialPort: this.config.port?.address,
      });

      if (isSerialConfig(this.config)) {
        this.serialService.setSerialConfig(this.config);
      }
    }
  }

  getConfig(): Partial<SerialConfig> {
    return this.config;
  }

  getWsPort(): number | undefined {
    return this.wsPort;
  }

  protected handleWebSocketChanged(wsPort: number): void {
    this.wsPort = wsPort;
  }

  get serialConfig(): SerialConfig | undefined {
    return isSerialConfig(this.config)
      ? (this.config as SerialConfig)
      : undefined;
  }

  async isBESerialConnected(): Promise<boolean> {
    return await this.serialService.isSerialPortOpen();
  }

  openWSToBE(): void {
    if (!isSerialConfig(this.config)) {
      this.messageService.error(
        `Please select a board and a port to open the serial connection.`
      );
    }

    if (!this.webSocket && this.wsPort) {
      try {
        this.webSocket = new WebSocket(`ws://localhost:${this.wsPort}`);
        this.webSocket.onmessage = (res) => {
          const messages = JSON.parse(res.data);
          this.onReadEmitter.fire({ messages });
        };
      } catch {
        this.messageService.error(`Unable to connect to websocket`);
      }
    }
  }

  closeWStoBE(): void {
    if (this.webSocket) {
      try {
        this.webSocket.close();
        this.webSocket = undefined;
      } catch {
        this.messageService.error(`Unable to close websocket`);
      }
    }
  }

  /**
   * Handles error on the SerialServiceClient and try to reconnect, eventually
   */
  async handleError(error: SerialError): Promise<void> {
    if (!(await this.serialService.isSerialPortOpen())) return;
    const { code, config } = error;
    const { board, port } = config;
    const options = { timeout: 3000 };
    switch (code) {
      case SerialError.ErrorCodes.CLIENT_CANCEL: {
        console.debug(
          `Serial connection was canceled by client: ${Serial.Config.toString(
            this.config
          )}.`
        );
        break;
      }
      case SerialError.ErrorCodes.DEVICE_BUSY: {
        this.messageService.warn(
          nls.localize(
            'arduino/serial/connectionBusy',
            'Connection failed. Serial port is busy: {0}',
            port.address
          ),
          options
        );
        this.serialErrors.push(error);
        break;
      }
      case SerialError.ErrorCodes.DEVICE_NOT_CONFIGURED: {
        this.messageService.info(
          nls.localize(
            'arduino/serial/disconnected',
            'Disconnected {0} from {1}.',
            Board.toString(board, {
              useFqbn: false,
            }),
            port.address
          ),
          options
        );
        break;
      }
      case undefined: {
        this.messageService.error(
          nls.localize(
            'arduino/serial/unexpectedError',
            'Unexpected error. Reconnecting {0} on port {1}.',
            Board.toString(board),
            port.address
          ),
          options
        );
        console.error(JSON.stringify(error));
        break;
      }
    }

    if ((await this.serialService.clientsAttached()) > 0) {
      if (this.serialErrors.length >= 10) {
        this.messageService.warn(
          nls.localize(
            'arduino/serial/failedReconnect',
            'Failed to reconnect {0} to serial port after 10 consecutive attempts. The {1} serial port is busy.',
            Board.toString(board, {
              useFqbn: false,
            }),
            port.address
          )
        );
        this.serialErrors.length = 0;
      } else {
        const attempts = this.serialErrors.length || 1;
        if (this.reconnectTimeout !== undefined) {
          // Clear the previous timer.
          window.clearTimeout(this.reconnectTimeout);
        }
        const timeout = attempts * 1000;
        this.messageService.warn(
          nls.localize(
            'arduino/serial/reconnect',
            'Reconnecting {0} to {1} in {2} seconds...',
            Board.toString(board, {
              useFqbn: false,
            }),
            port.address,
            attempts.toString()
          )
        );
        this.reconnectTimeout = window.setTimeout(
          () => this.reconnectAfterUpload(),
          timeout
        );
      }
    }
  }

  async reconnectAfterUpload(): Promise<void> {
    try {
      if (isSerialConfig(this.config)) {
        await this.boardsServiceClientImpl.waitUntilAvailable(
          Object.assign(this.config.board, { port: this.config.port }),
          10_000
        );
        this.serialService.connectSerialIfRequired();
      }
    } catch (waitError) {
      this.messageService.error(
        nls.localize(
          'arduino/sketch/couldNotConnectToSerial',
          'Could not reconnect to serial port. {0}',
          waitError.toString()
        )
      );
    }
  }

  /**
   * Sends the data to the connected serial port.
   * The desired EOL is appended to `data`, you do not have to add it.
   * It is a NOOP if connected.
   */
  async send(data: string): Promise<Status> {
    if (!(await this.serialService.isSerialPortOpen())) {
      return Status.NOT_CONNECTED;
    }
    return new Promise<Status>((resolve) => {
      this.serialService
        .sendMessageToSerial(data + this.serialModel.lineEnding)
        .then(() => resolve(Status.OK));
    });
  }

  get onConnectionChanged(): Event<boolean> {
    return this.onConnectionChangedEmitter.event;
  }

  get onRead(): Event<{ messages: any }> {
    return this.onReadEmitter.event;
  }

  protected async handleBoardConfigChange(
    boardsConfig: BoardsConfig.Config
  ): Promise<void> {
    const { selectedBoard: board, selectedPort: port } = boardsConfig;
    const { baudRate } = this.serialModel;
    const newConfig: Partial<SerialConfig> = { board, port, baudRate };
    this.setConfig(newConfig);
  }
}

export namespace Serial {
  export namespace Config {
    export function toString(config: Partial<SerialConfig>): string {
      if (!isSerialConfig(config)) return '';
      const { board, port } = config;
      return `${Board.toString(board)} ${port.address}`;
    }
  }
}

function isSerialConfig(config: Partial<SerialConfig>): config is SerialConfig {
  return !!config.board && !!config.baudRate && !!config.port;
}
