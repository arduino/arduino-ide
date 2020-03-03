import { injectable, inject, postConstruct, named } from 'inversify';
import { ILogger } from '@theia/core/lib/common/logger';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { BoardsService, BoardsPackage, Board, BoardsServiceClient, Port, BoardDetails, Tool, ConfigOption, ConfigValue } from '../common/protocol';
import {
    PlatformSearchReq, PlatformSearchResp, PlatformInstallReq, PlatformInstallResp, PlatformListReq,
    PlatformListResp, Platform, PlatformUninstallResp, PlatformUninstallReq
} from './cli-protocol/commands/core_pb';
import { CoreClientProvider } from './core-client-provider';
import { BoardListReq, BoardListResp, BoardDetailsReq, BoardDetailsResp } from './cli-protocol/commands/board_pb';
import { ToolOutputServiceServer } from '../common/protocol/tool-output-service';
import { Installable } from '../common/protocol/installable';

@injectable()
export class BoardsServiceImpl implements BoardsService {

    @inject(ILogger)
    protected logger: ILogger;

    @inject(ILogger)
    @named('discovery')
    protected discoveryLogger: ILogger;

    @inject(CoreClientProvider)
    protected readonly coreClientProvider: CoreClientProvider;

    @inject(ToolOutputServiceServer)
    protected readonly toolOutputService: ToolOutputServiceServer;

    protected discoveryInitialized = false;
    protected discoveryTimer: NodeJS.Timer | undefined;
    /**
     * Poor man's serial discovery:
     * Stores the state of the currently discovered and attached boards.
     * This state is updated via periodical polls. If there diff, a change event will be sent out to the frontend.
     */
    protected attachedBoards: Board[] = [];
    protected availablePorts: Port[] = [];
    protected started = new Deferred<void>();
    protected client: BoardsServiceClient | undefined;

    @postConstruct()
    protected async init(): Promise<void> {
        this.discoveryTimer = setInterval(() => {
            this.discoveryLogger.trace('Discovering attached boards and available ports...');
            this.doGetAttachedBoardsAndAvailablePorts()
                .then(({ boards, ports }) => {
                    const update = (oldBoards: Board[], newBoards: Board[], oldPorts: Port[], newPorts: Port[], message: string) => {
                        this.attachedBoards = newBoards;
                        this.availablePorts = newPorts;
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
                        this.started.resolve();
                    } else {
                        Promise.all([
                            this.getAttachedBoards(),
                            this.getAvailablePorts()
                        ]).then(([currentBoards, currentPorts]) => {
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
                })
                .catch(error => {
                    this.logger.error('Unexpected error when polling boards and ports.', error);
                });
        }, 1000);
    }

    setClient(client: BoardsServiceClient | undefined): void {
        this.client = client;
    }

    dispose(): void {
        this.logger.info('>>> Disposing boards service...');
        if (this.discoveryTimer !== undefined) {
            clearInterval(this.discoveryTimer);
        }
        this.logger.info('<<< Disposed boards service.');
        this.client = undefined;
    }

    async getAttachedBoards(): Promise<Board[]> {
        await this.started.promise;
        return this.attachedBoards;
    }

    async getAvailablePorts(): Promise<Port[]> {
        await this.started.promise;
        return this.availablePorts;
    }

    private async doGetAttachedBoardsAndAvailablePorts(): Promise<{ boards: Board[], ports: Port[] }> {
        const boards: Board[] = [];
        const ports: Port[] = [];

        const coreClient = await this.coreClientProvider.client();
        if (!coreClient) {
            return { boards, ports };
        }

        const { client, instance } = coreClient;
        const req = new BoardListReq();
        req.setInstance(instance);
        const resp = await new Promise<BoardListResp | undefined>(resolve => {
            client.boardList(req, (err, resp) => {
                if (err) {
                    this.logger.error(err);
                    resolve(undefined);
                    return;
                }
                resolve(resp);
            });
        });
        if (!resp) {
            return { boards, ports };
        }
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
                const port = { address, protocol };
                boards.push({ name, fqbn, port });
            }
        }
        // TODO: remove mock board!
        // boards.push(...[
        //     <AttachedSerialBoard>{ name: 'Arduino/Genuino Uno', fqbn: 'arduino:avr:uno', port: '/dev/cu.usbmodem14201' },
        //     <AttachedSerialBoard>{ name: 'Arduino/Genuino Uno', fqbn: 'arduino:avr:uno', port: '/dev/cu.usbmodem142xx' },
        // ]);
        return { boards, ports };
    }

    async getBoardDetails(options: { fqbn: string }): Promise<BoardDetails> {
        const coreClient = await this.coreClientProvider.client();
        if (!coreClient) {
            throw new Error(`Cannot acquire core client provider.`);
        }
        const { client, instance } = coreClient;

        const { fqbn } = options;
        const req = new BoardDetailsReq();
        req.setInstance(instance);
        req.setFqbn(fqbn);
        const resp = await new Promise<BoardDetailsResp>((resolve, reject) => client.boardDetails(req, (err, resp) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(resp);
        }));

        const requiredTools = resp.getRequiredToolsList().map(t => <Tool>{
            name: t.getName(),
            packager: t.getPackager(),
            version: t.getVersion()
        });

        const configOptions = resp.getConfigOptionsList().map(c => <ConfigOption>{
            label: c.getOptionLabel(),
            option: c.getOption(),
            values: c.getValuesList().map(v => <ConfigValue>{
                value: v.getValue(),
                label: v.getValueLabel(),
                selected: v.getSelected()
            })
        });

        return {
            fqbn,
            requiredTools,
            configOptions
        };
    }

    async getBoardPackage(options: { id: string }): Promise<BoardsPackage | undefined> {
        const { id: expectedId } = options;
        if (!expectedId) {
            return undefined;
        }
        const packages = await this.search({ query: expectedId });
        return packages.find(({ id }) => id === expectedId);
    }

    async getContainerBoardPackage(options: { fqbn: string }): Promise<BoardsPackage | undefined> {
        const { fqbn: expectedFqbn } = options;
        if (!expectedFqbn) {
            return undefined;
        }
        const packages = await this.search({});
        return packages.find(({ boards }) => boards.some(({ fqbn }) => fqbn === expectedFqbn));
    }

    async searchBoards(options: { query?: string }): Promise<Array<Board & { packageName: string }>> {
        const query = (options.query || '').toLocaleLowerCase();
        const results = await this.search(options);
        return results.map(item => item.boards.map(board => ({ ...board, packageName: item.name })))
            .reduce((acc, curr) => acc.concat(curr), [])
            .filter(board => board.name.toLocaleLowerCase().indexOf(query) !== -1)
            .sort(Board.compare);
    }

    async search(options: { query?: string }): Promise<BoardsPackage[]> {
        const coreClient = await this.coreClientProvider.client();
        if (!coreClient) {
            return [];
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
        req.setAllVersions(true);
        req.setInstance(instance);
        const resp = await new Promise<PlatformSearchResp>((resolve, reject) => client.platformSearch(req, (err, resp) => (!!err ? reject : resolve)(!!err ? err : resp)));
        const packages = new Map<string, BoardsPackage>();
        const toPackage = (platform: Platform) => {
            let installedVersion: string | undefined;
            const matchingPlatform = installedPlatforms.find(ip => ip.getId() === platform.getId());
            if (!!matchingPlatform) {
                installedVersion = matchingPlatform.getInstalled();
            }
            return {
                id: platform.getId(),
                name: platform.getName(),
                author: platform.getMaintainer(),
                availableVersions: [platform.getLatest()],
                description: platform.getBoardsList().map(b => b.getName()).join(", "),
                installable: true,
                summary: "Boards included in this package:",
                installedVersion,
                boards: platform.getBoardsList().map(b => <Board>{ name: b.getName(), fqbn: b.getFqbn() }),
                moreInfoLink: platform.getWebsite()
            }
        }

        // We must group the cores by ID, and sort platforms by, first the installed version, then version alphabetical order.
        // Otherwise we lose the FQBN information.
        const groupedById: Map<string, Platform[]> = new Map();
        for (const platform of resp.getSearchOutputList()) {
            const id = platform.getId();
            if (groupedById.has(id)) {
                groupedById.get(id)!.push(platform);
            } else {
                groupedById.set(id, [platform]);
            }
        }
        const installedAwareVersionComparator = (left: Platform, right: Platform) => {
            // XXX: we cannot rely on `platform.getInstalled()`, it is always an empty string.
            const leftInstalled = !!installedPlatforms.find(ip => ip.getId() === left.getId() && ip.getInstalled() === left.getLatest());
            const rightInstalled = !!installedPlatforms.find(ip => ip.getId() === right.getId() && ip.getInstalled() === right.getLatest());
            if (leftInstalled && !rightInstalled) {
                return -1;
            }
            if (!leftInstalled && rightInstalled) {
                return 1;
            }
            return Installable.Version.COMPARATOR(left.getLatest(), right.getLatest()); // Higher version comes first.
        }
        for (const id of groupedById.keys()) {
            groupedById.get(id)!.sort(installedAwareVersionComparator);
        }

        for (const id of groupedById.keys()) {
            for (const platform of groupedById.get(id)!) {
                const id = platform.getId();
                const pkg = packages.get(id);
                if (pkg) {
                    pkg.availableVersions.push(platform.getLatest());
                    pkg.availableVersions.sort(Installable.Version.COMPARATOR);
                } else {
                    packages.set(id, toPackage(platform));
                }
            }
        }

        return [...packages.values()];
    }

    async install(options: { item: BoardsPackage, version?: Installable.Version }): Promise<void> {
        const pkg = options.item;
        const version = !!options.version ? options.version : pkg.availableVersions[0];
        const coreClient = await this.coreClientProvider.client();
        if (!coreClient) {
            return;
        }
        const { client, instance } = coreClient;

        const [platform, architecture] = pkg.id.split(":");

        const req = new PlatformInstallReq();
        req.setInstance(instance);
        req.setArchitecture(architecture);
        req.setPlatformPackage(platform);
        req.setVersion(version);

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
            const packages = await this.search({});
            const updatedPackage = packages.find(({ id }) => id === pkg.id) || pkg;
            this.client.notifyBoardInstalled({ pkg: updatedPackage });
        }
        console.info("Board installation done", pkg);
    }

    async uninstall(options: { item: BoardsPackage }): Promise<void> {
        const pkg = options.item;
        const coreClient = await this.coreClientProvider.client();
        if (!coreClient) {
            return;
        }
        const { client, instance } = coreClient;

        const [platform, architecture] = pkg.id.split(":");

        const req = new PlatformUninstallReq();
        req.setInstance(instance);
        req.setArchitecture(architecture);
        req.setPlatformPackage(platform);

        console.info("Starting board uninstallation", pkg);
        let logged = false;
        const resp = client.platformUninstall(req);
        resp.on('data', (_: PlatformUninstallResp) => {
            if (!logged) {
                this.toolOutputService.publishNewOutput("board uninstall", `uninstalling ${pkg.id}\n`)
                logged = true;
            }
        })
        await new Promise<void>((resolve, reject) => {
            resp.on('end', resolve);
            resp.on('error', reject);
        });
        if (this.client) {
            // Here, unlike at `install` we send out the argument `pkg`. Otherwise, we would not know about the board FQBN.
            this.client.notifyBoardUninstalled({ pkg });
        }
        console.info("Board uninstallation done", pkg);
    }

}
