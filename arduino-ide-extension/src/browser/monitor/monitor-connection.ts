import { injectable, inject } from "inversify";
import { MonitorService, ConnectionConfig } from "../../common/protocol/monitor-service";
import { Emitter, Event } from "@theia/core";

@injectable()
export class MonitorConnection {

    @inject(MonitorService)
    protected readonly monitorService: MonitorService;

    connectionId: string | undefined;

    protected _connectionConfig: ConnectionConfig | undefined;

    protected readonly onConnectionChangedEmitter = new Emitter<string | undefined>();
    readonly onConnectionChanged: Event<string | undefined> = this.onConnectionChangedEmitter.event;

    get connectionConfig(): ConnectionConfig | undefined {
        return this._connectionConfig;
    }

    async connect(config: ConnectionConfig): Promise<string | undefined> {
        if (this.connectionId) {
            await this.disconnect();
        }
        const { connectionId } = await this.monitorService.connect(config);
        this.connectionId = connectionId;
        this._connectionConfig = config;

        this.onConnectionChangedEmitter.fire(this.connectionId);

        return connectionId;
    }

    async disconnect(): Promise<boolean> {
        let result = true;
        const connections = await this.monitorService.getConnectionIds();
        if (this.connectionId && connections.findIndex(id => id === this.connectionId) >= 0) {
            console.log('>>> Disposing existing monitor connection before establishing a new one...');
            result = await this.monitorService.disconnect(this.connectionId);
            if (!result) {
                // TODO: better!!!
                console.error(`Could not close connection: ${this.connectionId}. Check the backend logs.`);
            } else {
                console.log(`<<< Disposed ${this.connectionId} connection.`);
                this.connectionId = undefined;
                this._connectionConfig = undefined;
                this.onConnectionChangedEmitter.fire(this.connectionId);
            }
        }
        return result;
    }
}