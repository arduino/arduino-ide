import { injectable, inject, named } from '@theia/core/shared/inversify';
import { ClientDuplexStream } from '@grpc/grpc-js';
import { ILogger } from '@theia/core/lib/common/logger';
import { deepClone } from '@theia/core/lib/common/objects';
import { CoreClientAware } from './core-client-provider';
import {
  BoardListWatchRequest,
  BoardListWatchResponse,
} from './cli-protocol/cc/arduino/cli/commands/v1/board_pb';
import {
  Board,
  Port,
  NotificationServiceServer,
  AvailablePorts,
  AttachedBoardsChangeEvent,
} from '../common/protocol';
import { Emitter } from '@theia/core/lib/common/event';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { Disposable } from '@theia/core/shared/vscode-languageserver-protocol';
import { ArduinoCoreServiceClient } from './cli-protocol/cc/arduino/cli/commands/v1/commands_grpc_pb';
import { v4 } from 'uuid';
import { ServiceError } from './service-error';
import { BackendApplicationContribution } from '@theia/core/lib/node';

type Duplex = ClientDuplexStream<BoardListWatchRequest, BoardListWatchResponse>;
interface StreamWrapper extends Disposable {
  readonly stream: Duplex;
  readonly uuid: string; // For logging only
}

/**
 * Singleton service for tracking the available ports and board and broadcasting the
 * changes to all connected frontend instances. \
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

  // Used to know if the board watch process is already running to avoid
  // starting it multiple times
  private watching: boolean;
  private wrapper: StreamWrapper | undefined;
  private readonly onStreamDidEndEmitter = new Emitter<void>(); // sent from the CLI when the discovery process is killed for example after the indexes update and the core client re-initialization.
  private readonly onStreamDidCancelEmitter = new Emitter<void>(); // when the watcher is canceled by the IDE2
  private readonly toDisposeOnStopWatch = new DisposableCollection();

  /**
   * Keys are the `address` of the ports.
   * The `protocol` is ignored because the board detach event does not carry the protocol information,
   * just the address.
   * ```json
   * {
   *  "type": "remove",
   *  "address": "/dev/cu.usbmodem14101"
   * }
   * ```
   */
  private _state: AvailablePorts = {};
  get state(): AvailablePorts {
    return this._state;
  }

  onStart(): void {
    this.start();
    this.onClientDidRefresh(() => this.start());
  }

  onStop(): void {
    this.stop();
  }

  stop(): Promise<void> {
    this.logger.info('>>> Stopping boards watcher...');
    return new Promise<void>((resolve, reject) => {
      const timeout = this.timeout(BoardDiscovery.StopWatchTimeout, reject);
      const toDispose = new DisposableCollection();
      toDispose.pushAll([
        timeout,
        this.onStreamDidEndEmitter.event(() => {
          this.logger.info(
            `<<< Received the end event from the stream. Boards watcher has been successfully stopped.`
          );
          this.watching = false;
          toDispose.dispose();
          resolve();
        }),
        this.onStreamDidCancelEmitter.event(() => {
          this.logger.info(
            `<<< Received the cancel event from the stream. Boards watcher has been successfully stopped.`
          );
          this.watching = false;
          toDispose.dispose();
          resolve();
        }),
      ]);
      this.logger.info('Canceling boards watcher...');
      this.toDisposeOnStopWatch.dispose();
    });
  }

  private timeout(
    after: number,
    onTimeout: (error: Error) => void
  ): Disposable {
    const timer = setTimeout(
      () => onTimeout(new Error(`Timed out after ${after} ms.`)),
      after
    );
    return Disposable.create(() => clearTimeout(timer));
  }

  private async write(
    req: BoardListWatchRequest,
    duplex: Duplex
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.logger.info(`>>> Writing ${this.toJson(req)} to the stream...`);
      if (
        !duplex.write(req, (err: Error | undefined) => {
          if (err) {
            this.logger.error(
              `<<< Error ocurred while writing to the stream.`,
              err
            );
            reject(err);
            return;
          }
        })
      ) {
        duplex.once('drain', () => {
          this.logger.info(
            `<<< Board list watch request has been successfully written to the stream after the handling backpressure.`
          );
          resolve();
        });
      } else {
        process.nextTick(() => {
          this.logger.info(
            `<<< Board list watch request has been successfully written to the stream.`
          );
          resolve();
        });
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
      .on('end', () => this.onStreamDidEndEmitter.fire())
      .on('error', (error) => {
        if (ServiceError.isCancel(error)) {
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
        // Cancelling the stream will kill the discovery `builtin:mdns-discovery process`.
        // The client (this class) will receive a `{"eventType":"quit","error":""}` response from the CLI.
        stream.cancel();
        this.wrapper = undefined;
      },
    };
    this.toDisposeOnStopWatch.pushAll([wrapper]);
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
    return JSON.stringify(object);
  }

  async start(): Promise<void> {
    if (this.watching) {
      // We want to avoid starting the board list watch process multiple
      // times to meet unforeseen consequences
      return;
    }
    const { client, instance } = await this.coreClient;
    const wrapper = await this.createWrapper(client);
    wrapper.stream.on('data', async (resp: BoardListWatchResponse) => {
      this.logger.info('onData', this.toJson(resp));
      if (resp.getEventType() === 'quit') {
        await this.stop();
        return;
      }

      const detectedPort = resp.getPort();
      if (detectedPort) {
        let eventType: 'add' | 'remove' | 'unknown' = 'unknown';
        if (resp.getEventType() === 'add') {
          eventType = 'add';
        } else if (resp.getEventType() === 'remove') {
          eventType = 'remove';
        } else {
          eventType = 'unknown';
        }

        if (eventType === 'unknown') {
          throw new Error(`Unexpected event type: '${resp.getEventType()}'`);
        }

        const oldState = deepClone(this._state);
        const newState = deepClone(this._state);

        const address = (detectedPort as any).getPort().getAddress();
        const protocol = (detectedPort as any).getPort().getProtocol();
        // Different discoveries can detect the same port with different
        // protocols, so we consider the combination of address and protocol
        // to be the id of a certain port to distinguish it from others.
        // If we'd use only the address of a port to store it in a map
        // we can have conflicts the same port is found with multiple
        // protocols.
        const portID = `${address}|${protocol}`;
        const label = (detectedPort as any).getPort().getLabel();
        const protocolLabel = (detectedPort as any)
          .getPort()
          .getProtocolLabel();
        const port = {
          id: portID,
          address,
          addressLabel: label,
          protocol,
          protocolLabel,
        };
        const boards: Board[] = [];
        for (const item of detectedPort.getMatchingBoardsList()) {
          boards.push({
            fqbn: item.getFqbn(),
            name: item.getName() || 'unknown',
            port,
          });
        }

        if (eventType === 'add') {
          if (newState[portID]) {
            const [, knownBoards] = newState[portID];
            this.logger.warn(
              `Port '${Port.toString(
                port
              )}' was already available. Known boards before override: ${JSON.stringify(
                knownBoards
              )}`
            );
          }
          newState[portID] = [port, boards];
        } else if (eventType === 'remove') {
          if (!newState[portID]) {
            this.logger.warn(
              `Port '${Port.toString(port)}' was not available. Skipping`
            );
            return;
          }
          delete newState[portID];
        }

        const oldAvailablePorts = this.getAvailablePorts(oldState);
        const oldAttachedBoards = this.getAttachedBoards(oldState);
        const newAvailablePorts = this.getAvailablePorts(newState);
        const newAttachedBoards = this.getAttachedBoards(newState);
        const event: AttachedBoardsChangeEvent = {
          oldState: {
            ports: oldAvailablePorts,
            boards: oldAttachedBoards,
          },
          newState: {
            ports: newAvailablePorts,
            boards: newAttachedBoards,
          },
        };

        this._state = newState;
        this.notificationService.notifyAttachedBoardsDidChange(event);
      }
    });
    await this.write(
      new BoardListWatchRequest().setInstance(instance),
      wrapper.stream
    );
    this.watching = true;
  }

  getAttachedBoards(state: AvailablePorts = this.state): Board[] {
    const attachedBoards: Board[] = [];
    for (const portID of Object.keys(state)) {
      const [, boards] = state[portID];
      attachedBoards.push(...boards);
    }
    return attachedBoards;
  }

  getAvailablePorts(state: AvailablePorts = this.state): Port[] {
    const availablePorts: Port[] = [];
    for (const portID of Object.keys(state)) {
      const [port] = state[portID];
      availablePorts.push(port);
    }
    return availablePorts;
  }
}
export namespace BoardDiscovery {
  export const StopWatchTimeout = 10_000;
}
