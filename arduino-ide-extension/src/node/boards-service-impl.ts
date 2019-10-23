import * as PQueue from 'p-queue';
import { injectable, inject, postConstruct, named } from 'inversify';
import { ILogger } from '@theia/core/lib/common/logger';
import { BoardsService, AttachedSerialBoard, BoardPackage, Board, AttachedNetworkBoard, BoardsServiceClient, Port } from '../common/protocol/boards-service';
import { PlatformSearchReq, PlatformSearchResp, PlatformInstallReq, PlatformInstallResp, PlatformListReq, PlatformListResp } from './cli-protocol/commands/core_pb';
import { CoreClientProvider } from './core-client-provider';
import { BoardListReq, BoardListResp } from './cli-protocol/commands/board_pb';
import { ToolOutputServiceServer } from '../common/protocol/tool-output-service';

@injectable()
export class BoardsServiceImpl implements BoardsService {

    @inject(ILogger)
    @named('discovery')
    protected discoveryLogger: ILogger;

    @inject(CoreClientProvider)
    protected readonly coreClientProvider: CoreClientProvider;

    @inject(ToolOutputServiceServer)
    protected readonly toolOutputService: ToolOutputServiceServer;

    protected discoveryInitialized = false;
    protected discoveryTimer: NodeJS.Timeout | undefined;
    /**
     * Poor man's serial discovery:
     * Stores the state of the currently discovered, attached boards.
     * This state is updated via periodical polls.
     */
    protected _attachedBoards: { boards: Board[] } = { boards: [] };
    protected _availablePorts: { ports: Port[] } = { ports: [] };
    protected client: BoardsServiceClient | undefined;
    protected readonly queue = new PQueue({ autoStart: true, concurrency: 1 });

    @postConstruct()
    protected async init(): Promise<void> {
        this.discoveryTimer = setInterval(() => {
            this.discoveryLogger.trace('Discovering attached boards and available ports...');
            this.doGetAttachedBoardsAndAvailablePorts().then(({ boards, ports }) => {
                const update = (oldBoards: Board[], newBoards: Board[], oldPorts: Port[], newPorts: Port[], message: string) => {
                    this._attachedBoards = { boards: newBoards };
                    this._availablePorts = { ports: newPorts };
                    this.discoveryLogger.info(`${message} - Discovered boards: ${JSON.stringify(newBoards)} and available ports: ${JSON.stringify(newPorts)}`);
                    if (this.client) {
                        this.client.notifyAttachedBoardsChanged({
                            oldState: {
                                boards: oldBoards,
                                ports: oldPorts
                            },
                            newState: {
                                boards: newBoards,
                                ports: newPorts
                            }
                        });
                    }
                }
                const sortedBoards = boards.sort(Board.compare);
                const sortedPorts = ports.sort(Port.compare);
                this.discoveryLogger.trace(`Discovery done. Boards: ${JSON.stringify(sortedBoards)}. Ports: ${sortedPorts}`);
                if (!this.discoveryInitialized) {
                    update([], sortedBoards, [], sortedPorts, 'Initialized attached boards and available ports.');
                    this.discoveryInitialized = true;
                } else {
                    Promise.all([
                        this.getAttachedBoards(),
                        this.getAvailablePorts()
                    ]).then(([{ boards: currentBoards }, { ports: currentPorts }]) => {
                        this.discoveryLogger.trace(`Updating discovered boards... ${JSON.stringify(currentBoards)}`);
                        if (currentBoards.length !== sortedBoards.length || currentPorts.length !== sortedPorts.length) {
                            update(currentBoards, sortedBoards, currentPorts, sortedPorts, 'Updated discovered boards and available ports.');
                            return;
                        }
                        // `currentBoards` is already sorted.
                        for (let i = 0; i < sortedBoards.length; i++) {
                            if (Board.compare(sortedBoards[i], currentBoards[i]) !== 0) {
                                update(currentBoards, sortedBoards, currentPorts, sortedPorts, 'Updated discovered boards.');
                                return;
                            }
                        }
                        for (let i = 0; i < sortedPorts.length; i++) {
                            if (Port.compare(sortedPorts[i], currentPorts[i]) !== 0) {
                                update(currentBoards, sortedBoards, currentPorts, sortedPorts, 'Updated discovered boards.');
                                return;
                            }
                        }
                        this.discoveryLogger.trace('No new boards were discovered.');
                    });
                }
            });
        }, 1000);
    }

    setClient(client: BoardsServiceClient | undefined): void {
        this.client = client;
    }

    dispose(): void {
        if (this.discoveryTimer !== undefined) {
            clearInterval(this.discoveryTimer);
        }
    }

    async getAttachedBoards(): Promise<{ boards: Board[] }> {
        return this._attachedBoards;
    }

    async getAvailablePorts(): Promise<{ ports: Port[] }> {
        return this._availablePorts;
    }

    private async doGetAttachedBoardsAndAvailablePorts(): Promise<{ boards: Board[], ports: Port[] }> {
        return this.queue.add(() => {
            return new Promise<{ boards: Board[], ports: Port[] }>(async resolve => {
                const coreClient = await this.coreClientProvider.getClient();
                const boards: Board[] = [];
                const ports: Port[] = [];
                if (!coreClient) {
                    resolve({ boards, ports });
                    return;
                }

                const { client, instance } = coreClient;
                const req = new BoardListReq();
                req.setInstance(instance);
                const resp = await new Promise<BoardListResp>((resolve, reject) => client.boardList(req, (err, resp) => (!!err ? reject : resolve)(!!err ? err : resp)));
                const portsList = resp.getPortsList();
                // TODO: remove unknown board mocking!
                // You also have to manually import `DetectedPort`.
                // const unknownPortList = new DetectedPort();
                // unknownPortList.setAddress(platform() === 'win32' ? 'COM3' : platform() === 'darwin' ? '/dev/cu.usbmodem94401' : '/dev/ttyACM0');
                // unknownPortList.setProtocol('serial');
                // unknownPortList.setProtocolLabel('Serial Port (USB)');
                // portsList.push(unknownPortList);

                for (const portList of portsList) {
                    const protocol = Port.Protocol.toProtocol(portList.getProtocol());
                    const address = portList.getAddress();
                    // Available ports can exist with unknown attached boards.
                    // The `BoardListResp` looks like this for a known attached board:
                    // [
                    //     {
                    //         "address": "COM10",
                    //         "protocol": "serial",
                    //         "protocol_label": "Serial Port (USB)",
                    //         "boards": [
                    //             {
                    //                 "name": "Arduino MKR1000",
                    //                 "FQBN": "arduino:samd:mkr1000"
                    //             }
                    //         ]
                    //     }
                    // ]
                    // And the `BoardListResp` looks like this for an unknown board:
                    // [
                    //     {
                    //         "address": "COM9",
                    //         "protocol": "serial",
                    //         "protocol_label": "Serial Port (USB)",
                    //     }
                    // ]
                    ports.push({ protocol, address });
                    for (const board of portList.getBoardsList()) {
                        const name = board.getName() || 'unknown';
                        const fqbn = board.getFqbn();
                        const port = address;
                        if (protocol === 'serial') {
                            boards.push(<AttachedSerialBoard>{
                                name,
                                fqbn,
                                port
                            });
                        } else if (protocol === 'network') { // We assume, it is a `network` board.
                            boards.push(<AttachedNetworkBoard>{
                                name,
                                fqbn,
                                address,
                                port
                            });
                        } else {
                            console.warn(`Unknown protocol for port: ${address}.`);
                        }
                    }
                }
                // TODO: remove mock board!
                // boards.push(...[
                //     <AttachedSerialBoard>{ name: 'Arduino/Genuino Uno', fqbn: 'arduino:avr:uno', port: '/dev/cu.usbmodem14201' },
                //     <AttachedSerialBoard>{ name: 'Arduino/Genuino Uno', fqbn: 'arduino:avr:uno', port: '/dev/cu.usbmodem142xx' },
                // ]);
                resolve({ boards, ports });
            })
        });
    }



    async search(options: { query?: string }): Promise<{ items: BoardPackage[] }> {
        const coreClient = await this.coreClientProvider.getClient();
        if (!coreClient) {
            return { items: [] };
        }
        const { client, instance } = coreClient;

        const installedPlatformsReq = new PlatformListReq();
        installedPlatformsReq.setInstance(instance);
        const installedPlatformsResp = await new Promise<PlatformListResp>((resolve, reject) =>
            client.platformList(installedPlatformsReq, (err, resp) => (!!err ? reject : resolve)(!!err ? err : resp))
        );
        const installedPlatforms = installedPlatformsResp.getInstalledPlatformList();

        const req = new PlatformSearchReq();
        req.setSearchArgs(options.query || "");
        req.setInstance(instance);
        const resp = await new Promise<PlatformSearchResp>((resolve, reject) => client.platformSearch(req, (err, resp) => (!!err ? reject : resolve)(!!err ? err : resp)));

        let items = resp.getSearchOutputList().map(item => {
            let installedVersion: string | undefined;
            const matchingPlatform = installedPlatforms.find(ip => ip.getId() === item.getId());
            if (!!matchingPlatform) {
                installedVersion = matchingPlatform.getInstalled();
            }

            const result: BoardPackage = {
                id: item.getId(),
                name: item.getName(),
                author: item.getMaintainer(),
                availableVersions: [item.getLatest()],
                description: item.getBoardsList().map(b => b.getName()).join(", "),
                installable: true,
                summary: "Boards included in this package:",
                installedVersion,
                boards: item.getBoardsList().map(b => <Board>{ name: b.getName(), fqbn: b.getFqbn() }),
                moreInfoLink: item.getWebsite()
            }
            return result;
        });

        return { items };
    }

    async install(pkg: BoardPackage): Promise<void> {
        const coreClient = await this.coreClientProvider.getClient();
        if (!coreClient) {
            return;
        }
        const { client, instance } = coreClient;

        const [platform, boardName] = pkg.id.split(":");

        const req = new PlatformInstallReq();
        req.setInstance(instance);
        req.setArchitecture(boardName);
        req.setPlatformPackage(platform);
        req.setVersion(pkg.availableVersions[0]);

        console.info("Starting board installation", pkg);
        const resp = client.platformInstall(req);
        resp.on('data', (r: PlatformInstallResp) => {
            const prog = r.getProgress();
            if (prog && prog.getFile()) {
                this.toolOutputService.publishNewOutput("board download", `downloading ${prog.getFile()}\n`)
            }
        });
        await new Promise<void>((resolve, reject) => {
            resp.on('end', resolve);
            resp.on('error', reject);
        });
        if (this.client) {
            this.client.notifyBoardInstalled({ pkg });
        }
        console.info("Board installation done", pkg);
    }

}
