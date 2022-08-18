import { ClientDuplexStream } from '@grpc/grpc-js';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { Emitter, Event } from '@theia/core/lib/common/event';
import { ILogger } from '@theia/core/lib/common/logger';
import { deepClone } from '@theia/core/lib/common/objects';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { BackendApplicationContribution } from '@theia/core/lib/node';
import { inject, injectable, named } from '@theia/core/shared/inversify';
import { Disposable } from '@theia/core/shared/vscode-languageserver-protocol';
import { v4 } from 'uuid';
import { Unknown } from '../common/nls';
import {
  AttachedBoardsChangeEvent,
  AvailablePorts,
  Board,
  NotificationServiceServer,
  Port,
} from '../common/protocol';
import {
  BoardListWatchRequest,
  BoardListWatchResponse,
  DetectedPort as RpcDetectedPort,
} from './cli-protocol/cc/arduino/cli/commands/v1/board_pb';
import { ArduinoCoreServiceClient } from './cli-protocol/cc/arduino/cli/commands/v1/commands_grpc_pb';
import { Port as RpcPort } from './cli-protocol/cc/arduino/cli/commands/v1/port_pb';
import { CoreClientAware } from './core-client-provider';
import { ServiceError } from './service-error';

type Duplex = ClientDuplexStream<BoardListWatchRequest, BoardListWatchResponse>;
interface StreamWrapper extends Disposable {
  readonly stream: Duplex;
  readonly uuid: string; // For logging only
}

/**
 * Singleton service for tracking the available ports and board and broadcasting the
 * changes to all connected frontend instances.
 *
 * Unlike other services, this is not connection scoped.
 */
@injectable()
export class BoardDiscovery
  extends CoreClientAware
  implements BackendApplicationContribution
{
  @inject(ILogger)
  @named('discovery-log')
  private readonly logger: ILogger;

  @inject(NotificationServiceServer)
  private readonly notificationService: NotificationServiceServer;

  private watching: Deferred<void> | undefined;
  private stopping: Deferred<void> | undefined;
  private wrapper: StreamWrapper | undefined;
  private readonly onStreamDidEndEmitter = new Emitter<void>(); // sent from the CLI when the discovery process is killed for example after the indexes update and the core client re-initialization.
  private readonly onStreamDidCancelEmitter = new Emitter<void>(); // when the watcher is canceled by the IDE2
  private readonly toDisposeOnStopWatch = new DisposableCollection();

  private uploadInProgress = false;

  /**
   * Keys are the `address` of the ports.
   *
   * The `protocol` is ignored because the board detach event does not carry the protocol information,
   * just the address.
   * ```json
   * {
   *  "type": "remove",
   *  "address": "/dev/cu.usbmodem14101"
   * }
   * ```
   */
  private _availablePorts: AvailablePorts = {};
  get availablePorts(): AvailablePorts {
    return this._availablePorts;
  }

  onStart(): void {
    this.start();
    this.onClientDidRefresh(() => this.restart());
  }

  private async restart(): Promise<void> {
    this.logger.info('restarting before stop');
    await this.stop();
    this.logger.info('restarting after stop');
    return this.start();
  }

  onStop(): void {
    this.stop();
  }

  async stop(restart = false): Promise<void> {
    this.logger.info('stop');
    if (this.stopping) {
      this.logger.info('stop already stopping');
      return this.stopping.promise;
    }
    if (!this.watching) {
      return;
    }
    this.stopping = new Deferred();
    this.logger.info('>>> Stopping boards watcher...');
    return new Promise<void>((resolve, reject) => {
      const timeout = this.createTimeout(10_000, reject);
      const toDispose = new DisposableCollection();
      const waitForEvent = (event: Event<unknown>) =>
        event(() => {
          this.logger.info('stop received event: either end or cancel');
          toDispose.dispose();
          this.stopping?.resolve();
          this.stopping = undefined;
          this.logger.info('stop stopped');
          resolve();
          if (restart) {
            this.start();
          }
        });
      toDispose.pushAll([
        timeout,
        waitForEvent(this.onStreamDidEndEmitter.event),
        waitForEvent(this.onStreamDidCancelEmitter.event),
      ]);
      this.logger.info('Canceling boards watcher...');
      this.toDisposeOnStopWatch.dispose();
    });
  }

  setUploadInProgress(uploadInProgress: boolean): void {
    this.uploadInProgress = uploadInProgress;
  }

  private createTimeout(
    after: number,
    onTimeout: (error: Error) => void
  ): Disposable {
    const timer = setTimeout(
      () => onTimeout(new Error(`Timed out after ${after} ms.`)),
      after
    );
    return Disposable.create(() => clearTimeout(timer));
  }

  private async requestStartWatch(
    req: BoardListWatchRequest,
    duplex: Duplex
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (
        !duplex.write(req, (err: Error | undefined) => {
          if (err) {
            reject(err);
            return;
          }
        })
      ) {
        duplex.once('drain', resolve);
      } else {
        process.nextTick(resolve);
      }
    });
  }

  private async createWrapper(
    client: ArduinoCoreServiceClient
  ): Promise<StreamWrapper> {
    if (this.wrapper) {
      throw new Error(`Duplex was already set.`);
    }
    const stream = client
      .boardListWatch()
      .on('end', () => {
        this.logger.info('received end');
        this.onStreamDidEndEmitter.fire();
      })
      .on('error', (error) => {
        this.logger.info('error received');
        if (ServiceError.isCancel(error)) {
          this.logger.info('cancel error received!');
          this.onStreamDidCancelEmitter.fire();
        } else {
          this.logger.error(
            'Unexpected error occurred during the boards discovery.',
            error
          );
          // TODO: terminate? restart? reject?
        }
      });
    const wrapper = {
      stream,
      uuid: v4(),
      dispose: () => {
        this.logger.info('disposing requesting cancel');
        // Cancelling the stream will kill the discovery `builtin:mdns-discovery process`.
        // The client (this class) will receive a `{"eventType":"quit","error":""}` response from the CLI.
        stream.cancel();
        this.logger.info('disposing canceled');
        this.wrapper = undefined;
      },
    };
    this.toDisposeOnStopWatch.pushAll([
      wrapper,
      Disposable.create(() => {
        this.watching?.reject(new Error(`Stopping watcher.`));
        this.watching = undefined;
      }),
    ]);
    return wrapper;
  }

  private toJson(arg: BoardListWatchRequest | BoardListWatchResponse): string {
    let object: Record<string, unknown> | undefined = undefined;
    if (arg instanceof BoardListWatchRequest) {
      object = BoardListWatchRequest.toObject(false, arg);
    } else if (arg instanceof BoardListWatchResponse) {
      object = BoardListWatchResponse.toObject(false, arg);
    } else {
      throw new Error(`Unhandled object type: ${arg}`);
    }
    return JSON.stringify(object, null, 2); // TODO: remove `space`?
  }

  async start(): Promise<void> {
    this.logger.info('start');
    if (this.stopping) {
      this.logger.info('start is stopping wait');
      await this.stopping.promise;
      this.logger.info('start stopped');
    }
    if (this.watching) {
      this.logger.info('start already watching');
      return this.watching.promise;
    }
    this.watching = new Deferred();
    this.logger.info('start new deferred');
    const { client, instance } = await this.coreClient;
    const wrapper = await this.createWrapper(client);
    wrapper.stream.on('data', (resp) => this.onBoardListWatchResponse(resp));
    this.logger.info('start request start watch');
    await this.requestStartWatch(
      new BoardListWatchRequest().setInstance(instance),
      wrapper.stream
    );
    this.logger.info('start requested start watch');
    this.watching.resolve();
    this.logger.info('start resolved watching');
  }

  // XXX: make this `protected` and override for tests if IDE2 wants to mock events from the CLI.
  private onBoardListWatchResponse(resp: BoardListWatchResponse): void {
    this.logger.info(this.toJson(resp));
    const eventType = EventType.parse(resp.getEventType());

    if (eventType === EventType.Quit) {
      this.logger.info('quit received');
      this.stop();
      return;
    }

    const detectedPort = resp.getPort();
    if (detectedPort) {
      const { port, boards } = this.fromRpc(detectedPort);
      if (!port) {
        if (!!boards.length) {
          console.warn(
            `Could not detect the port, but unexpectedly received discovered boards. This is most likely a bug! Response was: ${this.toJson(
              resp
            )}`
          );
        }
        return;
      }
      const oldState = deepClone(this._availablePorts);
      const newState = deepClone(this._availablePorts);
      const key = Port.keyOf(port);

      if (eventType === EventType.Add) {
        if (newState[key]) {
          const [, knownBoards] = newState[key];
          this.logger.warn(
            `Port '${Port.toString(
              port
            )}' was already available. Known boards before override: ${JSON.stringify(
              knownBoards
            )}`
          );
        }
        newState[key] = [port, boards];
      } else if (eventType === EventType.Remove) {
        if (!newState[key]) {
          this.logger.warn(
            `Port '${Port.toString(port)}' was not available. Skipping`
          );
          return;
        }
        delete newState[key];
      }

      const event: AttachedBoardsChangeEvent = {
        oldState: {
          ...AvailablePorts.split(oldState),
        },
        newState: {
          ...AvailablePorts.split(newState),
        },
        uploadInProgress: this.uploadInProgress,
      };

      this._availablePorts = newState;
      this.notificationService.notifyAttachedBoardsDidChange(event);
    }
  }

  private fromRpc(detectedPort: RpcDetectedPort): DetectedPort {
    const rpcPort = detectedPort.getPort();
    const port = rpcPort && this.fromRpcPort(rpcPort);
    const boards = detectedPort.getMatchingBoardsList().map(
      (board) =>
        ({
          fqbn: board.getFqbn(),
          name: board.getName() || Unknown,
          port,
        } as Board)
    );
    return {
      boards,
      port,
    };
  }

  private fromRpcPort(rpcPort: RpcPort): Port {
    const port = {
      address: rpcPort.getAddress(),
      addressLabel: rpcPort.getLabel(),
      protocol: rpcPort.getProtocol(),
      protocolLabel: rpcPort.getProtocolLabel(),
      properties: Port.Properties.create(rpcPort.getPropertiesMap().toObject()),
    };
    return port;
  }
}

enum EventType {
  Add,
  Remove,
  Quit,
}
namespace EventType {
  export function parse(type: string): EventType {
    const normalizedType = type.toLowerCase();
    switch (normalizedType) {
      case 'add':
        return EventType.Add;
      case 'remove':
        return EventType.Remove;
      case 'quit':
        return EventType.Quit;
      default:
        throw new Error(
          `Unexpected 'BoardListWatchResponse' event type: '${type}.'`
        );
    }
  }
}

interface DetectedPort {
  port: Port | undefined;
  boards: Board[];
}
