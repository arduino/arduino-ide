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
import { v4 } from 'uuid';
import { ServiceError } from './service-error';
import { BackendApplicationContribution } from '@theia/core/lib/node';
import { Deferred } from '@theia/core/lib/common/promise-util';

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

  public setUploadInProgress(uploadAttemptInProgress: boolean): void {
    this.uploadInProgress = uploadAttemptInProgress;
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
    return JSON.stringify(object);
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
    wrapper.stream.on('data', async (resp: BoardListWatchResponse) => {
      this.logger.info('onData', this.toJson(resp));
      if (resp.getEventType() === 'quit') {
        this.logger.info('quit received');
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

        const oldState = deepClone(this._availablePorts);
        const newState = deepClone(this._availablePorts);

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
          uploadInProgress: this.uploadInProgress,
        };

        this._availablePorts = newState;
        this.notificationService.notifyAttachedBoardsDidChange(event);
      }
    });
    this.logger.info('start request start watch');
    await this.requestStartWatch(
      new BoardListWatchRequest().setInstance(instance),
      wrapper.stream
    );
    this.logger.info('start requested start watch');
    this.watching.resolve();
    this.logger.info('start resolved watching');
  }

  getAttachedBoards(state: AvailablePorts = this.availablePorts): Board[] {
    const attachedBoards: Board[] = [];
    for (const portID of Object.keys(state)) {
      const [, boards] = state[portID];
      attachedBoards.push(...boards);
    }
    return attachedBoards;
  }

  getAvailablePorts(state: AvailablePorts = this.availablePorts): Port[] {
    const availablePorts: Port[] = [];
    for (const portID of Object.keys(state)) {
      const [port] = state[portID];
      availablePorts.push(port);
    }
    return availablePorts;
  }
}
