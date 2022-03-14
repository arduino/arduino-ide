import { ILogger } from "@theia/core";
import { inject, injectable, named } from "@theia/core/shared/inversify";
import { Board, Port, Status, MonitorSettings } from "../common/protocol";
import { CoreClientAware } from "./core-client-provider";
import { MonitorService } from "./monitor-service";

type MonitorID = string;

export const MonitorManagerName = 'monitor-manager';

@injectable()
export class MonitorManager extends CoreClientAware {
    // Map of monitor services that manage the running pluggable monitors.
    // Each service handles the lifetime of one, and only one, monitor.
    // If either the board or port managed changes a new service must
    // be started.
    private monitorServices = new Map<MonitorID, MonitorService>();

    constructor(
        @inject(ILogger)
        @named(MonitorManagerName)
        protected readonly logger: ILogger,
    ) {
        super();
    }

    /**
     * Used to know if a monitor is started
     * @param board board connected to port
     * @param port port to monitor
     * @returns true if the monitor is currently monitoring the board/port
     * combination specifed, false in all other cases.
     */
    isStarted(board: Board, port: Port): boolean {
        const monitorID = this.monitorID(board, port);
        const monitor = this.monitorServices.get(monitorID);
        if (monitor) {
            return monitor.isStarted();
        }
        return false;
    }

    /**
     * Start a pluggable monitor that receives and sends messages
     * to the specified board and port combination.
     * @param board board connected to port
     * @param port port to monitor
     * @returns a Status object to know if the process has been
     * started or if there have been errors.
     */
    async startMonitor(board: Board, port: Port): Promise<Status> {
        const monitorID = this.monitorID(board, port);
        let monitor = this.monitorServices.get(monitorID);
        if (!monitor) {
            monitor = this.createMonitor(board, port)
        }
        return await monitor.start();
    }

    /**
     * Stop a pluggable monitor connected to the specified board/port
     * combination. It's a noop if monitor is not running.
     * @param board board connected to port
     * @param port port monitored
     */
    async stopMonitor(board: Board, port: Port): Promise<void> {
        const monitorID = this.monitorID(board, port);
        const monitor = this.monitorServices.get(monitorID);
        if (!monitor) {
            // There's no monitor to stop, bail
            return;
        }
        return await monitor.stop();
    }

    /**
     * Returns the port of the WebSocket used by the MonitorService
     * that is handling the board/port combination
     * @param board board connected to port
     * @param port port to monitor
     * @returns port of the MonitorService's WebSocket
     */
    getWebsocketAddressPort(board: Board, port: Port): number {
        const monitorID = this.monitorID(board, port);
        const monitor = this.monitorServices.get(monitorID);
        if (!monitor) {
            return -1;
        }
        return monitor.getWebsocketAddressPort();
    }

    /**
     * Notifies the monitor service of that board/port combination
     * that an upload process started on that exact board/port combination.
     * This must be done so that we can stop the monitor for the time being
     * until the upload process finished.
     * @param board board connected to port
     * @param port port to monitor
     */
    async notifyUploadStarted(board?: Board, port?: Port): Promise<void> {
        if (!board || !port) {
            // We have no way of knowing which monitor
            // to retrieve if we don't have this information.
            return;
        }
        const monitorID = this.monitorID(board, port);
        const monitor = this.monitorServices.get(monitorID);
        if (!monitor) {
            // There's no monitor running there, bail
            return;
        }
        return await monitor.pause();
    }

    /**
     * Notifies the monitor service of that board/port combination
     * that an upload process started on that exact board/port combination.
     * @param board board connected to port
     * @param port port to monitor
     * @returns a Status object to know if the process has been
     * started or if there have been errors.
     */
    async notifyUploadFinished(board?: Board, port?: Port): Promise<Status> {
        if (!board || !port) {
            // We have no way of knowing which monitor
            // to retrieve if we don't have this information.
            return Status.NOT_CONNECTED;
        }
        const monitorID = this.monitorID(board, port);
        const monitor = this.monitorServices.get(monitorID);
        if (!monitor) {
            // There's no monitor running there, bail
            return Status.NOT_CONNECTED;
        }
        return await monitor.start();
    }

    /**
     * Changes the settings of a pluggable monitor even if it's running.
     * If monitor is not running they're going to be used as soon as it's started.
     * @param board board connected to port
     * @param port port to monitor
     * @param settings monitor settings to change
     */
    changeMonitorSettings(board: Board, port: Port, settings: MonitorSettings) {
        const monitorID = this.monitorID(board, port);
        let monitor = this.monitorServices.get(monitorID);
        if (!monitor) {
            monitor = this.createMonitor(board, port)
            monitor.changeSettings(settings);
        }
    }

    /**
     * Returns the settings currently used by the pluggable monitor
     * that's communicating with the specified board/port combination.
     * @param board board connected to port
     * @param port port monitored
     * @returns map of current monitor settings
     */
    currentMonitorSettings(board: Board, port: Port): MonitorSettings {
        const monitorID = this.monitorID(board, port);
        const monitor = this.monitorServices.get(monitorID);
        if (!monitor) {
            return {};
        }
        return monitor.currentSettings();
    }

    /**
     * Creates a MonitorService that handles the lifetime and the
     * communication via WebSocket with the frontend.
     * @param board board connected to specified port
     * @param port port to monitor
     * @returns a new instance of MonitorService ready to use.
     */
    private createMonitor(board: Board, port: Port): MonitorService {
        const monitorID = this.monitorID(board, port);
        const monitor = new MonitorService(
            this.logger,
            board,
            port
        );
        monitor.onDispose((() => {
            this.monitorServices.delete(monitorID);
        }).bind(this));
        return monitor
    }

    /**
     * Utility function to create a unique ID for a monitor service.
     * @param board
     * @param port
     * @returns a unique monitor ID
     */
    private monitorID(board: Board, port: Port): MonitorID {
        return `${board.fqbn}-${port.address}-${port.protocol}`;
    }
}