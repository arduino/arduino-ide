import { ClientDuplexStream, status } from '@grpc/grpc-js';
import {
  ApplicationError,
  Disposable,
  Emitter,
  ILogger,
  nls,
} from '@theia/core';
import { inject, named, postConstruct } from '@theia/core/shared/inversify';
import { diff, Operation } from 'just-diff';
import {
  Board,
  Port,
  Monitor,
  createAlreadyConnectedError,
  createMissingConfigurationError,
  createNotConnectedError,
  createConnectionFailedError,
  isMonitorConnected,
} from '../common/protocol';
import {
  EnumerateMonitorPortSettingsRequest,
  EnumerateMonitorPortSettingsResponse,
  MonitorPortConfiguration,
  MonitorPortSetting,
  MonitorRequest,
  MonitorResponse,
} from './cli-protocol/cc/arduino/cli/commands/v1/monitor_pb';
import { CoreClientAware } from './core-client-provider';
import { WebSocketProvider } from './web-socket/web-socket-provider';
import { Port as RpcPort } from './cli-protocol/cc/arduino/cli/commands/v1/port_pb';
import {
  MonitorSettings,
  PluggableMonitorSettings,
  MonitorSettingsProvider,
} from './monitor-settings/monitor-settings-provider';
import {
  Deferred,
  retry,
  timeoutReject,
} from '@theia/core/lib/common/promise-util';
import { MonitorServiceFactoryOptions } from './monitor-service-factory';
import { ServiceError } from './service-error';

export const MonitorServiceName = 'monitor-service';
type DuplexHandlerKeys =
  | 'close'
  | 'end'
  | 'error'
  | 'data'
  | 'status'
  | 'metadata';
interface DuplexHandler {
  key: DuplexHandlerKeys;
  callback: (...args: any) => void;
}

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
  private duplex: ClientDuplexStream<MonitorRequest, MonitorResponse> | null;

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
  private readonly streamingTextDecoder = new TextDecoder('utf8');

  /**
   * The lightweight representation of the port configuration currently in use for the running monitor.
   * IDE2 stores this object after starting the monitor. On every monitor settings change request, IDE2 compares
   * the current config with the new settings, and only sends the diff as the new config to overcome https://github.com/arduino/arduino-ide/issues/375.
   */
  private currentPortConfigSnapshot:
    | MonitorPortConfiguration.AsObject
    | undefined;

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
    return !!this.duplex;
  }

  /**
   * Start and connects a monitor using currently set board and port.
   * If a monitor is already started, the promise will reject with an `AlreadyConnectedError`.
   * If the board fqbn, port address and/or protocol are missing, the promise rejects with a `MissingConfigurationError`.
   */
  async start(): Promise<void> {
    if (this.creating?.state === 'unresolved') return this.creating.promise;
    this.creating = new Deferred();
    if (this.duplex) {
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

      const { instance } = coreClient;
      const monitorRequest = new MonitorRequest();
      monitorRequest.setInstance(instance);
      if (this.board?.fqbn) {
        monitorRequest.setFqbn(this.board.fqbn);
      }
      if (this.port?.address && this.port?.protocol) {
        const rpcPort = new RpcPort();
        rpcPort.setAddress(this.port.address);
        rpcPort.setProtocol(this.port.protocol);
        monitorRequest.setPort(rpcPort);
      }
      const config = new MonitorPortConfiguration();
      for (const id in this.settings.pluggableMonitorSettings) {
        const s = new MonitorPortSetting();
        s.setSettingId(id);
        s.setValue(this.settings.pluggableMonitorSettings[id].selectedValue);
        config.addSettings(s);
      }
      monitorRequest.setPortConfiguration(config);

      await this.pollWriteToStream(monitorRequest);
      // Only store the config, if the monitor has successfully started.
      this.currentPortConfigSnapshot = MonitorPortConfiguration.toObject(
        false,
        config
      );
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

  async createDuplex(): Promise<
    ClientDuplexStream<MonitorRequest, MonitorResponse>
  > {
    const coreClient = await this.coreClient;
    return coreClient.client.monitor();
  }

  setDuplexHandlers(
    duplex: ClientDuplexStream<MonitorRequest, MonitorResponse>,
    additionalHandlers: DuplexHandler[]
  ): void {
    // default handlers
    duplex
      .on('close', () => {
        if (duplex === this.duplex) {
          this.duplex = null;
          this.updateClientsSettings({
            monitorUISettings: {
              connected: false, // TODO: should be removed when plotter app understand the `connectionStatus` message
              connectionStatus: 'not-connected',
            },
          });
        }
        this.logger.info(
          `monitor to ${this.port?.address} using ${this.port?.protocol} closed by client`
        );
      })
      .on('end', () => {
        if (duplex === this.duplex) {
          this.duplex = null;
          this.updateClientsSettings({
            monitorUISettings: {
              connected: false, // TODO: should be removed when plotter app understand the `connectionStatus` message
              connectionStatus: 'not-connected',
            },
          });
        }
        this.logger.info(
          `monitor to ${this.port?.address} using ${this.port?.protocol} closed by server`
        );
      });

    for (const handler of additionalHandlers) {
      duplex.on(handler.key, handler.callback);
    }
  }

  pollWriteToStream(request: MonitorRequest): Promise<void> {
    const createWriteToStreamExecutor =
      (duplex: ClientDuplexStream<MonitorRequest, MonitorResponse>) =>
      (resolve: () => void, reject: (reason?: unknown) => void) => {
        const resolvingDuplexHandlers: DuplexHandler[] = [
          {
            key: 'error',
            callback: async (err: Error) => {
              this.logger.error(err);
              const details = ServiceError.is(err) ? err.details : err.message;
              reject(createConnectionFailedError(this.port, details));
            },
          },
          {
            key: 'data',
            callback: async (monitorResponse: MonitorResponse) => {
              if (monitorResponse.getError()) {
                // TODO: Maybe disconnect
                this.logger.error(monitorResponse.getError());
                return;
              }
              if (monitorResponse.getSuccess()) {
                resolve();
                return;
              }
              const data = monitorResponse.getRxData();
              const message =
                typeof data === 'string'
                  ? data
                  : this.streamingTextDecoder.decode(data, { stream: true });
              this.messages.push(...splitLines(message));
            },
          },
        ];

        this.setDuplexHandlers(duplex, resolvingDuplexHandlers);
        duplex.write(request);
      };

    return Promise.race([
      retry(
        async () => {
          let createdDuplex = undefined;
          try {
            createdDuplex = await this.createDuplex();
            await new Promise<void>(createWriteToStreamExecutor(createdDuplex));
            this.duplex = createdDuplex;
          } catch (err) {
            createdDuplex?.end();
            throw err;
          }
        },
        2_000,
        MAX_WRITE_TO_STREAM_TRIES
      ),
      timeoutReject(
        WRITE_TO_STREAM_TIMEOUT_MS,
        nls.localize(
          'arduino/monitor/connectionTimeout',
          "Timeout. The IDE has not received the 'success' message from the monitor after successfully connecting to it"
        )
      ),
    ]) as Promise<unknown> as Promise<void>;
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
      if (!this.duplex) {
        this.logger.warn(
          `monitor to ${this.port?.address} using ${this.port?.protocol} already stopped`
        );
        return resolve();
      }
      // It's enough to close the connection with the client
      // to stop the monitor process
      this.duplex.end();
      this.logger.info(
        `stopped monitor to ${this.port?.address} using ${this.port?.protocol}`
      );

      this.duplex.on('end', resolve);
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
    if (!this.duplex) {
      throw createNotConnectedError(this.port);
    }
    const coreClient = await this.coreClient;
    const { instance } = coreClient;

    const req = new MonitorRequest();
    req.setInstance(instance);
    req.setTxData(new TextEncoder().encode(message));
    return new Promise<void>((resolve, reject) => {
      if (this.duplex) {
        this.duplex?.write(req, resolve);
        return;
      }
      this.stop().then(() => reject(createNotConnectedError(this.port)));
    });
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
    const req = new EnumerateMonitorPortSettingsRequest();
    req.setInstance(instance);
    req.setPortProtocol(protocol);
    req.setFqbn(fqbn);

    const resp = await new Promise<
      EnumerateMonitorPortSettingsResponse | undefined
    >((resolve, reject) => {
      client.enumerateMonitorPortSettings(req, async (err, resp) => {
        if (err) {
          // Check whether the platform is installed: https://github.com/arduino/arduino-ide/issues/1974.
          // No error codes. Look for `Unknown FQBN: platform arduino:mbed_nano is not installed` message similarities: https://github.com/arduino/arduino-cli/issues/1762.
          if (
            swallowsPlatformNotFoundError &&
            ServiceError.is(err) &&
            err.code === status.NOT_FOUND &&
            err.details.includes('FQBN') &&
            err.details.includes(fqbn.split(':', 2).join(':')) // create a platform ID from the FQBN
          ) {
            resolve(undefined);
          }
          reject(err);
        }
        resolve(resp);
      });
    });

    const settings: PluggableMonitorSettings = {};
    if (!resp) {
      return settings;
    }
    for (const iterator of resp.getSettingsList()) {
      settings[iterator.getSettingId()] = {
        id: iterator.getSettingId(),
        label: iterator.getLabel(),
        type: iterator.getType(),
        values: iterator.getEnumValuesList(),
        selectedValue: iterator.getValue(),
      };
    }
    return settings;
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
    const config = new MonitorPortConfiguration();
    const { pluggableMonitorSettings } = settings;
    const reconciledSettings = await this.monitorSettingsProvider.setSettings(
      this.monitorID,
      pluggableMonitorSettings || {}
    );

    if (reconciledSettings) {
      for (const id in reconciledSettings) {
        const s = new MonitorPortSetting();
        s.setSettingId(id);
        s.setValue(reconciledSettings[id].selectedValue);
        config.addSettings(s);
      }
    }

    const connectionStatus = Boolean(this.duplex)
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

    if (!this.duplex) {
      // instead of throwing an error, return silently like the original logic
      // https://github.com/arduino/arduino-ide/blob/9b49712669b06c97bda68a1e5f04eee4664c13f8/arduino-ide-extension/src/node/monitor-service.ts#L540
      return;
    }

    const diffConfig = this.maybeUpdatePortConfigSnapshot(config);
    if (!diffConfig) {
      this.logger.info(
        `No port configuration changes have been detected. No need to send configure commands to the running monitor ${this.port.protocol}:${this.port.address}.`
      );
      return;
    }

    const coreClient = await this.coreClient;
    const { instance } = coreClient;

    this.logger.info(
      `Sending monitor request with new port configuration: ${JSON.stringify(
        MonitorPortConfiguration.toObject(false, diffConfig)
      )}`
    );
    const req = new MonitorRequest();
    req.setInstance(instance);
    req.setPortConfiguration(diffConfig);
    this.duplex.write(req);
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
  private maybeUpdatePortConfigSnapshot(
    otherPortConfig: MonitorPortConfiguration
  ): MonitorPortConfiguration | undefined {
    const otherPortConfigSnapshot = MonitorPortConfiguration.toObject(
      false,
      otherPortConfig
    );
    if (!this.currentPortConfigSnapshot) {
      throw new Error(
        `The current port configuration object was undefined when tried to merge in ${JSON.stringify(
          otherPortConfigSnapshot
        )}.`
      );
    }

    const snapshotDiff = diff(
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
      if (!this.currentPortConfigSnapshot?.settingsList) {
        throw new Error(
          `'settingsList' is missing from current port config snapshot: ${JSON.stringify(
            this.currentPortConfigSnapshot
          )}`
        );
      }
      const changedSetting = this.currentPortConfigSnapshot.settingsList[index];
      const setting = new MonitorPortSetting();
      setting.setValue(value);
      setting.setSettingId(changedSetting.settingId);
      acc.addSettings(setting);
      return acc;
    }, new MonitorPortConfiguration());

    this.currentPortConfigSnapshot = otherPortConfigSnapshot;
    this.logger.info(
      `Updated the port configuration for ${this.port.protocol}:${
        this.port.address
      }: ${JSON.stringify(this.currentPortConfigSnapshot)}`
    );
    return diffConfig;
  }

  private isValidMonitorPortSettingChange(entry: {
    op: Operation;
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
          const message: Monitor.Message = JSON.parse(msg);

          switch (message.command) {
            case Monitor.ClientCommand.SEND_MESSAGE:
              this.send(message.data as string);
              break;
            case Monitor.ClientCommand.CHANGE_SETTINGS:
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
    const command: Monitor.Message = {
      command: Monitor.MiddlewareCommand.ON_SETTINGS_DID_CHANGE,
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
function splitLines(s: string): string[] {
  return s.split(/(?<=\n)/);
}
