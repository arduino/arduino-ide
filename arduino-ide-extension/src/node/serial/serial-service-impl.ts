import { ClientDuplexStream } from '@grpc/grpc-js';
import { TextEncoder } from 'util';
import { injectable, inject, named } from 'inversify';
import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import { ILogger } from '@theia/core/lib/common/logger';
import {
  SerialService,
  SerialServiceClient,
  SerialConfig,
  SerialError,
  Status,
} from '../../common/protocol/serial-service';
import {
  StreamingOpenRequest,
  StreamingOpenResponse,
  MonitorConfig as GrpcMonitorConfig,
} from '../cli-protocol/cc/arduino/cli/monitor/v1/monitor_pb';
import { MonitorClientProvider } from './monitor-client-provider';
import { Board } from '../../common/protocol/boards-service';
import { WebSocketProvider } from '../web-socket/web-socket-provider';
import { SerialPlotter } from '../../browser/serial/plotter/protocol';
import { Disposable } from '@theia/core/shared/vscode-languageserver-protocol';

export const SerialServiceName = 'serial-service';

interface ErrorWithCode extends Error {
  readonly code: number;
}
namespace ErrorWithCode {
  export function toSerialError(
    error: Error,
    config: SerialConfig
  ): SerialError {
    const { message } = error;
    let code = undefined;
    if (is(error)) {
      // TODO: const `mapping`. Use regex for the `message`.
      const mapping = new Map<string, number>();
      mapping.set(
        '1 CANCELLED: Cancelled on client',
        SerialError.ErrorCodes.CLIENT_CANCEL
      );
      mapping.set(
        '2 UNKNOWN: device not configured',
        SerialError.ErrorCodes.DEVICE_NOT_CONFIGURED
      );
      mapping.set(
        '2 UNKNOWN: error opening serial connection: Serial port busy',
        SerialError.ErrorCodes.DEVICE_BUSY
      );
      code = mapping.get(message);
    }
    return {
      message,
      code,
      config,
    };
  }
  function is(error: Error & { code?: number }): error is ErrorWithCode {
    return typeof error.code === 'number';
  }
}

@injectable()
export class SerialServiceImpl implements SerialService {
  protected theiaFEClient?: SerialServiceClient;
  protected serialConfig?: SerialConfig;

  protected serialConnection?: {
    duplex: ClientDuplexStream<StreamingOpenRequest, StreamingOpenResponse>;
    config: SerialConfig;
  };
  protected messages: string[] = [];
  protected onMessageReceived: Disposable | null;
  protected onWSClientsNumberChanged: Disposable | null;

  protected flushMessagesInterval: NodeJS.Timeout | null;

  uploadInProgress = false;

  constructor(
    @inject(ILogger)
    @named(SerialServiceName)
    protected readonly logger: ILogger,

    @inject(MonitorClientProvider)
    protected readonly serialClientProvider: MonitorClientProvider,

    @inject(WebSocketProvider)
    protected readonly webSocketService: WebSocketService
  ) { }

  async isSerialPortOpen(): Promise<boolean> {
    return !!this.serialConnection;
  }

  setClient(client: SerialServiceClient | undefined): void {
    this.theiaFEClient = client;

    this.theiaFEClient?.notifyWebSocketChanged(
      this.webSocketService.getAddress().port
    );

    // listen for the number of websocket clients and create or dispose the serial connection
    this.onWSClientsNumberChanged =
      this.webSocketService.onClientsNumberChanged(async () => {
        await this.connectSerialIfRequired();
      });
  }

  public async clientsAttached(): Promise<number> {
    return this.webSocketService.getConnectedClientsNumber.bind(
      this.webSocketService
    )();
  }

  public async connectSerialIfRequired(): Promise<void> {
    if (this.uploadInProgress) return;
    const clients = await this.clientsAttached();
    clients > 0 ? await this.connect() : await this.disconnect();
  }

  dispose(): void {
    this.logger.info('>>> Disposing serial service...');
    if (this.serialConnection) {
      this.disconnect();
    }
    this.logger.info('<<< Disposed serial service.');
    this.theiaFEClient = undefined;
  }

  async setSerialConfig(config: SerialConfig): Promise<void> {
    this.serialConfig = config;
    await this.disconnect();
    await this.connectSerialIfRequired();
  }

  async updateWsConfigParam(
    config: Partial<SerialPlotter.Config>
  ): Promise<void> {
    const msg: SerialPlotter.Protocol.Message = {
      command: SerialPlotter.Protocol.Command.MIDDLEWARE_CONFIG_CHANGED,
      data: config,
    };
    this.webSocketService.sendMessage(JSON.stringify(msg));
  }

  private async connect(): Promise<Status> {
    if (!this.serialConfig) {
      return Status.CONFIG_MISSING;
    }

    this.logger.info(
      `>>> Creating serial connection for ${Board.toString(
        this.serialConfig.board
      )} on port ${this.serialConfig.port.address}...`
    );

    if (this.serialConnection) {
      return Status.ALREADY_CONNECTED;
    }
    const client = await this.serialClientProvider.client();
    if (!client) {
      return Status.NOT_CONNECTED;
    }
    if (client instanceof Error) {
      return { message: client.message };
    }
    const duplex = client.streamingOpen();
    this.serialConnection = { duplex, config: this.serialConfig };

    const serialConfig = this.serialConfig;

    duplex.on(
      'error',
      ((error: Error) => {
        const serialError = ErrorWithCode.toSerialError(error, serialConfig);
        if (serialError.code !== SerialError.ErrorCodes.CLIENT_CANCEL) {
          this.disconnect(serialError).then(() => {
            if (this.theiaFEClient) {
              this.theiaFEClient.notifyError(serialError);
            }
          });
        }
        if (serialError.code === undefined) {
          // Log the original, unexpected error.
          this.logger.error(error);
        }
      }).bind(this)
    );

    this.updateWsConfigParam({ connected: !!this.serialConnection });

    const flushMessagesToFrontend = () => {
      if (this.messages.length) {
        this.webSocketService.sendMessage(JSON.stringify(this.messages));
        this.messages = [];
      }
    };

    this.onMessageReceived = this.webSocketService.onMessageReceived(
      (msg: string) => {
        try {
          const message: SerialPlotter.Protocol.Message = JSON.parse(msg);

          switch (message.command) {
            case SerialPlotter.Protocol.Command.PLOTTER_SEND_MESSAGE:
              this.sendMessageToSerial(message.data);
              break;

            case SerialPlotter.Protocol.Command.PLOTTER_SET_BAUDRATE:
              this.theiaFEClient?.notifyBaudRateChanged(
                parseInt(message.data, 10) as SerialConfig.BaudRate
              );
              break;

            case SerialPlotter.Protocol.Command.PLOTTER_SET_LINE_ENDING:
              this.theiaFEClient?.notifyLineEndingChanged(message.data);
              break;

            case SerialPlotter.Protocol.Command.PLOTTER_SET_INTERPOLATE:
              this.theiaFEClient?.notifyInterpolateChanged(message.data);
              break;

            default:
              break;
          }
        } catch (error) { }
      }
    );

    // empty the queue every 32ms (~30fps)
    this.flushMessagesInterval = setInterval(flushMessagesToFrontend, 32);

    duplex.on(
      'data',
      ((resp: StreamingOpenResponse) => {
        const raw = resp.getData();
        const message =
          typeof raw === 'string' ? raw : new TextDecoder('utf8').decode(raw);

        // split the message if it contains more lines
        const messages = stringToArray(message);
        this.messages.push(...messages);
      }).bind(this)
    );

    const { type, port } = this.serialConfig;
    const req = new StreamingOpenRequest();
    const monitorConfig = new GrpcMonitorConfig();
    monitorConfig.setType(this.mapType(type));
    monitorConfig.setTarget(port.address);
    if (this.serialConfig.baudRate !== undefined) {
      monitorConfig.setAdditionalConfig(
        Struct.fromJavaScript({ BaudRate: this.serialConfig.baudRate })
      );
    }
    req.setConfig(monitorConfig);

    if (!this.serialConnection) {
      return await this.disconnect();
    }

    const writeTimeout = new Promise<Status>((resolve) => {
      setTimeout(async () => {
        resolve(Status.NOT_CONNECTED);
      }, 1000);
    });

    const writePromise = (serialConnection: any) => {
      return new Promise<Status>((resolve) => {
        serialConnection.duplex.write(req, () => {
          const boardName = this.serialConfig?.board
            ? Board.toString(this.serialConfig.board, {
              useFqbn: false,
            })
            : 'unknown board';

          const portName = this.serialConfig?.port
            ? this.serialConfig.port.address
            : 'unknown port';
          this.logger.info(
            `<<< Serial connection created for ${boardName} on port ${portName}.`
          );
          resolve(Status.OK);
        });
      });
    };

    const status = await Promise.race([
      writeTimeout,
      writePromise(this.serialConnection),
    ]);

    if (status === Status.NOT_CONNECTED) {
      this.disconnect();
    }

    return status;
  }

  public async disconnect(reason?: SerialError): Promise<Status> {
    return new Promise<Status>((resolve) => {
      try {
        if (this.onMessageReceived) {
          this.onMessageReceived.dispose();
          this.onMessageReceived = null;
        }
        if (this.flushMessagesInterval) {
          clearInterval(this.flushMessagesInterval);
          this.flushMessagesInterval = null;
        }

        if (
          !this.serialConnection &&
          reason &&
          reason.code === SerialError.ErrorCodes.CLIENT_CANCEL
        ) {
          resolve(Status.OK);
          return;
        }
        this.logger.info('>>> Disposing serial connection...');
        if (!this.serialConnection) {
          this.logger.warn('<<< Not connected. Nothing to dispose.');
          resolve(Status.NOT_CONNECTED);
          return;
        }
        const { duplex, config } = this.serialConnection;

        this.logger.info(
          `<<< Disposed serial connection for ${Board.toString(config.board, {
            useFqbn: false,
          })} on port ${config.port.address}.`
        );

        duplex.cancel();
      } finally {
        this.serialConnection = undefined;
        this.updateWsConfigParam({ connected: !!this.serialConnection });
        this.messages.length = 0;

        setTimeout(() => {
          resolve(Status.OK);
        }, 200);
      }
    });
  }

  async sendMessageToSerial(message: string): Promise<Status> {
    if (!this.serialConnection) {
      return Status.NOT_CONNECTED;
    }
    const req = new StreamingOpenRequest();
    req.setData(new TextEncoder().encode(message));
    return new Promise<Status>((resolve) => {
      if (this.serialConnection) {
        this.serialConnection.duplex.write(req, () => {
          resolve(Status.OK);
        });
        return;
      }
      this.disconnect().then(() => resolve(Status.NOT_CONNECTED));
    });
  }

  protected mapType(
    type?: SerialConfig.ConnectionType
  ): GrpcMonitorConfig.TargetType {
    switch (type) {
      case SerialConfig.ConnectionType.SERIAL:
        return GrpcMonitorConfig.TargetType.TARGET_TYPE_SERIAL;
      default:
        return GrpcMonitorConfig.TargetType.TARGET_TYPE_SERIAL;
    }
  }
}

// converts 'ab\nc\nd' => [ab\n,c\n,d]
function stringToArray(string: string, separator = '\n') {
  const retArray: string[] = [];

  let prevChar = separator;

  for (let i = 0; i < string.length; i++) {
    const currChar = string[i];

    if (prevChar === separator) {
      retArray.push(currChar);
    } else {
      const lastWord = retArray[retArray.length - 1];
      retArray[retArray.length - 1] = lastWord + currChar;
    }

    prevChar = currChar;
  }
  return retArray;
}
