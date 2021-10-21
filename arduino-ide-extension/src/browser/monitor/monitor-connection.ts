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
import { Disposable } from '@theia/core';
import { nls } from '@theia/core/lib/browser/nls';

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

  protected _state: MonitorConnection.State | undefined;

  /**
   * Note: The idea is to toggle this property from the UI (`Monitor` view)
   * and the boards config and the boards attachment/detachment logic can be at on place, here.
   */
  protected _autoConnect = false;
  protected readonly onConnectionChangedEmitter = new Emitter<
    MonitorConnection.State | undefined
  >();
  /**
   * This emitter forwards all read events **iff** the connection is established.
   */
  protected readonly onReadEmitter = new Emitter<{ messages: string[] }>();

  protected toDisposeOnDisconnect: Disposable[] = [];

  /**
   * Array for storing previous monitor errors received from the server, and based on the number of elements in this array,
   * we adjust the reconnection delay.
   * Super naive way: we wait `array.length * 1000` ms. Once we hit 10 errors, we do not try to reconnect and clean the array.
   */
  protected monitorErrors: MonitorError[] = [];
  protected reconnectTimeout?: number;

  @postConstruct()
  protected init(): void {
    // Handles the `baudRate` changes by reconnecting if required.
    this.monitorModel.onChange(({ property }) => {
      if (property === 'baudRate' && this.autoConnect && this.connected) {
        const { boardsConfig } = this.boardsServiceProvider;
        this.handleBoardConfigChange(boardsConfig);
      }
    });
  }

  async handleMessage(port: string): Promise<void> {
    const w = new WebSocket(`ws://localhost:${port}`);
    w.onmessage = (res) => {
      const messages = JSON.parse(res.data);
      this.onReadEmitter.fire({ messages });
    };
  }

  protected set state(s: MonitorConnection.State | undefined) {
    this.onConnectionChangedEmitter.fire(this.state);
    this._state = s;
    if (!this.connected) this.toDisposeOnDisconnect.forEach((d) => d.dispose());
  }

  get connected(): boolean {
    return !!this.state;
  }

  get monitorConfig(): MonitorConfig | undefined {
    return this.state ? this.state.config : undefined;
  }

  get autoConnect(): boolean {
    return this._autoConnect;
  }

  set autoConnect(value: boolean) {
    const oldValue = this._autoConnect;
    this._autoConnect = value;
    // When we enable the auto-connect, we have to connect
    if (!oldValue && value) {
      // We have to make sure the previous boards config has been restored.
      // Otherwise, we might start the auto-connection without configured boards.
      this.applicationState.reachedState('started_contributions').then(() => {
        const { boardsConfig } = this.boardsServiceProvider;
        this.handleBoardConfigChange(boardsConfig);
      });
    } else if (oldValue && !value) {
      if (this.reconnectTimeout !== undefined) {
        window.clearTimeout(this.reconnectTimeout);
        this.monitorErrors.length = 0;
      }
    }
  }

  handleError(error: MonitorError): void {
    let shouldReconnect = false;
    if (this.state) {
      const { code, config } = error;
      const { board, port } = config;
      const options = { timeout: 3000 };
      switch (code) {
        case MonitorError.ErrorCodes.CLIENT_CANCEL: {
          console.debug(
            `Connection was canceled by client: ${MonitorConnection.State.toString(
              this.state
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
          shouldReconnect = this.autoConnect;
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
          shouldReconnect = this.connected && this.autoConnect;
          break;
        }
      }
      const oldState = this.state;
      this.state = undefined;

      if (shouldReconnect) {
        if (this.monitorErrors.length >= 10) {
          this.messageService.warn(
            nls.localize(
              'arduino/monitor/failedReconnect',
              'Failed to reconnect {0} to the the serial-monitor after 10 consecutive attempts. The {1} serial port is busy.',
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
            ),
            { timeout }
          );
          this.reconnectTimeout = window.setTimeout(
            () => this.connect(oldState.config),
            timeout
          );
        }
      }
    }
  }

  handleAttachedBoardsChanged(event: AttachedBoardsChangeEvent): void {
    if (this.autoConnect && this.connected) {
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
          this.disconnect().then(() => this.connect({ board, port, baudRate }));
        }
      }
    }
  }

  async connect(config: MonitorConfig): Promise<Status> {
    this.toDisposeOnDisconnect.push(
      this.monitorServiceClient.onMessage(this.handleMessage.bind(this)),
      this.monitorServiceClient.onError(this.handleError.bind(this)),
      this.boardsServiceProvider.onBoardsConfigChanged(
        this.handleBoardConfigChange.bind(this)
      ),
      this.notificationCenter.onAttachedBoardsChanged(
        this.handleAttachedBoardsChanged.bind(this)
      )
    );
    if (this.connected) {
      const disconnectStatus = await this.disconnect();
      if (!Status.isOK(disconnectStatus)) {
        return disconnectStatus;
      }
    }
    console.info(
      `>>> Creating serial monitor connection for ${Board.toString(
        config.board
      )} on port ${Port.toString(config.port)}...`
    );
    const connectStatus = await this.monitorService.connect(config);
    if (Status.isOK(connectStatus)) {
      this.state = { config };
      console.info(
        `<<< Serial monitor connection created for ${Board.toString(
          config.board,
          { useFqbn: false }
        )} on port ${Port.toString(config.port)}.`
      );
    }

    return Status.isOK(connectStatus);
  }

  async disconnect(): Promise<Status> {
    if (!this.connected) {
      return Status.OK;
    }
    const stateCopy = deepClone(this.state);
    if (!stateCopy) {
      return Status.OK;
    }
    console.log('>>> Disposing existing monitor connection...');
    const status = await this.monitorService.disconnect();
    if (Status.isOK(status)) {
      console.log(
        `<<< Disposed connection. Was: ${MonitorConnection.State.toString(
          stateCopy
        )}`
      );
    } else {
      console.warn(
        `<<< Could not dispose connection. Activate connection: ${MonitorConnection.State.toString(
          stateCopy
        )}`
      );
    }
    this.state = undefined;

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
        .send(data + this.monitorModel.lineEnding)
        .then(() => resolve(Status.OK));
    });
  }

  get onConnectionChanged(): Event<MonitorConnection.State | undefined> {
    return this.onConnectionChangedEmitter.event;
  }

  get onRead(): Event<{ messages: string[] }> {
    return this.onReadEmitter.event;
  }

  protected async handleBoardConfigChange(
    boardsConfig: BoardsConfig.Config
  ): Promise<void> {
    if (this.autoConnect) {
      if (
        this.boardsServiceProvider.canUploadTo(boardsConfig, {
          silent: false,
        })
      ) {
        // Instead of calling `getAttachedBoards` and filtering for `AttachedSerialBoard` we have to check the available ports.
        // The connected board might be unknown. See: https://github.com/arduino/arduino-pro-ide/issues/127#issuecomment-563251881
        this.boardsService.getAvailablePorts().then((ports) => {
          if (
            ports.some((port) => Port.equals(port, boardsConfig.selectedPort))
          ) {
            new Promise<void>((resolve) => {
              // First, disconnect if connected.
              if (this.connected) {
                this.disconnect().then(() => resolve());
                return;
              }
              resolve();
            }).then(() => {
              // Then (re-)connect.
              const { selectedBoard: board, selectedPort: port } = boardsConfig;
              const { baudRate } = this.monitorModel;
              this.connect({ board, port, baudRate });
            });
          }
        });
      }
    }
  }
}

export namespace MonitorConnection {
  export interface State {
    readonly config: MonitorConfig;
  }

  export namespace State {
    export function toString(state: State): string {
      const { config } = state;
      const { board, port } = config;
      return `${Board.toString(board)} ${Port.toString(port)}`;
    }
  }
}
