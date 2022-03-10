import { ILogger } from "@theia/core";
import { inject, injectable, named } from "@theia/core/shared/inversify";
import { MonitorManagerProxy, MonitorManagerProxyClient, MonitorSettings, Status } from "../common/protocol";
import { Board, Port } from "../common/protocol";
import { MonitorManager } from "./monitor-manager";

@injectable()
export class MonitorManagerProxyImpl implements MonitorManagerProxy {
    protected client: MonitorManagerProxyClient;

    constructor(
        @inject(ILogger)
        @named("monitor-manager-proxy")
        protected readonly logger: ILogger,

        @inject(MonitorManager)
        protected readonly manager: MonitorManager,
    ) {
    }

    dispose(): void {
        this.client?.disconnect();
    }

    /**
     * Start a pluggable monitor and/or change its settings.
     * If settings are defined they'll be set before starting the monitor,
     * otherwise default ones will be used by the monitor.
     * @param board board connected to port
     * @param port port to monitor
     * @param settings map of supported configuration by the monitor
     */
    async startMonitor(board: Board, port: Port, settings?: MonitorSettings): Promise<void> {
        if (settings) {
            await this.changeMonitorSettings(board, port, settings);
        }
        const status = await this.manager.startMonitor(board, port);
        if (status === Status.ALREADY_CONNECTED || status === Status.OK) {
            // Monitor started correctly, connect it with the frontend
            this.client.connect(this.manager.getWebsocketAddressPort(board, port));
        }
    }

    /**
     * Changes the settings of a running pluggable monitor, if that monitor is not
     * started this function is a noop.
     * @param board board connected to port
     * @param port port monitored
     * @param settings map of supported configuration by the monitor
     */
    async changeMonitorSettings(board: Board, port: Port, settings: MonitorSettings): Promise<void> {
        if (!this.manager.isStarted(board, port)) {
            // Monitor is not running, no need to change settings
            return;
        }
        return this.manager.changeMonitorSettings(board, port, settings);
    }

    /**
     * Stops a running pluggable monitor.
     * @param board board connected to port
     * @param port port monitored
     */
    async stopMonitor(board: Board, port: Port): Promise<void> {
        return this.manager.stopMonitor(board, port);
    }

    /**
     * Returns the current settings by the pluggable monitor connected to specified
     * by board/port combination.
     * @param board board connected to port
     * @param port port monitored
     * @returns a map of MonitorSetting
     */
    getCurrentSettings(board: Board, port: Port): MonitorSettings {
        return this.manager.currentMonitorSettings(board, port);
    }

    setClient(client: MonitorManagerProxyClient | undefined): void {
        if (!client) {
            return;
        }
        this.client = client;
    }
}