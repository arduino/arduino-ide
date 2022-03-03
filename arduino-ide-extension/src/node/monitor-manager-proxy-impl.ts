import { inject, injectable } from "@theia/core/shared/inversify";
import { MonitorManagerProxy, MonitorManagerProxyClient } from "../common/monitor-manager-proxy";
import { MonitorManager } from "./monitor-manager";

@injectable()
export class MonitorManagerProxyImpl implements MonitorManagerProxy {
    constructor(
        @inject(MonitorManager)
        protected readonly manager: MonitorManager,
    ) {
    }

    dispose(): void {
        // TODO
    }

    setClient(client: MonitorManagerProxyClient | undefined): void {
        // TODO
    }
}