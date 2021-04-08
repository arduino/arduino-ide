import { injectable, inject, named } from 'inversify';
import { ILogger } from '@theia/core/lib/common/logger';
import { notEmpty } from '@theia/core/lib/common/objects';
import {
    BoardsService,
    Installable,
    BoardsPackage, Board, Port, BoardDetails, Tool, ConfigOption, ConfigValue, Programmer, ResponseService, NotificationServiceServer, AvailablePorts, BoardWithPackage
} from '../common/protocol';
import {
    PlatformInstallRequest, PlatformListRequest, PlatformListResponse, PlatformSearchRequest,
    PlatformSearchResponse, PlatformUninstallRequest
} from './cli-protocol/cc/arduino/cli/commands/v1/core_pb';
import { Platform } from './cli-protocol/cc/arduino/cli/commands/v1/common_pb';
import { BoardDiscovery } from './board-discovery';
import { CoreClientAware } from './core-client-provider';
import { BoardDetailsRequest, BoardDetailsResponse, BoardSearchRequest } from './cli-protocol/cc/arduino/cli/commands/v1/board_pb';
import { ListProgrammersAvailableForUploadRequest, ListProgrammersAvailableForUploadResponse } from './cli-protocol/cc/arduino/cli/commands/v1/upload_pb';
import { InstallWithProgress } from './grpc-installable';

@injectable()
export class BoardsServiceImpl extends CoreClientAware implements BoardsService {

    @inject(ILogger)
    protected logger: ILogger;

    @inject(ILogger)
    @named('discovery')
    protected discoveryLogger: ILogger;

    @inject(ResponseService)
    protected readonly responseService: ResponseService;

    @inject(NotificationServiceServer)
    protected readonly notificationService: NotificationServiceServer;

    @inject(BoardDiscovery)
    protected readonly boardDiscovery: BoardDiscovery;

    async getState(): Promise<AvailablePorts> {
        return this.boardDiscovery.state;
    }

    async getAttachedBoards(): Promise<Board[]> {
        return this.boardDiscovery.getAttachedBoards();
    }

    async getAvailablePorts(): Promise<Port[]> {
        return this.boardDiscovery.getAvailablePorts();
    }

    async getBoardDetails(options: { fqbn: string }): Promise<BoardDetails | undefined> {
        const coreClient = await this.coreClient();
        const { client, instance } = coreClient;
        const { fqbn } = options;
        const detailsReq = new BoardDetailsRequest();
        detailsReq.setInstance(instance);
        detailsReq.setFqbn(fqbn);
        const detailsResp = await new Promise<BoardDetailsResponse | undefined>((resolve, reject) => client.boardDetails(detailsReq, (err, resp) => {
            if (err) {
                // Required cores are not installed manually: https://github.com/arduino/arduino-cli/issues/954
                if ((err.message.indexOf('missing platform release') !== -1 && err.message.indexOf('referenced by board') !== -1)
                    // Platform is not installed.
                    || err.message.indexOf('platform') !== -1 && err.message.indexOf('not installed') !== -1) {
                    resolve(undefined);
                    return;
                }
                reject(err);
                return;
            }
            resolve(resp);
        }));

        if (!detailsResp) {
            return undefined;
        }

        const debuggingSupported = detailsResp.getDebuggingSupported();

        const requiredTools = detailsResp.getToolsDependenciesList().map(t => <Tool>{
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

        const listReq = new ListProgrammersAvailableForUploadRequest();
        listReq.setInstance(instance);
        listReq.setFqbn(fqbn);
        const listResp = await new Promise<ListProgrammersAvailableForUploadResponse>((resolve, reject) => client.listProgrammersAvailableForUpload(listReq, (err, resp) => {
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

        let VID = 'N/A';
        let PID = 'N/A';
        const usbId = detailsResp.getIdentificationPrefsList().map(item => item.getUsbId()).find(notEmpty);
        if (usbId) {
            VID = usbId.getVid();
            PID = usbId.getPid();
        }

        return {
            fqbn,
            requiredTools,
            configOptions,
            programmers,
            debuggingSupported,
            VID,
            PID
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

    async searchBoards({ query }: { query?: string }): Promise<BoardWithPackage[]> {
        const { instance, client } = await this.coreClient();
        const req = new BoardSearchRequest();
        req.setSearchArgs(query || '');
        req.setInstance(instance);
        const boards = await new Promise<BoardWithPackage[]>((resolve, reject) => {
            client.boardSearch(req, (error, resp) => {
                if (error) {
                    reject(error);
                    return;
                }
                const boards: Array<BoardWithPackage> = [];
                for (const board of resp.getBoardsList()) {
                    const platform = board.getPlatform();
                    if (platform) {
                        boards.push({
                            name: board.getName(),
                            fqbn: board.getFqbn(),
                            packageId: platform.getId(),
                            packageName: platform.getName()
                        });
                    }
                }
                resolve(boards);
            })
        });
        return boards;
    }

    async search(options: { query?: string }): Promise<BoardsPackage[]> {
        const coreClient = await this.coreClient();
        const { client, instance } = coreClient;

        const installedPlatformsReq = new PlatformListRequest();
        installedPlatformsReq.setInstance(instance);
        const installedPlatformsResp = await new Promise<PlatformListResponse>((resolve, reject) =>
            client.platformList(installedPlatformsReq, (err, resp) => (!!err ? reject : resolve)(!!err ? err : resp))
        );
        const installedPlatforms = installedPlatformsResp.getInstalledPlatformsList();

        const req = new PlatformSearchRequest();
        req.setSearchArgs(options.query || '');
        req.setAllVersions(true);
        req.setInstance(instance);
        const resp = await new Promise<PlatformSearchResponse>((resolve, reject) => client.platformSearch(req, (err, resp) => (!!err ? reject : resolve)(!!err ? err : resp)));
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
                    pkg.availableVersions.sort(Installable.Version.COMPARATOR).reverse();
                } else {
                    packages.set(id, toPackage(platform));
                }
            }
        }

        return [...packages.values()];
    }

    async install(options: { item: BoardsPackage, progressId?: string, version?: Installable.Version }): Promise<void> {
        const item = options.item;
        const version = !!options.version ? options.version : item.availableVersions[0];
        const coreClient = await this.coreClient();
        const { client, instance } = coreClient;

        const [platform, architecture] = item.id.split(':');

        const req = new PlatformInstallRequest();
        req.setInstance(instance);
        req.setArchitecture(architecture);
        req.setPlatformPackage(platform);
        req.setVersion(version);

        console.info('>>> Starting boards package installation...', item);
        const resp = client.platformInstall(req);
        resp.on('data', InstallWithProgress.createDataCallback({ progressId: options.progressId, responseService: this.responseService }));
        await new Promise<void>((resolve, reject) => {
            resp.on('end', resolve);
            resp.on('error', error => {
                this.responseService.appendToOutput({ chunk: `Failed to install platform: ${item.id}.\n` });
                this.responseService.appendToOutput({ chunk: error.toString() });
                reject(error);
            });
        });

        const items = await this.search({});
        const updated = items.find(other => BoardsPackage.equals(other, item)) || item;
        this.notificationService.notifyPlatformInstalled({ item: updated });
        console.info('<<< Boards package installation done.', item);
    }

    async uninstall(options: { item: BoardsPackage, progressId?: string }): Promise<void> {
        const { item, progressId } = options;
        const coreClient = await this.coreClient();
        const { client, instance } = coreClient;

        const [platform, architecture] = item.id.split(':');

        const req = new PlatformUninstallRequest();
        req.setInstance(instance);
        req.setArchitecture(architecture);
        req.setPlatformPackage(platform);

        console.info('>>> Starting boards package uninstallation...', item);
        const resp = client.platformUninstall(req);
        resp.on('data', InstallWithProgress.createDataCallback({ progressId, responseService: this.responseService }));
        await new Promise<void>((resolve, reject) => {
            resp.on('end', resolve);
            resp.on('error', reject);
        });

        // Here, unlike at `install` we send out the argument `item`. Otherwise, we would not know about the board FQBN.
        this.notificationService.notifyPlatformUninstalled({ item });
        console.info('<<< Boards package uninstallation done.', item);
    }

}
