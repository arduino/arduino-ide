import { injectable, inject, postConstruct } from 'inversify';
import { Emitter, Event } from '@theia/core/lib/common/event';
// import { ConnectionStatusService } from '@theia/core/lib/browser/connection-status-service';
import { MessageService } from '@theia/core/lib/common/message-service';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import { MonitorService, MonitorConfig, MonitorError, Status, MonitorReadEvent } from '../../common/protocol/monitor-service';
import { BoardsServiceClientImpl } from '../boards/boards-service-client-impl';
import { Port, Board, BoardsService, AttachedSerialBoard, AttachedBoardsChangeEvent } from '../../common/protocol/boards-service';
import { MonitorServiceClientImpl } from './monitor-service-client-impl';
import { BoardsConfig } from '../boards/boards-config';
import { MonitorModel } from './monitor-model';

@injectable()
export class MonitorConnection {

    @inject(MonitorModel)
    protected readonly monitorModel: MonitorModel;

    @inject(MonitorService)
    protected readonly monitorService: MonitorService;

    @inject(MonitorServiceClientImpl)
    protected readonly monitorServiceClient: MonitorServiceClientImpl;

    @inject(BoardsService)
    protected readonly boardsService: BoardsService;

    @inject(BoardsServiceClientImpl)
    protected boardsServiceClient: BoardsServiceClientImpl;

    @inject(MessageService)
    protected messageService: MessageService;

    // @inject(ConnectionStatusService)
    // protected readonly connectionStatusService: ConnectionStatusService;

    @inject(FrontendApplicationStateService)
    protected readonly applicationState: FrontendApplicationStateService;

    protected state: MonitorConnection.State | undefined;
    /**
     * Note: The idea is to toggle this property from the UI (`Monitor` view)
     * and the boards config and the boards attachment/detachment logic can be at on place, here.
     */
    protected _autoConnect: boolean = false;
    protected readonly onConnectionChangedEmitter = new Emitter<MonitorConnection.State | undefined>();
    /**
     * This emitter forwards all read events **iff** the connection is established.
     */
    protected readonly onReadEmitter = new Emitter<MonitorReadEvent>();

    @postConstruct()
    protected init(): void {
        // Forward the messages from the board **iff** connected.
        this.monitorServiceClient.onRead(event => {
            if (this.connected) {
                this.onReadEmitter.fire(event);
            }
        });
        this.monitorServiceClient.onError(async error => {
            let shouldReconnect = false;
            if (this.state) {
                const { code, config } = error;
                switch (code) {
                    case MonitorError.ErrorCodes.CLIENT_CANCEL: {
                        console.debug(`Connection was canceled by client: ${MonitorConnection.State.toString(this.state)}.`);
                        break;
                    }
                    case MonitorError.ErrorCodes.DEVICE_BUSY: {
                        const { port } = config;
                        this.messageService.warn(`Connection failed. Serial port is busy: ${Port.toString(port)}.`);
                        break;
                    }
                    case MonitorError.ErrorCodes.DEVICE_NOT_CONFIGURED: {
                        const { port, board } = config;
                        this.messageService.info(`Disconnected ${Board.toString(board, { useFqbn: false })} from ${Port.toString(port)}.`);
                        break;
                    }
                    case undefined: {
                        const { board, port } = config;
                        this.messageService.error(`Unexpected error. Reconnecting ${Board.toString(board)} on port ${Port.toString(port)}.`);
                        console.error(JSON.stringify(error));
                        shouldReconnect = this.connected;
                    }
                }
                const oldState = this.state;
                this.state = undefined;
                this.onConnectionChangedEmitter.fire(this.state);
                if (shouldReconnect) {
                    await this.connect(oldState.config);
                }
            }
        });
        this.boardsServiceClient.onBoardsConfigChanged(this.handleBoardConfigChange.bind(this));
        this.boardsServiceClient.onBoardsChanged(event => {
            if (this.autoConnect && this.connected) {
                const { boardsConfig } = this.boardsServiceClient;
                if (this.boardsServiceClient.canUploadTo(boardsConfig, { silent: false })) {
                    const { attached } = AttachedBoardsChangeEvent.diff(event);
                    if (attached.boards.some(board => AttachedSerialBoard.is(board) && BoardsConfig.Config.sameAs(boardsConfig, board))) {
                        const { selectedBoard: board, selectedPort: port } = boardsConfig;
                        const { baudRate } = this.monitorModel;
                        this.disconnect()
                            .then(() => this.connect({ board, port, baudRate }));
                    }
                }
            }
        });
        // Handles the `baudRate` changes by reconnecting if required.
        this.monitorModel.onChange(({ property }) => {
            if (property === 'baudRate' && this.autoConnect && this.connected) {
                const { boardsConfig } = this.boardsServiceClient;
                this.handleBoardConfigChange(boardsConfig);
            }
        });
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
                const { boardsConfig } = this.boardsServiceClient;
                this.handleBoardConfigChange(boardsConfig);
            });
        }
    }

    async connect(config: MonitorConfig): Promise<Status> {
        if (this.connected) {
            const disconnectStatus = await this.disconnect();
            if (!Status.isOK(disconnectStatus)) {
                return disconnectStatus;
            }
        }
        console.info(`>>> Creating serial monitor connection for ${Board.toString(config.board)} on port ${Port.toString(config.port)}...`);
        const connectStatus = await this.monitorService.connect(config);
        if (Status.isOK(connectStatus)) {
            this.state = { config };
            console.info(`<<< Serial monitor connection created for ${Board.toString(config.board, { useFqbn: false })} on port ${Port.toString(config.port)}.`);
        }
        this.onConnectionChangedEmitter.fire(this.state);
        return Status.isOK(connectStatus);
    }

    async disconnect(): Promise<Status> {
        if (!this.state) { // XXX: we user `this.state` instead of `this.connected` to make the type checker happy. 
            return Status.OK;
        }
        console.log('>>> Disposing existing monitor connection...');
        const status = await this.monitorService.disconnect();
        if (Status.isOK(status)) {
            console.log(`<<< Disposed connection. Was: ${MonitorConnection.State.toString(this.state)}`);
        } else {
            console.warn(`<<< Could not dispose connection. Activate connection: ${MonitorConnection.State.toString(this.state)}`);
        }
        this.state = undefined;
        this.onConnectionChangedEmitter.fire(this.state);
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
        return new Promise<Status>(resolve => {
            this.monitorService.send(data + this.monitorModel.lineEnding)
                .then(() => resolve(Status.OK));
        });
    }

    get onConnectionChanged(): Event<MonitorConnection.State | undefined> {
        return this.onConnectionChangedEmitter.event;
    }

    get onRead(): Event<MonitorReadEvent> {
        return this.onReadEmitter.event;
    }

    protected async handleBoardConfigChange(boardsConfig: BoardsConfig.Config): Promise<void> {
        if (this.autoConnect) {
            if (this.boardsServiceClient.canUploadTo(boardsConfig, { silent: false })) {
                this.boardsService.getAttachedBoards().then(({ boards }) => {
                    if (boards.filter(AttachedSerialBoard.is).some(board => BoardsConfig.Config.sameAs(boardsConfig, board))) {
                        new Promise<void>(resolve => {
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
