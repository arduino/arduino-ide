import { injectable, inject, postConstruct } from 'inversify';
import { Emitter, Event } from '@theia/core/lib/common/event';
// import { ConnectionStatusService } from '@theia/core/lib/browser/connection-status-service';
import { MessageService } from '@theia/core/lib/common/message-service';
import { MonitorService, MonitorConfig, MonitorError, Status } from '../../common/protocol/monitor-service';
import { BoardsServiceClientImpl } from '../boards/boards-service-client-impl';
import { Port, Board } from '../../common/protocol/boards-service';
import { MonitorServiceClientImpl } from './monitor-service-client-impl';

@injectable()
export class MonitorConnection {

    @inject(MonitorService)
    protected readonly monitorService: MonitorService;

    @inject(MonitorServiceClientImpl)
    protected readonly monitorServiceClient: MonitorServiceClientImpl;

    @inject(BoardsServiceClientImpl)
    protected boardsServiceClient: BoardsServiceClientImpl;

    @inject(MessageService)
    protected messageService: MessageService;

    // @inject(ConnectionStatusService)
    // protected readonly connectionStatusService: ConnectionStatusService;

    protected state: MonitorConnection.State | undefined;
    protected readonly onConnectionChangedEmitter = new Emitter<boolean>();

    readonly onConnectionChanged: Event<boolean> = this.onConnectionChangedEmitter.event;

    @postConstruct()
    protected init(): void {
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
                        shouldReconnect = true;
                    }
                }
                const oldState = this.state;
                this.state = undefined;
                if (shouldReconnect) {
                    await this.connect(oldState.config);
                }
            }
        });
    }

    get connected(): boolean {
        return !!this.state;
    }

    get connectionConfig(): MonitorConfig | undefined {
        return this.state ? this.state.config : undefined;
    }

    async connect(config: MonitorConfig): Promise<Status> {
        if (this.state) {
            const disconnectStatus = await this.disconnect();
            if (!Status.isOK(disconnectStatus)) {
                return disconnectStatus;
            }
        }
        const connectStatus = await this.monitorService.connect(config);
        if (Status.isOK(connectStatus)) {
            this.state = { config };
            this.onConnectionChangedEmitter.fire(true);
        }
        return Status.isOK(connectStatus);
    }

    async disconnect(): Promise<Status> {
        if (!this.state) {
            return Status.OK;
        }
        console.log('>>> Disposing existing monitor connection before establishing a new one...');
        const status = await this.monitorService.disconnect();
        if (Status.isOK(status)) {
            console.log(`<<< Disposed connection. Was: ${MonitorConnection.State.toString(this.state)}`);
        } else {
            console.warn(`<<< Could not dispose connection. Activate connection: ${MonitorConnection.State.toString(this.state)}`);
        }
        this.state = undefined;
        this.onConnectionChangedEmitter.fire(false);
        return status;
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
