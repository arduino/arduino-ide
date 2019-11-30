import { injectable, inject, postConstruct } from 'inversify';
import { Emitter, Event } from '@theia/core/lib/common/event';
// import { ConnectionStatusService } from '@theia/core/lib/browser/connection-status-service';
import { MessageService } from '@theia/core/lib/common/message-service';
import { MonitorService, MonitorConfig, MonitorError } from '../../common/protocol/monitor-service';
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
    protected readonly onConnectionChangedEmitter = new Emitter<string | undefined>();

    readonly onConnectionChanged: Event<string | undefined> = this.onConnectionChangedEmitter.event;

    @postConstruct()
    protected init(): void {
        this.monitorServiceClient.onError(error => {
            if (this.state) {
                const { code, connectionId, config } = error;
                if (this.state.connectionId === connectionId) {
                    switch (code) {
                        case MonitorError.ErrorCodes.CLIENT_CANCEL: {
                            console.log(`Connection was canceled by client: ${MonitorConnection.State.toString(this.state)}.`);
                            break;
                        }
                        case MonitorError.ErrorCodes.DEVICE_BUSY: {
                            const { port } = config;
                            this.messageService.warn(`Connection failed. Serial port is busy: ${Port.toString(port)}.`);
                            break;
                        }
                        case MonitorError.ErrorCodes.DEVICE_NOT_CONFIGURED: {
                            const { port } = config;
                            this.messageService.info(`Disconnected from ${Port.toString(port)}.`);
                            break;
                        }
                    }
                    this.state = undefined;
                } else {
                    console.warn(`Received an error from unexpected connection: ${MonitorConnection.State.toString({ connectionId, config })}.`);
                }
            }
        });
    }

    get connectionId(): string | undefined {
        return this.state ? this.state.connectionId : undefined;
    }

    get connectionConfig(): MonitorConfig | undefined {
        return this.state ? this.state.config : undefined;
    }

    async connect(config: MonitorConfig): Promise<string | undefined> {
        if (this.state) {
            throw new Error(`Already connected to ${MonitorConnection.State.toString(this.state)}.`);
        }
        const { connectionId } = await this.monitorService.connect(config);
        this.state = { connectionId, config };
        this.onConnectionChangedEmitter.fire(connectionId);
        return connectionId;
    }

    async disconnect(): Promise<boolean> {
        if (!this.state) {
            throw new Error('Not connected. Nothing to disconnect.');
        }
        console.log('>>> Disposing existing monitor connection before establishing a new one...');
        const result = await this.monitorService.disconnect(this.state.connectionId);
        if (result) {
            console.log(`<<< Disposed connection. Was: ${MonitorConnection.State.toString(this.state)}`);
            this.state = undefined;
            this.onConnectionChangedEmitter.fire(undefined);
        } else {
            console.warn(`<<< Could not dispose connection. Activate connection: ${MonitorConnection.State.toString(this.state)}`);
        }
        return result;
    }

}

export namespace MonitorConnection {

    export interface State {
        readonly connectionId: string;
        readonly config: MonitorConfig;
    }

    export namespace State {
        export function toString(state: State): string {
            const { connectionId, config } = state;
            const { board, port } = config;
            return `${Board.toString(board)} ${Port.toString(port)} [ID: ${connectionId}]`;
        }
    }

}
