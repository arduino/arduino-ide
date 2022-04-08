import { ClientDuplexStream } from '@grpc/grpc-js';
import { Disposable, Emitter, ILogger } from '@theia/core';
import { inject, named } from '@theia/core/shared/inversify';
import {
  Board,
  Port,
  Status,
  MonitorSettings,
  Monitor,
} from '../common/protocol';
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
import WebSocketProviderImpl from './web-socket/web-socket-provider-impl';

export const MonitorServiceName = 'monitor-service';

export class MonitorService extends CoreClientAware implements Disposable {
  // Bidirectional gRPC stream used to receive and send data from the running
  // pluggable monitor managed by the Arduino CLI.
  protected duplex: ClientDuplexStream<MonitorRequest, MonitorResponse> | null;

  // Settings used by the currently running pluggable monitor.
  // They can be freely modified while running.
  protected settings: MonitorSettings;

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

  protected readonly webSocketProvider: WebSocketProvider =
    new WebSocketProviderImpl();

  constructor(
    @inject(ILogger)
    @named(MonitorServiceName)
    protected readonly logger: ILogger,

    private readonly board: Board,
    private readonly port: Port,
    protected readonly coreClientProvider: CoreClientProvider
  ) {
    super();

    this.onWSClientsNumberChanged =
      this.webSocketProvider.onClientsNumberChanged(async (clients: number) => {
        if (clients === 0) {
          // There are no more clients that want to receive
          // data from this monitor, we can freely close
          // and dispose it.
          this.dispose();
        }
      });

    // Sets default settings for this monitor
    this.portMonitorSettings(port.protocol, board.fqbn!).then(
      (settings) => (this.settings = settings)
    );
  }

  getWebsocketAddressPort(): number {
    return this.webSocketProvider.getAddress().port;
  }

  dispose(): void {
    this.stop();
    this.onDisposeEmitter.fire();
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
    if (this.duplex) {
      return Status.ALREADY_CONNECTED;
    }

    if (!this.board?.fqbn || !this.port?.address || !this.port?.protocol) {
      return Status.CONFIG_MISSING;
    }

    this.logger.info('starting monitor');
    await this.coreClientProvider.initialized;
    const coreClient = await this.coreClient();
    const { client, instance } = coreClient;

    this.duplex = client.monitor();
    this.duplex
      .on('close', () => {
        this.logger.info(
          `monitor to ${this.port?.address} using ${this.port?.protocol} closed by client`
        );
      })
      .on('end', () => {
        this.logger.info(
          `monitor to ${this.port?.address} using ${this.port?.protocol} closed by server`
        );
      })
      .on('error', (err: Error) => {
        this.logger.error(err);
        // TODO
        // this.theiaFEClient?.notifyError()
      })
      .on(
        'data',
        ((res: MonitorResponse) => {
          if (res.getError()) {
            // TODO: Maybe disconnect
            this.logger.error(res.getError());
            return;
          }
          const data = res.getRxData();
          const message =
            typeof data === 'string'
              ? data
              : new TextDecoder('utf8').decode(data);
          this.messages.push(...splitLines(message));
        }).bind(this)
      );

    const req = new MonitorRequest();
    req.setInstance(instance);
    if (this.board?.fqbn) {
      req.setFqbn(this.board.fqbn);
    }
    if (this.port?.address && this.port?.protocol) {
      const port = new gRPCPort();
      port.setAddress(this.port.address);
      port.setProtocol(this.port.protocol);
      req.setPort(port);
    }
    const config = new MonitorPortConfiguration();
    for (const id in this.settings) {
      const s = new MonitorPortSetting();
      s.setSettingId(id);
      s.setValue(this.settings[id].selectedValue);
      config.addSettings(s);
    }
    req.setPortConfiguration(config);

    const connect = new Promise<Status>((resolve) => {
      if (this.duplex?.write(req)) {
        this.startMessagesHandlers();
        this.logger.info(
          `started monitor to ${this.port?.address} using ${this.port?.protocol}`
        );
        resolve(Status.OK);
        return;
      }
      this.logger.warn(
        `failed starting monitor to ${this.port?.address} using ${this.port?.protocol}`
      );
      resolve(Status.NOT_CONNECTED);
    });

    const connectTimeout = new Promise<Status>((resolve) => {
      setTimeout(async () => {
        this.logger.warn(
          `timeout starting monitor to ${this.port?.address} using ${this.port?.protocol}`
        );
        resolve(Status.NOT_CONNECTED);
      }, 1000);
    });
    // Try opening a monitor connection with a timeout
    return await Promise.race([connect, connectTimeout]);
  }

  /**
   * Pauses the currently running monitor, it still closes the gRPC connection
   * with the underlying monitor process but it doesn't stop the message handlers
   * currently running.
   * This is mainly used to handle upload when to the board/port combination
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
      this.duplex = null;
      this.logger.info(
        `stopped monitor to ${this.port?.address} using ${this.port?.protocol}`
      );
      resolve();
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
  currentSettings(): MonitorSettings {
    return this.settings;
  }

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
  ): Promise<MonitorSettings> {
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

    const settings: MonitorSettings = {};
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
    for (const id in settings) {
      const s = new MonitorPortSetting();
      s.setSettingId(id);
      s.setValue(settings[id].selectedValue);
      config.addSettings(s);
      this.settings[id] = settings[id];
    }

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
            case Monitor.Command.SEND_MESSAGE:
              this.send(message.data);
              break;
            case Monitor.Command.CHANGE_SETTINGS:
              const settings: MonitorSettings = JSON.parse(message.data);
              this.changeSettings(settings);
              break;
          }
        }
      );
    }
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
