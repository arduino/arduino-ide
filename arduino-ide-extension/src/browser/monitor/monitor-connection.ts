import { injectable, inject } from "inversify";
import { MonitorService, ConnectionConfig } from "../../common/protocol/monitor-service";
import { Emitter, Event } from "@theia/core";

@injectable()
export class MonitorConnection {

    @inject(MonitorService)
    protected readonly monitorService: MonitorService;

    protected _connectionId: string | undefined;

    protected _connectionConfig: ConnectionConfig;

    protected readonly onConnectionChangedEmitter = new Emitter<string | undefined>();
    readonly onConnectionChanged: Event<string | undefined> = this.onConnectionChangedEmitter.event;

    get connectionId(): string | undefined {
        return this._connectionId;
    }

    set connectionId(cid: string | undefined) {
        this._connectionId = cid;
    }

    get connectionConfig(): ConnectionConfig {
        return this._connectionConfig;
    }

    async connect(config: ConnectionConfig): Promise<string | undefined> {
        if (this._connectionId) {
            await this.disconnect();
        }
        const { connectionId } = await this.monitorService.connect(config);
        this._connectionId = connectionId;
        this._connectionConfig = config;

        this.onConnectionChangedEmitter.fire(this._connectionId);

        return connectionId;
    }

    async disconnect(): Promise<boolean> {
        let result = true;
        const connections = await this.monitorService.getConnectionIds();
        if (this._connectionId && connections.findIndex(id => id === this._connectionId) >= 0) {
            console.log('>>> Disposing existing monitor connection before establishing a new one...');
            result = await this.monitorService.disconnect(this._connectionId);
            if (!result) {
                // TODO: better!!!
                console.error(`Could not close connection: ${this._connectionId}. Check the backend logs.`);
            } else {
                console.log(`<<< Disposed ${this._connectionId} connection.`);
                this._connectionId = undefined;
            }
            this.onConnectionChangedEmitter.fire(this._connectionId);
        }
        return result;
    }
}