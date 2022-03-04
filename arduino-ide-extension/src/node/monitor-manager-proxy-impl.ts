import { Emitter, ILogger } from "@theia/core";
import { inject, injectable, named } from "@theia/core/shared/inversify";
import { Disposable } from "@theia/core/shared/vscode-languageserver-protocol";
import { MonitorManagerProxy, MonitorManagerProxyClient, MonitorSettings, Status } from "../common/protocol";
import { Board, Port } from "../common/protocol";
import { MonitorManager } from "./monitor-manager";

@injectable()
export class MonitorManagerProxyImpl implements MonitorManagerProxy {
    protected client: MonitorManagerProxyClient;

    protected selectedBoard: Board | null;
    protected selectedPort: Port | null;

    constructor(
        @inject(ILogger)
        @named("monitor-manager-proxy")
        protected readonly logger: ILogger,

        @inject(MonitorManager)
        protected readonly manager: MonitorManager,
    ) {
    }

    dispose(): void {
        // NOOP
    }


    // setMonitorConfig is called by the FE when trying to establish a monitor connection to a board or when changing some
    // settings (such as the baudrate, when available)
    async setMonitorSettings(board: Board, port: Port, settings: MonitorSettings): Promise<void> {

        // check if it's a different connection or a change in the settings
        if (board === this.selectedBoard && port === this.selectedPort) {

            // TODO: update the settings
            return;
        }

        const startStatus: Status = await this.manager.startMonitor(board, port);

        if (startStatus === Status.ALREADY_CONNECTED || startStatus === Status.OK) {
            this.client.notifyWebSocketChanged(this.manager.getWebsocketAddress(board, port));
        }

    }

    setClient(client: MonitorManagerProxyClient | undefined): void {
        if (!client) {
            return;
        }
        this.client = client;

    }

}