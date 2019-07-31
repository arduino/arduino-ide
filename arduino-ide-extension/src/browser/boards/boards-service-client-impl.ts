import { injectable, inject, postConstruct } from 'inversify';
import { Emitter, ILogger } from '@theia/core';
import { BoardsServiceClient, AttachedBoardsChangeEvent, BoardInstalledEvent, AttachedSerialBoard } from '../../common/protocol/boards-service';
import { BoardsConfig } from './boards-config';
import { LocalStorageService } from '@theia/core/lib/browser';

@injectable()
export class BoardsServiceClientImpl implements BoardsServiceClient {

    @inject(ILogger)
    protected logger: ILogger;

    @inject(LocalStorageService)
    protected storageService: LocalStorageService;

    protected readonly onAttachedBoardsChangedEmitter = new Emitter<AttachedBoardsChangeEvent>();
    protected readonly onBoardInstalledEmitter = new Emitter<BoardInstalledEvent>();
    protected readonly onSelectedBoardsConfigChangedEmitter = new Emitter<BoardsConfig.Config>();

    protected _boardsConfig: BoardsConfig.Config = {};

    readonly onBoardsChanged = this.onAttachedBoardsChangedEmitter.event;
    readonly onBoardInstalled = this.onBoardInstalledEmitter.event;
    readonly onBoardsConfigChanged = this.onSelectedBoardsConfigChangedEmitter.event;

    @postConstruct()
    protected init(): void {
        this.loadState();
    }

    notifyAttachedBoardsChanged(event: AttachedBoardsChangeEvent): void {
        this.logger.info('Attached boards changed: ', JSON.stringify(event));
        const detachedBoards = AttachedBoardsChangeEvent.diff(event).detached.filter(AttachedSerialBoard.is).map(({ port }) => port);
        const { selectedPort, selectedBoard } = this.boardsConfig;
        this.onAttachedBoardsChangedEmitter.fire(event);
        // Dynamically unset the port if the selected board was an attached one and we detached it.
        if (!!selectedPort && detachedBoards.indexOf(selectedPort) === -1) {
            this.boardsConfig = {
                selectedBoard,
                selectedPort: undefined
            };
        }
    }

    notifyBoardInstalled(event: BoardInstalledEvent): void {
        this.logger.info('Board installed: ', JSON.stringify(event));
        this.onBoardInstalledEmitter.fire(event);
    }

    set boardsConfig(config: BoardsConfig.Config) {
        this.logger.info('Board config changed: ', JSON.stringify(config));
        this._boardsConfig = config;
        this.saveState().then(() => this.onSelectedBoardsConfigChangedEmitter.fire(this._boardsConfig));
    }

    get boardsConfig(): BoardsConfig.Config {
        return this._boardsConfig;
    }

    protected saveState(): Promise<void> {
        return this.storageService.setData('boards-config', this.boardsConfig);
    }

    protected async loadState(): Promise<void> {
        const boardsConfig = await this.storageService.getData<BoardsConfig.Config>('boards-config');
        if (boardsConfig) {
            this.boardsConfig = boardsConfig;
        }
    }

}
