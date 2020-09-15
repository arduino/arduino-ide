import { injectable, inject, postConstruct, named } from 'inversify';
import { ILogger } from '@theia/core/lib/common/logger';
import { Deferred } from '@theia/core/lib/common/promise-util';
import {
    BoardsService,
    BoardsPackage, Board, Port, BoardDetails, Tool, ConfigOption, ConfigValue, Programmer, OutputService, NotificationServiceServer, AttachedBoardsChangeEvent
} from '../common/protocol';
import {
    PlatformSearchReq, PlatformSearchResp, PlatformInstallReq, PlatformInstallResp, PlatformListReq,
    PlatformListResp, Platform, PlatformUninstallResp, PlatformUninstallReq
} from './cli-protocol/commands/core_pb';
import { CoreClientProvider } from './core-client-provider';
import { BoardListReq, BoardListResp, BoardDetailsReq, BoardDetailsResp } from './cli-protocol/commands/board_pb';
import { Installable } from '../common/protocol/installable';
import { ListProgrammersAvailableForUploadReq, ListProgrammersAvailableForUploadResp } from './cli-protocol/commands/upload_pb';
import { Disposable } from '@theia/core/lib/common/disposable';

@injectable()
export class BoardsServiceImpl implements BoardsService, Disposable {

    @inject(ILogger)
    protected logger: ILogger;

    @inject(ILogger)
    @named('discovery')
    protected discoveryLogger: ILogger;

    @inject(CoreClientProvider)
    protected readonly coreClientProvider: CoreClientProvider;

    @inject(OutputService)
    protected readonly outputService: OutputService;

    @inject(NotificationServiceServer)
    protected readonly notificationService: NotificationServiceServer;

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

    @postConstruct()
    protected async init(): Promise<void> {
        this.discoveryTimer = setInterval(() => {
            this.discoveryLogger.trace('Discovering attached boards and available ports...');
            this.doGetAttachedBoardsAndAvailablePorts()
                .then(({ boards, ports }) => {
                    const update = (oldBoards: Board[], newBoards: Board[], oldPorts: Port[], newPorts: Port[], message: string) => {
                        this.attachedBoards = newBoards;
                        this.availablePorts = newPorts;
                        const event = {
                            oldState: {
                                boards: oldBoards,
                                ports: oldPorts
                            },
                            newState: {
                                boards: newBoards,
                                ports: newPorts
                            }
                        };
                        this.discoveryLogger.info(`${message}`);
                        this.discoveryLogger.info(`${AttachedBoardsChangeEvent.toString(event)}`);
                        this.notificationService.notifyAttachedBoardsChanged(event);
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

    dispose(): void {
        this.logger.info('>>> Disposing boards service...');
        if (this.discoveryTimer !== undefined) {
            this.logger.info('>>> Disposing the boards discovery...');
            clearInterval(this.discoveryTimer);
            this.logger.info('<<< Disposed the boards discovery.');
        }
        this.logger.info('<<< Disposed boards service.');
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
            //         'address': 'COM10',
            //         'protocol': 'serial',
            //         'protocol_label': 'Serial Port (USB)',
            //         'boards': [
            //             {
            //                 'name': 'Arduino MKR1000',
            //                 'FQBN': 'arduino:samd:mkr1000'
            //             }
            //         ]
            //     }
            // ]
            // And the `BoardListResp` looks like this for an unknown board:
            // [
            //     {
            //         'address': 'COM9',
            //         'protocol': 'serial',
            //         'protocol_label': 'Serial Port (USB)',
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
        const detailsReq = new BoardDetailsReq();
        detailsReq.setInstance(instance);
        detailsReq.setFqbn(fqbn);
        const detailsResp = await new Promise<BoardDetailsResp | undefined>((resolve, reject) => client.boardDetails(detailsReq, (err, resp) => {
            if (err) {
                // Required cores are not installed manually: https://github.com/arduino/arduino-cli/issues/954
                if (err.message.indexOf('missing platform release') !== -1 && err.message.indexOf('referenced by board') !== -1) {
                    resolve(undefined);
                    return;
                }
                reject(err);
                return;
            }
            resolve(resp);
        }));

        if (!detailsResp) {
            return {
                fqbn,
                configOptions: [],
                programmers: [],
                requiredTools: []
            };
        }

        const requiredTools = detailsResp.getToolsdependenciesList().map(t => <Tool>{
            name: t.getName(),
            packager: t.getPackager(),
            version: t.getVersion()
        });

        const configOptions = detailsResp.getConfigOptionsList().map(c => <ConfigOption>{
            label: c.getOptionLabel(),
            option: c.getOption(),
            values: c.getValuesList().map(v => <ConfigValue>{
                value: v.getValue(),
                label: v.getValueLabel(),
                selected: v.getSelected()
            })
        });

        const listReq = new ListProgrammersAvailableForUploadReq();
        listReq.setInstance(instance);
        listReq.setFqbn(fqbn);
        const listResp = await new Promise<ListProgrammersAvailableForUploadResp>((resolve, reject) => client.listProgrammersAvailableForUpload(listReq, (err, resp) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(resp);
        }));

        const programmers = listResp.getProgrammersList().map(p => <Programmer>{
            id: p.getId(),
            name: p.getName(),
            platform: p.getPlatform()
        });

        return {
            fqbn,
            requiredTools,
            configOptions,
            programmers
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

    async allBoards(options: {}): Promise<Array<Board & { packageName: string }>> {
        const results = await this.search(options);
        return results.map(item => item.boards.map(board => ({ ...board, packageName: item.name })))
            .reduce((acc, curr) => acc.concat(curr), []);
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
        req.setSearchArgs(options.query || '');
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
                description: platform.getBoardsList().map(b => b.getName()).join(', '),
                installable: true,
                summary: 'Boards included in this package:',
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
        const item = options.item;
        const version = !!options.version ? options.version : item.availableVersions[0];
        const coreClient = await this.coreClientProvider.client();
        if (!coreClient) {
            return;
        }
        const { client, instance } = coreClient;

        const [platform, architecture] = item.id.split(':');

        const req = new PlatformInstallReq();
        req.setInstance(instance);
        req.setArchitecture(architecture);
        req.setPlatformPackage(platform);
        req.setVersion(version);

        console.info('>>> Starting boards package installation...', item);
        const resp = client.platformInstall(req);
        resp.on('data', (r: PlatformInstallResp) => {
            const prog = r.getProgress();
            if (prog && prog.getFile()) {
                this.outputService.append({ name: 'board download', chunk: `downloading ${prog.getFile()}\n` });
            }
        });
        await new Promise<void>((resolve, reject) => {
            resp.on('end', resolve);
            resp.on('error', reject);
        });

        const items = await this.search({});
        const updated = items.find(other => BoardsPackage.equals(other, item)) || item;
        this.notificationService.notifyPlatformInstalled({ item: updated });
        console.info('<<< Boards package installation done.', item);
    }

    async uninstall(options: { item: BoardsPackage }): Promise<void> {
        const item = options.item;
        const coreClient = await this.coreClientProvider.client();
        if (!coreClient) {
            return;
        }
        const { client, instance } = coreClient;

        const [platform, architecture] = item.id.split(':');

        const req = new PlatformUninstallReq();
        req.setInstance(instance);
        req.setArchitecture(architecture);
        req.setPlatformPackage(platform);

        console.info('>>> Starting boards package uninstallation...', item);
        let logged = false;
        const resp = client.platformUninstall(req);
        resp.on('data', (_: PlatformUninstallResp) => {
            if (!logged) {
                this.outputService.append({ name: 'board uninstall', chunk: `uninstalling ${item.id}\n` });
                logged = true;
            }
        })
        await new Promise<void>((resolve, reject) => {
            resp.on('end', resolve);
            resp.on('error', reject);
        });

        // Here, unlike at `install` we send out the argument `item`. Otherwise, we would not know about the board FQBN.
        this.notificationService.notifyPlatformUninstalled({ item });
        console.info('<<< Boards package uninstallation done.', item);
    }

}
