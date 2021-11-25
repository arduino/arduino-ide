import { injectable, inject, postConstruct, named } from 'inversify';
import { ClientDuplexStream } from '@grpc/grpc-js';
import { ILogger } from '@theia/core/lib/common/logger';
import { deepClone } from '@theia/core/lib/common/objects';
import { CoreClientAware, CoreClientProvider } from './core-client-provider';
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

/**
 * Singleton service for tracking the available ports and board and broadcasting the
 * changes to all connected frontend instances. \
 * Unlike other services, this is not connection scoped.
 */
@injectable()
export class BoardDiscovery extends CoreClientAware {
  @inject(ILogger)
  @named('discovery')
  protected discoveryLogger: ILogger;

  @inject(NotificationServiceServer)
  protected readonly notificationService: NotificationServiceServer;

  // Used to know if the board watch process is already running to avoid
  // starting it multiple times
  private watching: boolean;

  protected boardWatchDuplex:
    | ClientDuplexStream<BoardListWatchRequest, BoardListWatchResponse>
    | undefined;

  /**
   * Keys are the `address` of the ports. \
   * The `protocol` is ignored because the board detach event does not carry the protocol information,
   * just the address.
   * ```json
   * {
   *  "type": "remove",
   *  "address": "/dev/cu.usbmodem14101"
   * }
   * ```
   */
  protected _state: AvailablePorts = {};
  get state(): AvailablePorts {
    return this._state;
  }

  @postConstruct()
  protected async init(): Promise<void> {
    await this.coreClientProvider.initialized;
    const coreClient = await this.coreClient();
    this.startBoardListWatch(coreClient);
  }

  startBoardListWatch(coreClient: CoreClientProvider.Client): void {
    if (this.watching) {
      // We want to avoid starting the board list watch process multiple
      // times to meet unforseen consequences
      return
    }
    this.watching = true;
    const { client, instance } = coreClient;
    const req = new BoardListWatchRequest();
    req.setInstance(instance);
    this.boardWatchDuplex = client.boardListWatch();
    this.boardWatchDuplex.on('end', () => {
      this.watching = false;
      console.info('board watch ended')
    })
    this.boardWatchDuplex.on('data', (resp: BoardListWatchResponse) => {
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
        const label = (detectedPort as any).getPort().getLabel();;
        const port = { address, protocol, label };
        const boards: Board[] = [];
        for (const item of detectedPort.getMatchingBoardsList()) {
          boards.push({
            fqbn: item.getFqbn(),
            name: item.getName() || 'unknown',
            port,
          });
        }

        if (eventType === 'add') {
          if (newState[port.address]) {
            const [, knownBoards] = newState[port.address];
            console.warn(
              `Port '${port.address}' was already available. Known boards before override: ${JSON.stringify(
                knownBoards
              )}`
            );
          }
          newState[port.address] = [port, boards];
        } else if (eventType === 'remove') {
          if (!newState[port.address]) {
            console.warn(`Port '${port.address}' was not available. Skipping`);
            return;
          }
          delete newState[port.address];
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
        this.notificationService.notifyAttachedBoardsChanged(event);
      }
    });
    this.boardWatchDuplex.write(req);
  }

  getAttachedBoards(state: AvailablePorts = this.state): Board[] {
    const attachedBoards: Board[] = [];
    for (const address of Object.keys(state)) {
      const [, boards] = state[address];
      attachedBoards.push(...boards);
    }
    return attachedBoards;
  }

  getAvailablePorts(state: AvailablePorts = this.state): Port[] {
    const availablePorts: Port[] = [];
    for (const address of Object.keys(state)) {
      const [port] = state[address];
      availablePorts.push(port);
    }
    return availablePorts;
  }
}
