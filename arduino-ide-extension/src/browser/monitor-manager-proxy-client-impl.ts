import { Emitter } from "@theia/core";
import { injectable } from "@theia/core/shared/inversify";
import { MonitorManagerProxyClient } from "../common/protocol/monitor-service";

@injectable()
export class MonitorManagerProxyClientImpl implements MonitorManagerProxyClient {
    protected readonly onWebSocketChangedEmitter = new Emitter<number>();
    readonly onWebSocketChanged = this.onWebSocketChangedEmitter.event;

    notifyWebSocketChanged(message: number): void {
        this.onWebSocketChangedEmitter.fire(message);
    }
}
