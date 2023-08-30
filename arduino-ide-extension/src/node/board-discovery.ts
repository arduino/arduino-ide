import {
  Disposable,
  DisposableCollection,
  disposableTimeout,
} from '@theia/core/lib/common/disposable';
import { Emitter, Event } from '@theia/core/lib/common/event';
import { ILogger } from '@theia/core/lib/common/logger';
import { deepClone } from '@theia/core/lib/common/objects';
import { Deferred } from '@theia/core/lib/common/promise-util';
import type { Mutable } from '@theia/core/lib/common/types';
import { BackendApplicationContribution } from '@theia/core/lib/node/backend-application';
import { inject, injectable, named } from '@theia/core/shared/inversify';
import { isAbortError } from 'abort-controller-x';
import { isDeepStrictEqual } from 'util';
import { Unknown } from '../common/nls';
import {
  DetectedPort,
  DetectedPorts,
  NotificationServiceServer,
  Port,
} from '../common/protocol';
import type {
  BoardListWatchRequest,
  BoardListWatchResponse,
  DetectedPort as RpcDetectedPort,
  Port as RpcPort,
} from './cli-api/';
import { CoreClientAware, CoreClientProvider } from './core-client-provider';

class BoardWatcher implements Disposable {
  private readonly toDispose: DisposableCollection;
  private readonly onDidUpdateEmitter: Emitter<BoardListWatchResponse>;
  private readonly onDidStartEmitter: Emitter<void>;
  private readonly onDidStopEmitter: Emitter<void>;
  private _watcher: Disposable | undefined;

  constructor(private readonly coreClient: CoreClientProvider.Client) {
    this.onDidUpdateEmitter = new Emitter<BoardListWatchResponse>();
    this.onDidStartEmitter = new Emitter<void>();
    this.onDidStopEmitter = new Emitter<void>();
    this.toDispose = new DisposableCollection(
      Disposable.create(() => this.stop()),
      this.onDidUpdateEmitter,
      this.onDidStartEmitter,
      this.onDidStopEmitter
    );
  }

  get onDidUpdate(): Event<BoardListWatchResponse> {
    return this.onDidUpdateEmitter.event;
  }

  get onDidStart(): Event<void> {
    return this.onDidStartEmitter.event;
  }

  get onDidStop(): Event<void> {
    return this.onDidStopEmitter.event;
  }

  start(): Disposable {
    if (!this._watcher) {
      this._watcher = this.watch();
    }
    return this._watcher;
  }

  stop(): void {
    this._watcher?.dispose();
    this._watcher = undefined;
  }

  dispose(): void {
    this.toDispose.dispose();
  }

  private watch(): Disposable {
    const { client, instance } = this.coreClient;
    const interrupt = new Deferred<void>();
    const req: AsyncIterable<BoardListWatchRequest> = {
      [Symbol.asyncIterator]: async function* (): AsyncGenerator<
        BoardListWatchRequest,
        void,
        unknown
      > {
        yield <BoardListWatchRequest>{ instance, interrupt: !instance };
        await interrupt.promise;
        console.log('board list watch interrupt');
        yield <BoardListWatchRequest>{ instance, interrupt: true };
      },
    };
    const watch = async (): Promise<void> => {
      console.log('watching board list');
      try {
        let didFireStart = false;
        for await (const resp of client.boardListWatch(req)) {
          if (!didFireStart) {
            didFireStart = true;
            this.onDidStartEmitter.fire();
          }
          this.onDidUpdateEmitter.fire(resp);
        }
      } catch (err) {
        if (!isAbortError(err)) {
          throw err;
        }
      } finally {
        this.onDidStopEmitter.fire();
      }
    };
    watch();
    return {
      dispose: (): void => {
        console.log('board list watch dispose');
        interrupt.resolve();
      },
    };
  }
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

  private stopping: Deferred<void> | undefined;
  private watcher: Deferred<BoardWatcher> | undefined;
  private readonly toDisposeOnStopWatch = new DisposableCollection();

  private _detectedPorts: DetectedPorts = {};
  get detectedPorts(): DetectedPorts {
    return this._detectedPorts;
  }

  onStart(): void {
    this.start();
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
    if (!this.watcher) {
      return;
    }
    const watcher = await this.watcher.promise;
    this.stopping = new Deferred();
    this.logger.info('>>> Stopping boards watcher...');
    return new Promise<void>((resolve, reject) => {
      const timeout = disposableTimeout(reject, 10_000);
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
      toDispose.pushAll([timeout, waitForEvent(watcher.onDidStop)]);
      this.logger.info('Canceling boards watcher...');
      this.toDisposeOnStopWatch.dispose();
    });
  }

  private createWatcher(
    coreClient: CoreClientProvider.Client
  ): Deferred<BoardWatcher> {
    if (this.watcher) {
      throw new Error(`Already instantiated the board watcher.`);
    }
    const deferred = new Deferred<BoardWatcher>();
    const watcher = new BoardWatcher(coreClient);
    this.toDisposeOnStopWatch.pushAll([
      watcher,
      watcher.onDidStart(() => deferred.resolve(watcher)),
      watcher.onDidUpdate((resp) => this.onBoardListWatchResponse(resp)),
      Disposable.create(() => {
        this.watcher?.reject(new Error(`Stopping board watcher.`));
        this.watcher = undefined;
      }),
    ]);
    watcher.start();
    return deferred;
  }

  async start(): Promise<void> {
    this.logger.info('start');
    if (this.stopping) {
      this.logger.info('start is stopping wait');
      await this.stopping.promise;
      this.logger.info('start stopped');
    }
    if (this.watcher) {
      this.logger.info('start already watching');
      return this.watcher.promise as Promise<unknown> as Promise<void>;
    }
    const { client, instance } = await this.coreClient;
    this.logger.info('start new deferred');
    this.watcher = this.createWatcher({ client, instance });
    this.logger.info('start request start watch');
    await this.watcher.promise;
    this.logger.info('start resolved watching');
  }

  protected onBoardListWatchResponse(resp: BoardListWatchResponse): void {
    this.logger.info(JSON.stringify(resp));
    const eventType = EventType.parse(resp.eventType);

    if (eventType === EventType.Quit) {
      this.logger.info('quit received');
      this.stop();
      return;
    }

    const rpcDetectedPort = resp.port;
    if (rpcDetectedPort) {
      const detectedPort = this.fromRpc(rpcDetectedPort);
      if (detectedPort) {
        this.fireSoon({ detectedPort, eventType });
      } else {
        this.logger.warn(
          `Could not extract the detected port from ${JSON.stringify(
            rpcDetectedPort
          )}`
        );
      }
    } else if (resp.error) {
      this.logger.error(
        `Could not extract any detected 'port' from the board list watch response. An 'error' has occurred: ${resp.error}`
      );
    }
  }

  private fromRpc(detectedPort: RpcDetectedPort): DetectedPort | undefined {
    const rpcPort = detectedPort.port;
    if (!rpcPort) {
      return undefined;
    }
    const port = createApiPort(rpcPort);
    const boards = detectedPort.matchingBoards.map(
      ({
        // prefer undefined fqbn over empty string
        fqbn = undefined,
        name = Unknown,
      }) => ({
        fqbn,
        name,
      })
    );
    return {
      boards,
      port,
    };
  }

  private fireSoonHandle: NodeJS.Timeout | undefined;
  private readonly bufferedEvents: DetectedPortChangeEvent[] = [];
  private fireSoon(event: DetectedPortChangeEvent): void {
    this.bufferedEvents.push(event);
    clearTimeout(this.fireSoonHandle);
    this.fireSoonHandle = setTimeout(() => {
      const current = deepClone(this.detectedPorts);
      const newState = this.calculateNewState(this.bufferedEvents, current);
      if (!isDeepStrictEqual(current, newState)) {
        this._detectedPorts = newState;
        this.notificationService.notifyDetectedPortsDidChange({
          detectedPorts: this._detectedPorts,
        });
      }
      this.bufferedEvents.length = 0;
    }, 100);
  }

  private calculateNewState(
    events: DetectedPortChangeEvent[],
    prevState: Mutable<DetectedPorts>
  ): DetectedPorts {
    const newState = deepClone(prevState);
    for (const { detectedPort, eventType } of events) {
      const { port, boards } = detectedPort;
      const key = Port.keyOf(port);
      if (eventType === EventType.Add) {
        const alreadyDetectedPort = newState[key];
        if (alreadyDetectedPort) {
          console.warn(
            `Detected a new port that has been already discovered. The old value will be overridden. Old value: ${JSON.stringify(
              alreadyDetectedPort
            )}, new value: ${JSON.stringify(detectedPort)}`
          );
        }
        newState[key] = { port, boards };
      } else if (eventType === EventType.Remove) {
        const alreadyDetectedPort = newState[key];
        if (!alreadyDetectedPort) {
          console.warn(
            `Detected a port removal but it has not been discovered. This is most likely a bug! Detected port was: ${JSON.stringify(
              detectedPort
            )}`
          );
        }
        delete newState[key];
      }
    }
    return newState;
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

interface DetectedPortChangeEvent {
  readonly detectedPort: DetectedPort;
  readonly eventType: EventType.Add | EventType.Remove;
}

export function createApiPort(rpcPort: RpcPort): Port {
  return {
    address: rpcPort.address,
    addressLabel: rpcPort.label,
    protocol: rpcPort.protocol,
    protocolLabel: rpcPort.protocolLabel,
    properties: Port.Properties.create(rpcPort.properties),
    hardwareId: rpcPort.hardwareId || undefined, // prefer undefined over empty string
  };
}
