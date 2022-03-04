import { Emitter, ILogger } from "@theia/core";
import { inject, injectable, named } from "@theia/core/shared/inversify";
import { Board, Port, Status, MonitorSetting, MonitorSettings } from "../common/protocol";
import { EnumerateMonitorPortSettingsRequest, EnumerateMonitorPortSettingsResponse } from "./cli-protocol/cc/arduino/cli/commands/v1/monitor_pb";
import { CoreClientAware } from "./core-client-provider";
import { MonitorService } from "./monitor-service";

type MonitorID = string;

@injectable()
export class MonitorManager extends CoreClientAware {
    // Map of monitor services that manage the running pluggable monitors.
    // Each service handles the lifetime of one, and only one, monitor.
    // If either the board or port managed changes a new service must
    // be started.
    private monitorServices = new Map<MonitorID, MonitorService>();

    // Used to notify a monitor service that an upload process started
    // to the board/port combination it manages
    protected readonly onUploadStartedEmitter = new Emitter<{ board: Board, port: Port }>();
    readonly onUploadStarted = this.onUploadStartedEmitter.event;

    // Used to notify a monitor service that an upload process finished
    // to the board/port combination it manages



    constructor(
        @inject(ILogger)
        @named('monitor-manager')
        protected readonly logger: ILogger,
    ) {
        super();
    }

    /**
     * Returns the possible configurations used to connect a monitor
     * to the board specified by fqbn using the specified protocol
     * @param protocol the protocol of the monitor we want get settings for
     * @param fqbn the fqbn of the board we want to monitor
     * @returns a map of all the settings supported by the monitor
     */
    async portMonitorSettings(protocol: string, fqbn: string): Promise<MonitorSettings> {
        const coreClient = await this.coreClient();
        const { client, instance } = coreClient;
        const req = new EnumerateMonitorPortSettingsRequest();
        req.setInstance(instance);
        req.setPortProtocol(protocol);
        req.setFqbn(fqbn);

        const res = await new Promise<EnumerateMonitorPortSettingsResponse>((resolve, reject) => {
            client.enumerateMonitorPortSettings(req, (err, resp) => {
                if (!!err) {
                    reject(err)
                }
                resolve(resp)
            })
        })

        let settings: MonitorSettings = {};
        for (const iterator of res.getSettingsList()) {
            settings[iterator.getSettingId()] = {
                'id': iterator.getSettingId(),
                'label': iterator.getLabel(),
                'type': iterator.getType(),
                'values': iterator.getEnumValuesList(),
                'selectedValue': iterator.getValue(),
            }
        }
        return settings;
    }

    /**
     *
     * @param board
     * @param port
     */
    async startMonitor(board: Board, port: Port): Promise<Status> {
        const monitorID = this.monitorID(board, port);
        let monitor = this.monitorServices.get(monitorID);
        if (!monitor) {
            monitor = this.createMonitor(board, port)
        }
        return await monitor.start();
        // TODO: I need to return the address here right?
    }

    async stopMonitor(board: Board, port: Port): Promise<void> {
        const monitorID = this.monitorID(board, port);

        const monitor = this.monitorServices.get(monitorID);
        if (!monitor) {
            // There's no monitor to stop, bail
            return;
        }
        return await monitor.stop();
    }

    getWebsocketAddress(board: Board, port: Port): number {
        const monitorID = this.monitorID(board, port);

        const monitor = this.monitorServices.get(monitorID);
        if (!monitor) {
            return -1;
        }
        return monitor.getWebsocketAddress();
    }

    /**
     * Notifies the monitor service of that board/port combination
     * that an upload process started on that exact board/port combination.
     * This must be done so that we can stop the monitor for the time being
     * until the upload process finished.
     * @param board
     * @param port
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
     * @param board
     * @param port
     * @returns
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
     *
     * @param board
     * @param port
     * @param settings map of monitor settings to change
     */
    changeMonitorSettings(board: Board, port: Port, settings: Record<string, MonitorSetting>) {
        const monitorID = this.monitorID(board, port);
        let monitor = this.monitorServices.get(monitorID);
        if (!monitor) {
            monitor = this.createMonitor(board, port)
            monitor.changeSettings(settings);
        }
    }

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