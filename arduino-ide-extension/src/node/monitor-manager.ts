import { ILogger } from '@theia/core';
import { inject, injectable, named } from '@theia/core/shared/inversify';
import {
  AlreadyConnectedError,
  Board,
  BoardsService,
  Port,
} from '../common/protocol';
import { CoreClientAware } from './core-client-provider';
import { MonitorService } from './monitor-service';
import { MonitorServiceFactory } from './monitor-service-factory';
import {
  MonitorSettings,
  PluggableMonitorSettings,
} from './monitor-settings/monitor-settings-provider';

type MonitorID = string;

type UploadState = 'uploadInProgress' | 'pausedForUpload' | 'disposedForUpload';
type MonitorIDsByUploadState = Record<UploadState, MonitorID[]>;

export const MonitorManagerName = 'monitor-manager';

@injectable()
export class MonitorManager extends CoreClientAware {
  @inject(BoardsService)
  protected boardsService: BoardsService;

  // Map of monitor services that manage the running pluggable monitors.
  // Each service handles the lifetime of one, and only one, monitor.
  // If either the board or port managed changes, a new service must
  // be started.
  private monitorServices = new Map<MonitorID, MonitorService>();

  private monitorIDsByUploadState: MonitorIDsByUploadState = {
    uploadInProgress: [],
    pausedForUpload: [],
    disposedForUpload: [],
  };

  private monitorServiceStartQueue: {
    monitorID: string;
    serviceStartParams: [Board, Port];
    connectToClient: () => Promise<void>;
  }[] = [];

  @inject(MonitorServiceFactory)
  private monitorServiceFactory: MonitorServiceFactory;

  constructor(
    @inject(ILogger)
    @named(MonitorManagerName)
    protected readonly logger: ILogger
  ) {
    super();
  }

  /**
   * Used to know if a monitor is started
   * @param board board connected to port
   * @param port port to monitor
   * @returns true if the monitor is currently monitoring the board/port
   * combination specified, false in all other cases.
   */
  isStarted(board: Board, port: Port): boolean {
    const monitorID = this.monitorID(board.fqbn, port);
    const monitor = this.monitorServices.get(monitorID);
    if (monitor) {
      return monitor.isStarted();
    }
    return false;
  }

  private uploadIsInProgress(): boolean {
    return this.monitorIDsByUploadState.uploadInProgress.length > 0;
  }

  private addToMonitorIDsByUploadState(
    state: UploadState,
    monitorID: string
  ): void {
    this.monitorIDsByUploadState[state].push(monitorID);
  }

  private removeFromMonitorIDsByUploadState(
    state: UploadState,
    monitorID: string
  ): void {
    this.monitorIDsByUploadState[state] = this.monitorIDsByUploadState[
      state
    ].filter((id) => id !== monitorID);
  }

  private monitorIDIsInUploadState(
    state: UploadState,
    monitorID: string
  ): boolean {
    return this.monitorIDsByUploadState[state].includes(monitorID);
  }

  /**
   * Start a pluggable monitor that receives and sends messages
   * to the specified board and port combination.
   * @param board board connected to port
   * @param port port to monitor
   * @returns a Status object to know if the process has been
   * started or if there have been errors.
   */
  async startMonitor(
    board: Board,
    port: Port,
    connectToClient: () => Promise<void>
  ): Promise<void> {
    const monitorID = this.monitorID(board.fqbn, port);

    let monitor = this.monitorServices.get(monitorID);
    if (!monitor) {
      monitor = this.createMonitor(board, port);
    }

    if (this.uploadIsInProgress()) {
      this.monitorServiceStartQueue = this.monitorServiceStartQueue.filter(
        (request) => request.monitorID !== monitorID
      );

      this.monitorServiceStartQueue.push({
        monitorID,
        serviceStartParams: [board, port],
        connectToClient,
      });

      return;
    }

    try {
      await connectToClient();
      await monitor.start();
    } catch (err) {
      if (!AlreadyConnectedError.is(err)) {
        throw err;
      }
    }
  }

  /**
   * Stop a pluggable monitor connected to the specified board/port
   * combination. It's a noop if monitor is not running.
   * @param board board connected to port
   * @param port port monitored
   */
  async stopMonitor(board: Board, port: Port): Promise<void> {
    const monitorID = this.monitorID(board.fqbn, port);
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
    const monitorID = this.monitorID(board.fqbn, port);
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
   * @param fqbn the FQBN of the board connected to port
   * @param port port to monitor
   */
  async notifyUploadStarted(fqbn?: string, port?: Port): Promise<void> {
    if (!fqbn || !port) {
      // We have no way of knowing which monitor
      // to retrieve if we don't have this information.
      return;
    }

    const monitorID = this.monitorID(fqbn, port);
    this.addToMonitorIDsByUploadState('uploadInProgress', monitorID);

    const monitor = this.monitorServices.get(monitorID);
    if (!monitor) {
      // There's no monitor running there, bail
      return;
    }

    this.addToMonitorIDsByUploadState('pausedForUpload', monitorID);
    return monitor.pause();
  }

  /**
   * Notifies the monitor service of that board/port combination
   * that an upload process started on that exact board/port combination.
   * @param fqbn the FQBN of the board connected to port
   * @param port port to monitor
   * @returns a Status object to know if the process has been
   * started or if there have been errors.
   */
  async notifyUploadFinished(
    fqbn?: string | undefined,
    port?: Port
  ): Promise<void> {
    let portDidChangeOnUpload = false;

    // We have no way of knowing which monitor
    // to retrieve if we don't have this information.
    if (fqbn && port) {
      const monitorID = this.monitorID(fqbn, port);
      this.removeFromMonitorIDsByUploadState('uploadInProgress', monitorID);

      const monitor = this.monitorServices.get(monitorID);
      if (monitor) {
        await monitor.start();
      }

      // this monitorID will only be present in "disposedForUpload"
      // if the upload changed the board port
      portDidChangeOnUpload = this.monitorIDIsInUploadState(
        'disposedForUpload',
        monitorID
      );
      if (portDidChangeOnUpload) {
        this.removeFromMonitorIDsByUploadState('disposedForUpload', monitorID);
      }

      // in case a service was paused but not disposed
      this.removeFromMonitorIDsByUploadState('pausedForUpload', monitorID);
    }

    await this.startQueuedServices(portDidChangeOnUpload);
  }

  async startQueuedServices(portDidChangeOnUpload: boolean): Promise<void> {
    // if the port changed during upload with the monitor open, "startMonitorPendingRequests"
    // will include a request for our "upload port', most likely at index 0.
    // We remove it, as this port was to be used exclusively for the upload
    const queued = portDidChangeOnUpload
      ? this.monitorServiceStartQueue.slice(1)
      : this.monitorServiceStartQueue;
    this.monitorServiceStartQueue = [];

    for (const {
      monitorID,
      serviceStartParams: [, port],
      connectToClient,
    } of queued) {
      const boardsState = await this.boardsService.getState();
      const boardIsStillOnPort = Object.keys(boardsState)
        .map((connection: string) => {
          const portAddress = connection.split('|')[0];
          return portAddress;
        })
        .some((portAddress: string) => port.address === portAddress);

      if (boardIsStillOnPort) {
        const monitorService = this.monitorServices.get(monitorID);

        if (monitorService) {
          await connectToClient();
          await monitorService.start();
        }
      }
    }
  }

  /**
   * Changes the settings of a pluggable monitor even if it's running.
   * If monitor is not running they're going to be used as soon as it's started.
   * @param board board connected to port
   * @param port port to monitor
   * @param settings monitor settings to change
   */
  changeMonitorSettings(
    board: Board,
    port: Port,
    settings: PluggableMonitorSettings
  ) {
    const monitorID = this.monitorID(board.fqbn, port);
    let monitor = this.monitorServices.get(monitorID);
    if (!monitor) {
      monitor = this.createMonitor(board, port);
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
  async currentMonitorSettings(
    board: Board,
    port: Port
  ): Promise<MonitorSettings> {
    const monitorID = this.monitorID(board.fqbn, port);
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
    const monitorID = this.monitorID(board.fqbn, port);
    const monitor = this.monitorServiceFactory({
      board,
      port,
      monitorID,
    });
    this.monitorServices.set(monitorID, monitor);
    monitor.onDispose(
      (() => {
        // if a service is disposed during upload and
        // we paused it beforehand we know it was disposed
        // of because the upload changed the board port
        if (
          this.uploadIsInProgress() &&
          this.monitorIDIsInUploadState('pausedForUpload', monitorID)
        ) {
          this.removeFromMonitorIDsByUploadState('pausedForUpload', monitorID);

          this.addToMonitorIDsByUploadState('disposedForUpload', monitorID);
        }

        this.monitorServices.delete(monitorID);
      }).bind(this)
    );
    return monitor;
  }

  /**
   * Utility function to create a unique ID for a monitor service.
   * @param fqbn
   * @param port
   * @returns a unique monitor ID
   */
  private monitorID(fqbn: string | undefined, port: Port): MonitorID {
    const splitFqbn = fqbn?.split(':') || [];
    const shortenedFqbn = splitFqbn.slice(0, 3).join(':') || '';
    return `${shortenedFqbn}-${port.address}-${port.protocol}`;
  }
}
