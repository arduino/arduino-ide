import { ClientDuplexStream } from '@grpc/grpc-js';
import { Disposable, Emitter, ILogger } from '@theia/core';
import { inject, named } from '@theia/core/shared/inversify';
import { Board, Port, Status, Monitor } from '../common/protocol';
import {
  EnumerateMonitorPortSettingsRequest,
  EnumerateMonitorPortSettingsResponse,
  MonitorPortConfiguration,
  MonitorPortSetting,
  MonitorRequest,
  MonitorResponse,
} from './cli-protocol/cc/arduino/cli/commands/v1/monitor_pb';
import { CoreClientAware, CoreClientProvider } from './core-client-provider';
import { WebSocketProvider } from './web-socket/web-socket-provider';
import { Port as gRPCPort } from 'arduino-ide-extension/src/node/cli-protocol/cc/arduino/cli/commands/v1/port_pb';
import {
  MonitorSettings,
  PluggableMonitorSettings,
  MonitorSettingsProvider,
} from './monitor-settings/monitor-settings-provider';
import { Deferred } from '@theia/core/lib/common/promise-util';

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

export class MonitorService extends CoreClientAware implements Disposable {
  // Bidirectional gRPC stream used to receive and send data from the running
  // pluggable monitor managed by the Arduino CLI.
  protected duplex: ClientDuplexStream<MonitorRequest, MonitorResponse> | null;

  // Settings used by the currently running pluggable monitor.
  // They can be freely modified while running.
  protected settings: MonitorSettings = {};

  // List of messages received from the running pluggable monitor.
  // These are flushed from time to time to the frontend.
  protected messages: string[] = [];

  // Handles messages received from the frontend via websocket.
  protected onMessageReceived?: Disposable;

  // Sends messages to the frontend from time to time.
  protected flushMessagesInterval?: NodeJS.Timeout;

  // Triggered each time the number of clients connected
  // to the this service WebSocket changes.
  protected onWSClientsNumberChanged?: Disposable;

  // Used to notify that the monitor is being disposed
  protected readonly onDisposeEmitter = new Emitter<void>();
  readonly onDispose = this.onDisposeEmitter.event;

  protected uploadInProgress = false;
  protected _initialized = new Deferred<void>();
  protected creating: Deferred<Status>;

  MAX_WRITE_TO_STREAM_TRIES = 10;
  WRITE_TO_STREAM_TIMEOUT_MS = 30000;

  constructor(
    @inject(ILogger)
    @named(MonitorServiceName)
    protected readonly logger: ILogger,
    @inject(MonitorSettingsProvider)
    protected readonly monitorSettingsProvider: MonitorSettingsProvider,
    @inject(WebSocketProvider)
    protected readonly webSocketProvider: WebSocketProvider,

    private readonly board: Board,
    private readonly port: Port,
    private readonly monitorID: string,
    protected override readonly coreClientProvider: CoreClientProvider
  ) {
    super();

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

    this.portMonitorSettings(port.protocol, board.fqbn!).then(
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

  setUploadInProgress(status: boolean): void {
    this.uploadInProgress = status;
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
   * If a monitor is already started or board fqbn, port address and/or protocol
   * are missing nothing happens.
   * @returns a status to verify connection has been established.
   */
  async start(): Promise<Status> {
    if (this.creating?.state === 'unresolved') return this.creating.promise;
    this.creating = new Deferred();
    if (this.duplex) {
      this.updateClientsSettings({
        monitorUISettings: { connected: true, serialPort: this.port.address },
      });
      this.creating.resolve(Status.ALREADY_CONNECTED);
      return this.creating.promise;
    }

    if (!this.board?.fqbn || !this.port?.address || !this.port?.protocol) {
      this.updateClientsSettings({ monitorUISettings: { connected: false } });

      this.creating.resolve(Status.CONFIG_MISSING);
      return this.creating.promise;
    }

    if (this.uploadInProgress) {
      this.updateClientsSettings({
        monitorUISettings: { connected: false, serialPort: this.port.address },
      });

      this.creating.resolve(Status.UPLOAD_IN_PROGRESS);
      return this.creating.promise;
    }

    this.logger.info('starting monitor');

    // get default monitor settings from the CLI
    const defaultSettings = await this.portMonitorSettings(
      this.port.protocol,
      this.board.fqbn
    );
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

    await this.coreClientProvider.initialized;
    const coreClient = await this.coreClient();

    const { instance } = coreClient;
    const monitorRequest = new MonitorRequest();
    monitorRequest.setInstance(instance);
    if (this.board?.fqbn) {
      monitorRequest.setFqbn(this.board.fqbn);
    }
    if (this.port?.address && this.port?.protocol) {
      const port = new gRPCPort();
      port.setAddress(this.port.address);
      port.setProtocol(this.port.protocol);
      monitorRequest.setPort(port);
    }
    const config = new MonitorPortConfiguration();
    for (const id in this.settings.pluggableMonitorSettings) {
      const s = new MonitorPortSetting();
      s.setSettingId(id);
      s.setValue(this.settings.pluggableMonitorSettings[id].selectedValue);
      config.addSettings(s);
    }
    monitorRequest.setPortConfiguration(config);

    const wroteToStreamSuccessfully = await this.pollWriteToStream(
      monitorRequest
    );
    if (wroteToStreamSuccessfully) {
      this.startMessagesHandlers();
      this.logger.info(
        `started monitor to ${this.port?.address} using ${this.port?.protocol}`
      );
      this.updateClientsSettings({
        monitorUISettings: { connected: true, serialPort: this.port.address },
      });
      this.creating.resolve(Status.OK);
      return this.creating.promise;
    } else {
      this.logger.warn(
        `failed starting monitor to ${this.port?.address} using ${this.port?.protocol}`
      );
      this.creating.resolve(Status.NOT_CONNECTED);
      return this.creating.promise;
    }
  }

  async createDuplex(): Promise<
    ClientDuplexStream<MonitorRequest, MonitorResponse>
  > {
    const coreClient = await this.coreClient();
    return coreClient.client.monitor();
  }

  setDuplexHandlers(
    duplex: ClientDuplexStream<MonitorRequest, MonitorResponse>,
    additionalHandlers: DuplexHandler[]
  ): void {
    // default handlers
    duplex
      .on('close', () => {
        this.duplex = null;
        this.updateClientsSettings({
          monitorUISettings: { connected: false },
        });
        this.logger.info(
          `monitor to ${this.port?.address} using ${this.port?.protocol} closed by client`
        );
      })
      .on('end', () => {
        this.duplex = null;
        this.updateClientsSettings({
          monitorUISettings: { connected: false },
        });
        this.logger.info(
          `monitor to ${this.port?.address} using ${this.port?.protocol} closed by server`
        );
      });

    for (const handler of additionalHandlers) {
      duplex.on(handler.key, handler.callback);
    }
  }

  pollWriteToStream(request: MonitorRequest): Promise<boolean> {
    let attemptsRemaining = this.MAX_WRITE_TO_STREAM_TRIES;
    const writeTimeoutMs = this.WRITE_TO_STREAM_TIMEOUT_MS;

    const createWriteToStreamExecutor =
      (duplex: ClientDuplexStream<MonitorRequest, MonitorResponse>) =>
      (resolve: (value: boolean) => void, reject: () => void) => {
        const resolvingDuplexHandlers: DuplexHandler[] = [
          {
            key: 'error',
            callback: async (err: Error) => {
              this.logger.error(err);
              resolve(false);
              // TODO
              // this.theiaFEClient?.notifyError()
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
                resolve(true);
                return;
              }
              const data = monitorResponse.getRxData();
              const message =
                typeof data === 'string'
                  ? data
                  : new TextDecoder('utf8').decode(data);
              this.messages.push(...splitLines(message));
            },
          },
        ];

        this.setDuplexHandlers(duplex, resolvingDuplexHandlers);

        setTimeout(() => {
          reject();
        }, writeTimeoutMs);
        duplex.write(request);
      };

    const pollWriteToStream = new Promise<boolean>((resolve) => {
      const startPolling = async () => {
        // here we create a new duplex but we don't yet
        // set "this.duplex", nor do we use "this.duplex" in our poll
        // as duplex 'end' / 'close' events (which we do not "await")
        // will set "this.duplex" to null
        const createdDuplex = await this.createDuplex();

        let pollingIsSuccessful;
        // attempt a "writeToStream" and "await" CLI response: success (true) or error (false)
        // if we get neither within WRITE_TO_STREAM_TIMEOUT_MS or an error we get undefined
        try {
          const writeToStream = createWriteToStreamExecutor(createdDuplex);
          pollingIsSuccessful = await new Promise(writeToStream);
        } catch (error) {
          this.logger.error(error);
        }

        // CLI confirmed port opened successfully
        if (pollingIsSuccessful) {
          this.duplex = createdDuplex;
          resolve(true);
          return;
        }

        // if "pollingIsSuccessful" is false
        // the CLI gave us an error, lets try again
        // after waiting 2 seconds if we've not already
        // reached MAX_WRITE_TO_STREAM_TRIES
        if (pollingIsSuccessful === false) {
          attemptsRemaining -= 1;
          if (attemptsRemaining > 0) {
            setTimeout(startPolling, 2000);
            return;
          } else {
            resolve(false);
            return;
          }
        }

        // "pollingIsSuccessful" remains undefined:
        // we got no response from the CLI within 30 seconds
        // resolve to false and end the duplex connection
        resolve(false);
        createdDuplex.end();
        return;
      };

      startPolling();
    });

    return pollWriteToStream;
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
  async send(message: string): Promise<Status> {
    if (!this.duplex) {
      return Status.NOT_CONNECTED;
    }
    await this.coreClientProvider.initialized;
    const coreClient = await this.coreClient();
    const { instance } = coreClient;

    const req = new MonitorRequest();
    req.setInstance(instance);
    req.setTxData(new TextEncoder().encode(message));
    return new Promise<Status>((resolve) => {
      if (this.duplex) {
        this.duplex?.write(req, () => {
          resolve(Status.OK);
        });
        return;
      }
      this.stop().then(() => resolve(Status.NOT_CONNECTED));
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

  // TODO: move this into MonitoSettingsProvider
  /**
   * Returns the possible configurations used to connect a monitor
   * to the board specified by fqbn using the specified protocol
   * @param protocol the protocol of the monitor we want get settings for
   * @param fqbn the fqbn of the board we want to monitor
   * @returns a map of all the settings supported by the monitor
   */
  private async portMonitorSettings(
    protocol: string,
    fqbn: string
  ): Promise<PluggableMonitorSettings> {
    await this.coreClientProvider.initialized;
    const coreClient = await this.coreClient();
    const { client, instance } = coreClient;
    const req = new EnumerateMonitorPortSettingsRequest();
    req.setInstance(instance);
    req.setPortProtocol(protocol);
    req.setFqbn(fqbn);

    const res = await new Promise<EnumerateMonitorPortSettingsResponse>(
      (resolve, reject) => {
        client.enumerateMonitorPortSettings(req, (err, resp) => {
          if (!!err) {
            reject(err);
          }
          resolve(resp);
        });
      }
    );

    const settings: PluggableMonitorSettings = {};
    for (const iterator of res.getSettingsList()) {
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
  async changeSettings(settings: MonitorSettings): Promise<Status> {
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

    this.updateClientsSettings({
      monitorUISettings: {
        ...settings.monitorUISettings,
        connected: !!this.duplex,
        serialPort: this.port.address,
      },
      pluggableMonitorSettings: reconciledSettings,
    });

    if (!this.duplex) {
      return Status.NOT_CONNECTED;
    }
    await this.coreClientProvider.initialized;
    const coreClient = await this.coreClient();
    const { instance } = coreClient;

    const req = new MonitorRequest();
    req.setInstance(instance);
    req.setPortConfiguration(config);
    this.duplex.write(req);
    return Status.OK;
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
