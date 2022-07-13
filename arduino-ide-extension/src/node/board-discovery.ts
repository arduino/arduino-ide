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
import { Emitter, Event } from '@theia/core/lib/common/event';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { Disposable } from '@theia/core/shared/vscode-languageserver-protocol';
import { ArduinoCoreServiceClient } from './cli-protocol/cc/arduino/cli/commands/v1/commands_grpc_pb';
import { ServiceError } from './service-error';
import { BackendApplicationContribution } from '@theia/core/lib/node/backend-application';
import { Deferred } from '@theia/core/lib/common/promise-util';

type Duplex = ClientDuplexStream<BoardListWatchRequest, BoardListWatchResponse>;
interface DisposableDuplex extends Disposable {
  readonly stream: Duplex;
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
  @named('discovery')
  private readonly logger: ILogger;

  @inject(NotificationServiceServer)
  private readonly notificationService: NotificationServiceServer;

  private watching: Deferred<void> | undefined;
  private stopping: Deferred<void> | undefined;
  private duplex: DisposableDuplex | undefined;
  private readonly onStreamDidEndEmitter = new Emitter<void>(); // sent from the CLI when the discovery process is killed for example after the indexes update and the core client re-initialization.
  private readonly onStreamDidCancelEmitter = new Emitter<void>(); // when the watcher is canceled by the IDE2
  private readonly toDisposeOnStopWatch = new DisposableCollection();

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
  private _state: AvailablePorts = {};
  get state(): AvailablePorts {
    return this._state;
  }

  onStart(): void {
    this.start();
    this.onClientDidRefresh(() => this.stop().then(() => this.start()));
  }

  onStop(): void {
    this.stop();
  }

  async stop(): Promise<void> {
    this.logger.debug('stop');
    if (this.stopping) {
      this.logger.debug('stop already stopping');
      return this.stopping.promise;
    }
    if (!this.watching) {
      return;
    }
    this.stopping = new Deferred();
    this.logger.debug('>>> Stopping boards watcher...');
    return new Promise<void>((resolve, reject) => {
      const timeout = this.createTimeout(10_000, reject);
      const toDispose = new DisposableCollection();
      const waitForEvent = (event: Event<unknown>, name: string) =>
        event(() => {
          this.logger.debug(`stop received event: ${name}`);
          toDispose.dispose();
          this.stopping?.resolve();
          this.stopping = undefined;
          this.logger.debug('cancelled boards watcher');
          resolve();
        });
      toDispose.pushAll([
        timeout,
        waitForEvent(this.onStreamDidEndEmitter.event, 'end'),
        waitForEvent(this.onStreamDidCancelEmitter.event, 'cancel'),
      ]);
      this.logger.debug('Canceling boards watcher...');
      this.toDisposeOnStopWatch.dispose();
    });
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

  private async createDuplex(
    client: ArduinoCoreServiceClient
  ): Promise<DisposableDuplex> {
    if (this.duplex) {
      throw new Error(`Duplex was already set.`);
    }
    const stream = client
      .boardListWatch()
      .on('end', () => {
        this.logger.debug('received end'); // after the core client re-initialization, the CLI kills the watcher process.
        this.onStreamDidEndEmitter.fire();
      })
      .on('error', (error) => {
        this.logger.debug('error received');
        if (ServiceError.isCancel(error)) {
          this.logger.debug('cancel error received!');
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
      dispose: () => {
        this.logger.debug('disposing requesting cancel');
        stream.cancel();
        this.logger.debug('disposing canceled');
        this.duplex = undefined;
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
    return JSON.stringify(object);
  }

  async start(): Promise<void> {
    this.logger.debug('start');
    if (this.stopping) {
      this.logger.debug('start is stopping wait');
      await this.stopping.promise;
      this.logger.debug('start stopped');
    }
    if (this.watching) {
      this.logger.debug('start already watching');
      return this.watching.promise;
    }
    this.watching = new Deferred();
    this.logger.debug('start new deferred');
    const { client, instance } = await this.coreClient;
    const wrapper = await this.createDuplex(client);
    wrapper.stream.on('data', async (resp: BoardListWatchResponse) => {
      this.logger.debug('onData', this.toJson(resp));
      if (resp.getEventType() === 'quit') {
        this.logger.debug('quit received');
        this.stop();
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
    this.logger.debug('start request start watch');
    await this.requestStartWatch(
      new BoardListWatchRequest().setInstance(instance),
      wrapper.stream
    );
    this.logger.debug('start requested start watch');
    this.watching.resolve();
    this.logger.debug('start resolved watching');
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
