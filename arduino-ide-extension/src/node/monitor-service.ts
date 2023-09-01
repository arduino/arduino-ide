import { ApplicationError } from '@theia/core/lib/common/application-error';
import {
  Disposable,
  DisposableCollection,
} from '@theia/core/lib/common/disposable';
import { Emitter } from '@theia/core/lib/common/event';
import { ILogger } from '@theia/core/lib/common/logger';
import { nls } from '@theia/core/lib/common/nls';
import { deepClone } from '@theia/core/lib/common/objects';
import {
  Deferred,
  retry,
  timeoutReject,
  waitForEvent,
} from '@theia/core/lib/common/promise-util';
import { inject, named, postConstruct } from '@theia/core/shared/inversify';
import {
  Board,
  createAlreadyConnectedError,
  createConnectionFailedError,
  createMissingConfigurationError,
  createNotConnectedError,
  isMonitorConnected,
  Monitor as MonitorNamespace,
  MonitorSettings,
  PluggableMonitorSettings,
  Port,
} from '../common/protocol';
import {
  ArduinoCoreServiceClient,
  EnumerateMonitorPortSettingsRequest,
  MonitorPortConfiguration,
  MonitorPortSetting,
  MonitorRequest,
  Port as RpcPort,
} from './cli-api/';
import { CoreClientAware } from './core-client-provider';
import { createMonitor, Monitor } from './monitor';
import { MonitorServiceFactoryOptions } from './monitor-service-factory';
import { MonitorSettingsProvider } from './monitor-settings/monitor-settings-provider';
import { ServiceError } from './service-error';
import { WebSocketProvider } from './web-socket/web-socket-provider';

export const MonitorServiceName = 'monitor-service';

const MAX_WRITE_TO_STREAM_TRIES = 10;
const WRITE_TO_STREAM_TIMEOUT_MS = 30000;

export class MonitorService extends CoreClientAware implements Disposable {
  @inject(ILogger)
  @named(MonitorServiceName)
  private readonly logger: ILogger;

  @inject(MonitorSettingsProvider)
  private readonly monitorSettingsProvider: MonitorSettingsProvider;

  @inject(WebSocketProvider)
  private readonly webSocketProvider: WebSocketProvider;

  // Bidirectional gRPC stream used to receive and send data from the running
  // pluggable monitor managed by the Arduino CLI.
  private monitor: Monitor | undefined;

  // Settings used by the currently running pluggable monitor.
  // They can be freely modified while running.
  private settings: MonitorSettings = {};

  // List of messages received from the running pluggable monitor.
  // These are flushed from time to time to the frontend.
  private messages: string[] = [];

  // Handles messages received from the frontend via websocket.
  private onMessageReceived?: Disposable;

  // Sends messages to the frontend from time to time.
  private flushMessagesInterval?: NodeJS.Timeout;

  // Triggered each time the number of clients connected
  // to the this service WebSocket changes.
  private onWSClientsNumberChanged?: Disposable;

  // Used to notify that the monitor is being disposed
  private readonly onDisposeEmitter = new Emitter<void>();
  readonly onDispose = this.onDisposeEmitter.event;

  private _initialized = new Deferred<void>();
  private creating: Deferred<void>;
  private readonly board: Board;
  private readonly port: Port;
  private readonly monitorID: string;

  /**
   * The lightweight representation of the port configuration currently in use for the running monitor.
   * IDE2 stores this object after starting the monitor. On every monitor settings change request, IDE2 compares
   * the current config with the new settings, and only sends the diff as the new config to overcome https://github.com/arduino/arduino-ide/issues/375.
   */
  private currentPortConfigSnapshot: MonitorPortConfiguration | undefined;

  constructor(
    @inject(MonitorServiceFactoryOptions) options: MonitorServiceFactoryOptions
  ) {
    super();
    this.board = options.board;
    this.port = options.port;
    this.monitorID = options.monitorID;
  }

  @postConstruct()
  protected init(): void {
    this.onWSClientsNumberChanged =
      this.webSocketProvider.onClientsNumberChanged(async (clients: number) => {
        if (clients === 0) {
          // There are no more clients that want to receive
          // data from this monitor, we can freely close
          // and dispose it.
          this.dispose();
          return;
        }
        this.updateClientsSettings(this.settings);
      });

    this.portMonitorSettings(this.port.protocol, this.board.fqbn!, true).then(
      async (settings) => {
        this.settings = {
          ...this.settings,
          pluggableMonitorSettings:
            await this.monitorSettingsProvider.getSettings(
              this.monitorID,
              settings
            ),
        };
        this._initialized.resolve();
      }
    );
  }

  get initialized(): Promise<void> {
    return this._initialized.promise;
  }

  getWebsocketAddressPort(): number {
    return this.webSocketProvider.getAddress().port;
  }

  dispose(): void {
    this.stop();
    this.onDisposeEmitter.fire();
    this.onWSClientsNumberChanged?.dispose();
  }

  /**
   * isStarted is used to know if the currently running pluggable monitor is started.
   * @returns true if pluggable monitor communication duplex is open,
   * false in all other cases.
   */
  isStarted(): boolean {
    return !!this.monitor;
  }

  /**
   * Start and connects a monitor using currently set board and port.
   * If a monitor is already started, the promise will reject with an `AlreadyConnectedError`.
   * If the board fqbn, port address and/or protocol are missing, the promise rejects with a `MissingConfigurationError`.
   */
  async start(): Promise<void> {
    if (this.creating?.state === 'unresolved') return this.creating.promise;
    this.creating = new Deferred();
    if (this.monitor) {
      this.updateClientsSettings({
        monitorUISettings: {
          connectionStatus: 'connected',
          connected: true, // TODO: should be removed when plotter app understand the `connectionStatus` message
          serialPort: this.port.address,
        },
      });
      this.creating.reject(createAlreadyConnectedError(this.port));
      return this.creating.promise;
    }

    if (!this.board?.fqbn || !this.port?.address || !this.port?.protocol) {
      this.updateClientsSettings({
        monitorUISettings: {
          connectionStatus: 'not-connected',
          connected: false, // TODO: should be removed when plotter app understand the `connectionStatus` message
        },
      });

      this.creating.reject(createMissingConfigurationError(this.port));
      return this.creating.promise;
    }

    this.logger.info('starting monitor');

    try {
      // get default monitor settings from the CLI
      const defaultSettings = await this.portMonitorSettings(
        this.port.protocol,
        this.board.fqbn
      );

      this.updateClientsSettings({
        monitorUISettings: { connectionStatus: 'connecting' },
      });

      // get actual settings from the settings provider
      this.settings = {
        ...this.settings,
        pluggableMonitorSettings: {
          ...this.settings.pluggableMonitorSettings,
          ...(await this.monitorSettingsProvider.getSettings(
            this.monitorID,
            defaultSettings
          )),
        },
      };

      const coreClient = await this.coreClient;
      const { client, instance } = coreClient;

      const monitorRequest = MonitorRequest.fromPartial({ instance });
      if (this.board?.fqbn) {
        monitorRequest.fqbn = this.board.fqbn;
      }
      if (this.port?.address && this.port?.protocol) {
        monitorRequest.port = RpcPort.fromPartial({
          address: this.port.address,
          protocol: this.port.protocol,
        });
      }
      const config = MonitorPortConfiguration.create();
      for (const id in this.settings.pluggableMonitorSettings) {
        const s = MonitorPortSetting.create();
        s.settingId = id;
        s.value = this.settings.pluggableMonitorSettings[id].selectedValue;
        config.settings.push(s);
      }
      monitorRequest.portConfiguration = config;
      this.monitor = await this.tryStartMonitor(client, monitorRequest);
      const toDisposeOnMonitorDidComplete = new DisposableCollection();
      toDisposeOnMonitorDidComplete.pushAll([
        this.monitor.onDidReceiveMessage((message) =>
          this.messages.push(message)
        ),
        this.monitor.onDidComplete(() =>
          toDisposeOnMonitorDidComplete.dispose()
        ),
      ]);

      // Only store the config, if the monitor has successfully started.
      this.currentPortConfigSnapshot = deepClone(config);
      this.logger.info(
        `Using port configuration for ${this.port.protocol}:${
          this.port.address
        }: ${JSON.stringify(this.currentPortConfigSnapshot)}`
      );
      this.startMessagesHandlers();
      this.logger.info(
        `started monitor to ${this.port?.address} using ${this.port?.protocol}`
      );
      this.updateClientsSettings({
        monitorUISettings: {
          connectionStatus: 'connected',
          connected: true, // TODO: should be removed when plotter app understand the `connectionStatus` message
          serialPort: this.port.address,
        },
      });
      this.creating.resolve();
      return this.creating.promise;
    } catch (err) {
      this.logger.warn(
        `failed starting monitor to ${this.port?.address} using ${this.port?.protocol}`
      );
      const appError = ApplicationError.is(err)
        ? err
        : createConnectionFailedError(
            this.port,
            ServiceError.is(err)
              ? err.details
              : err instanceof Error
              ? err.message
              : String(err)
          );
      this.creating.reject(appError);
      this.updateClientsSettings({
        monitorUISettings: {
          connectionStatus: { errorMessage: appError.message },
        },
      });
      return this.creating.promise;
    }
  }

  private async tryStartMonitor(
    client: ArduinoCoreServiceClient,
    req: MonitorRequest
  ): Promise<Monitor> {
    return Promise.race([
      retry(
        async () => {
          let monitor: Monitor | undefined = undefined;
          try {
            monitor = createMonitor(client, req);
            await waitForEvent(monitor.onDidStart, 2_000);
            return monitor;
          } catch (err) {
            monitor?.dispose();
            throw err;
          }
        },
        2_000,
        MAX_WRITE_TO_STREAM_TRIES
      ),
      timeoutReject<never>(
        WRITE_TO_STREAM_TIMEOUT_MS,
        nls.localize(
          'arduino/monitor/connectionTimeout',
          "Timeout. The IDE has not received the 'success' message from the monitor after successfully connecting to it"
        )
      ),
    ]);
  }

  /**
   * Pauses the currently running monitor, it still closes the gRPC connection
   * with the underlying monitor process but it doesn't stop the message handlers
   * currently running.
   * This is mainly used to handle upload with the board/port combination
   * the monitor is listening to.
   * @returns
   */
  async pause(): Promise<void> {
    return new Promise(async (resolve) => {
      if (!this.monitor) {
        this.logger.warn(
          `monitor to ${this.port?.address} using ${this.port?.protocol} already stopped`
        );
        return resolve();
      }
      // It's enough to close the connection with the client
      // to stop the monitor process
      this.monitor.dispose();
      this.monitor = undefined;
      this.logger.info(
        `stopped monitor to ${this.port?.address} using ${this.port?.protocol}`
      );
    });
  }

  /**
   * Stop the monitor currently running
   */
  async stop(): Promise<void> {
    return this.pause().finally(this.stopMessagesHandlers.bind(this));
  }

  /**
   * Send a message to the running monitor, a well behaved monitor
   * will then send that message to the board.
   * We MUST NEVER send a message that wasn't a user's input to the board.
   * @param message string sent to running monitor
   * @returns a status to verify message has been sent.
   */
  async send(message: string): Promise<void> {
    if (!this.monitor) {
      throw createNotConnectedError(this.port);
    }
    this.monitor.sendMessage(message);
  }

  /**
   *
   * @returns map of current monitor settings
   */
  async currentSettings(): Promise<MonitorSettings> {
    await this.initialized;
    return this.settings;
  }

  // TODO: move this into MonitorSettingsProvider
  /**
   * Returns the possible configurations used to connect a monitor
   * to the board specified by fqbn using the specified protocol
   * @param protocol the protocol of the monitor we want get settings for
   * @param fqbn the fqbn of the board we want to monitor
   * @returns a map of all the settings supported by the monitor
   */
  private async portMonitorSettings(
    protocol: string,
    fqbn: string,
    swallowsPlatformNotFoundError = false
  ): Promise<PluggableMonitorSettings> {
    const coreClient = await this.coreClient;
    const { client, instance } = coreClient;
    const req = EnumerateMonitorPortSettingsRequest.fromPartial({
      instance,
      portProtocol: protocol,
      fqbn,
    });

    try {
      const { settings } = await client.enumerateMonitorPortSettings(req);
      const result: PluggableMonitorSettings = {};
      for (const iterator of settings) {
        result[iterator.settingId] = {
          id: iterator.settingId,
          label: iterator.label,
          type: iterator.type,
          values: iterator.enumValues,
          selectedValue: iterator.value,
        };
      }
      return result;
    } catch (err) {
      // Check whether the platform is installed: https://github.com/arduino/arduino-ide/issues/1974.
      // No error codes. Look for `Unknown FQBN: platform arduino:mbed_nano is not installed` message similarities: https://github.com/arduino/arduino-cli/issues/1762.
      if (
        swallowsPlatformNotFoundError &&
        ServiceError.is(err) &&
        err.code === 5 &&
        err.details.includes('FQBN') &&
        err.details.includes(fqbn.split(':', 2).join(':')) // create a platform ID from the FQBN
      ) {
        return {};
      }
      throw err;
    }
  }

  /**
   * Set monitor settings, if there is a running monitor they'll be sent
   * to it, otherwise they'll be used when starting one.
   * Only values in settings parameter will be change, other values won't
   * be changed in any way.
   * @param settings map of monitor settings to change
   * @returns a status to verify settings have been sent.
   */
  async changeSettings(settings: MonitorSettings): Promise<void> {
    const config = MonitorPortConfiguration.create();
    const { pluggableMonitorSettings } = settings;
    const reconciledSettings = await this.monitorSettingsProvider.setSettings(
      this.monitorID,
      pluggableMonitorSettings || {}
    );

    if (reconciledSettings) {
      for (const id in reconciledSettings) {
        const s = MonitorPortSetting.create();
        s.settingId = id;
        s.value = reconciledSettings[id].selectedValue;
        config.settings.push(s);
      }
    }

    const connectionStatus = Boolean(this.monitor)
      ? 'connected'
      : 'not-connected';
    this.updateClientsSettings({
      monitorUISettings: {
        ...settings.monitorUISettings,
        connectionStatus,
        serialPort: this.port.address,
        connected: isMonitorConnected(connectionStatus), // TODO: should be removed when plotter app understand the `connectionStatus` message
      },
      pluggableMonitorSettings: reconciledSettings,
    });

    if (!this.monitor) {
      // instead of throwing an error, return silently like the original logic
      // https://github.com/arduino/arduino-ide/blob/9b49712669b06c97bda68a1e5f04eee4664c13f8/arduino-ide-extension/src/node/monitor-service.ts#L540
      return;
    }

    const diffConfig = await this.maybeUpdatePortConfigSnapshot(config);
    if (!diffConfig) {
      this.logger.info(
        `No port configuration changes have been detected. No need to send configure commands to the running monitor ${this.port.protocol}:${this.port.address}.`
      );
      return;
    }

    this.logger.info(
      `Sending monitor request with new port configuration: ${JSON.stringify(
        diffConfig
      )}`
    );
    this.monitor.updateConfiguration(diffConfig);
  }

  /**
   * Function to calculate a diff between the `otherPortConfig` argument and the `currentPortConfigSnapshot`.
   *
   * If the current config snapshot and the snapshot derived from `otherPortConfig` are the same, no snapshot update happens,
   * and the function returns with undefined. Otherwise, the current snapshot config value will be updated from the snapshot
   * derived from the `otherPortConfig` argument, and this function returns with a `MonitorPortConfiguration` instance
   * representing only the difference between the two snapshot configs to avoid sending unnecessary monitor to configure commands to the CLI.
   * See [#1703 (comment)](https://github.com/arduino/arduino-ide/pull/1703#issuecomment-1327913005) for more details.
   */
  private async maybeUpdatePortConfigSnapshot(
    otherPortConfig: MonitorPortConfiguration
  ): Promise<MonitorPortConfiguration | undefined> {
    const otherPortConfigSnapshot = deepClone(otherPortConfig);
    if (!this.currentPortConfigSnapshot) {
      throw new Error(
        `The current port configuration object was undefined when tried to merge in ${JSON.stringify(
          otherPortConfigSnapshot
        )}.`
      );
    }

    const justDiff = await import('just-diff');
    const snapshotDiff = justDiff.diff(
      this.currentPortConfigSnapshot,
      otherPortConfigSnapshot
    );
    if (!snapshotDiff.length) {
      return undefined;
    }

    const diffConfig = snapshotDiff.reduce((acc, curr) => {
      if (!this.isValidMonitorPortSettingChange(curr)) {
        throw new Error(
          `Expected only 'replace' operation: a 'value' change in the 'settingsList'. Calculated diff a ${JSON.stringify(
            snapshotDiff
          )} between ${JSON.stringify(
            this.currentPortConfigSnapshot
          )} and ${JSON.stringify(
            otherPortConfigSnapshot
          )} snapshots. Current JSON-patch entry was ${JSON.stringify(curr)}.`
        );
      }
      const { path, value } = curr;
      const [, index] = path;
      if (!this.currentPortConfigSnapshot?.settings) {
        throw new Error(
          `'settingsList' is missing from current port config snapshot: ${JSON.stringify(
            this.currentPortConfigSnapshot
          )}`
        );
      }
      const changedSetting = this.currentPortConfigSnapshot.settings[index];
      const setting = MonitorPortSetting.create();
      setting.value = value;
      setting.settingId = changedSetting.settingId;
      acc.settings.push(setting);
      return acc;
    }, MonitorPortConfiguration.create());

    this.currentPortConfigSnapshot = otherPortConfigSnapshot;
    this.logger.info(
      `Updated the port configuration for ${this.port.protocol}:${
        this.port.address
      }: ${JSON.stringify(this.currentPortConfigSnapshot)}`
    );
    return diffConfig;
  }

  private isValidMonitorPortSettingChange(entry: {
    op: string;
    path: (string | number)[];
    value: unknown;
  }): entry is {
    op: 'replace';
    path: ['settingsList', number, string];
    value: string;
  } {
    const { op, path, value } = entry;
    return (
      op === 'replace' &&
      path.length === 3 &&
      path[0] === 'settingsList' &&
      typeof path[1] === 'number' &&
      path[2] === 'value' &&
      typeof value === 'string'
    );
  }

  /**
   * Starts the necessary handlers to send and receive
   * messages to and from the frontend and the running monitor
   */
  private startMessagesHandlers(): void {
    if (!this.flushMessagesInterval) {
      const flushMessagesToFrontend = () => {
        if (this.messages.length) {
          this.webSocketProvider.sendMessage(JSON.stringify(this.messages));
          this.messages = [];
        }
      };
      this.flushMessagesInterval = setInterval(flushMessagesToFrontend, 32);
    }

    if (!this.onMessageReceived) {
      this.onMessageReceived = this.webSocketProvider.onMessageReceived(
        (msg: string) => {
          const message: MonitorNamespace.Message = JSON.parse(msg);

          switch (message.command) {
            case MonitorNamespace.ClientCommand.SEND_MESSAGE:
              this.send(message.data as string);
              break;
            case MonitorNamespace.ClientCommand.CHANGE_SETTINGS:
              this.changeSettings(message.data as MonitorSettings);
              break;
          }
        }
      );
    }
  }

  updateClientsSettings(settings: MonitorSettings): void {
    this.settings = { ...this.settings, ...settings };
    if (
      settings.monitorUISettings?.connectionStatus &&
      !('connected' in settings.monitorUISettings)
    ) {
      // Make sure the deprecated `connected` prop is set.
      settings.monitorUISettings.connected = isMonitorConnected(
        settings.monitorUISettings.connectionStatus
      );
    }
    if (
      typeof settings.monitorUISettings?.connected === 'boolean' &&
      !('connectionStatus' in settings.monitorUISettings)
    ) {
      // Set the connectionStatus if the message was sent by the plotter which does not handle the new protocol. Assuming that the plotter can send anything.
      // https://github.com/arduino/arduino-serial-plotter-webapp#monitor-settings
      settings.monitorUISettings.connectionStatus = settings.monitorUISettings
        .connected
        ? 'connected'
        : 'not-connected';
    }
    const command: MonitorNamespace.Message = {
      command: MonitorNamespace.MiddlewareCommand.ON_SETTINGS_DID_CHANGE,
      data: settings,
    };

    this.webSocketProvider.sendMessage(JSON.stringify(command));
  }

  /**
   * Stops the necessary handlers to send and receive messages to
   * and from the frontend and the running monitor
   */
  private stopMessagesHandlers(): void {
    if (this.flushMessagesInterval) {
      clearInterval(this.flushMessagesInterval);
      this.flushMessagesInterval = undefined;
    }
    if (this.onMessageReceived) {
      this.onMessageReceived.dispose();
      this.onMessageReceived = undefined;
    }
  }
}

/**
 * Splits a string into an array without removing newline char.
 * @param s string to split into lines
 * @returns an lines array
 */
// function splitLines(s: string): string[] {
//   return s.split(/(?<=\n)/);
// }
