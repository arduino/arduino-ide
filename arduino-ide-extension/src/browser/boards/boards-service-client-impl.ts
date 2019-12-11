import { injectable, inject } from 'inversify';
import { Emitter } from '@theia/core/lib/common/event';
import { ILogger } from '@theia/core/lib/common/logger';
import { MessageService } from '@theia/core/lib/common/message-service';
import { LocalStorageService } from '@theia/core/lib/browser/storage-service';
import { FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application';
import { RecursiveRequired } from '../../common/types';
import { BoardsServiceClient, AttachedBoardsChangeEvent, BoardInstalledEvent, AttachedSerialBoard, Board, Port, BoardUninstalledEvent } from '../../common/protocol/boards-service';
import { BoardsConfig } from './boards-config';

@injectable()
export class BoardsServiceClientImpl implements BoardsServiceClient, FrontendApplicationContribution {

    @inject(ILogger)
    protected logger: ILogger;

    @inject(MessageService)
    protected messageService: MessageService;

    @inject(LocalStorageService)
    protected storageService: LocalStorageService;

    protected readonly onBoardInstalledEmitter = new Emitter<BoardInstalledEvent>();
    protected readonly onBoardUninstalledEmitter = new Emitter<BoardUninstalledEvent>();
    protected readonly onAttachedBoardsChangedEmitter = new Emitter<AttachedBoardsChangeEvent>();
    protected readonly onSelectedBoardsConfigChangedEmitter = new Emitter<BoardsConfig.Config>();

    /**
     * Used for the auto-reconnecting. Sometimes, the attached board gets disconnected after uploading something to it.
     * It happens with certain boards on Windows. For example, the `MKR1000` boards is selected on post `COM5` on Windows,
     * perform an upload, the board automatically disconnects and reconnects, but on another port, `COM10`.
     * We have to listen on such changes and auto-reconnect the same board on another port.
     * See: https://arduino.slack.com/archives/CJJHJCJSJ/p1568645417013000?thread_ts=1568640504.009400&cid=CJJHJCJSJ
     */
    protected latestValidBoardsConfig: RecursiveRequired<BoardsConfig.Config> | undefined = undefined;
    protected _boardsConfig: BoardsConfig.Config = {};

    readonly onBoardsChanged = this.onAttachedBoardsChangedEmitter.event;
    readonly onBoardInstalled = this.onBoardInstalledEmitter.event;
    readonly onBoardUninstalled = this.onBoardUninstalledEmitter.event;
    readonly onBoardsConfigChanged = this.onSelectedBoardsConfigChangedEmitter.event;

    async onStart(): Promise<void> {
        return this.loadState();
    }

    notifyAttachedBoardsChanged(event: AttachedBoardsChangeEvent): void {
        this.logger.info('Attached boards and available ports changed: ', JSON.stringify(event));
        const { detached, attached } = AttachedBoardsChangeEvent.diff(event);
        const { selectedPort, selectedBoard } = this.boardsConfig;
        this.onAttachedBoardsChangedEmitter.fire(event);
        // Dynamically unset the port if is not available anymore. A port can be "detached" when removing a board.
        if (detached.ports.some(port => Port.equals(selectedPort, port))) {
            this.boardsConfig = {
                selectedBoard,
                selectedPort: undefined
            };
        }
        // Try to reconnect.
        this.tryReconnect(attached.boards, attached.ports);
    }

    async tryReconnect(attachedBoards: Board[], availablePorts: Port[]): Promise<boolean> {
        if (this.latestValidBoardsConfig && !this.canUploadTo(this.boardsConfig)) {
            for (const board of attachedBoards.filter(AttachedSerialBoard.is)) {
                if (this.latestValidBoardsConfig.selectedBoard.fqbn === board.fqbn
                    && this.latestValidBoardsConfig.selectedBoard.name === board.name
                    && Port.sameAs(this.latestValidBoardsConfig.selectedPort, board.port)) {

                    this.boardsConfig = this.latestValidBoardsConfig;
                    return true;
                }
            }
            // If we could not find an exact match, we compare the board FQBN-name pairs and ignore the port, as it might have changed.
            // See documentation on `latestValidBoardsConfig`.
            for (const board of attachedBoards.filter(AttachedSerialBoard.is)) {
                if (this.latestValidBoardsConfig.selectedBoard.fqbn === board.fqbn
                    && this.latestValidBoardsConfig.selectedBoard.name === board.name) {

                    this.boardsConfig = {
                        ...this.latestValidBoardsConfig,
                        selectedPort: availablePorts.find(port => Port.sameAs(port, board.port))
                    };
                    return true;
                }
            }
        }
        return false;
    }

    notifyBoardInstalled(event: BoardInstalledEvent): void {
        this.logger.info('Board installed: ', JSON.stringify(event));
        this.onBoardInstalledEmitter.fire(event);
    }

    notifyBoardUninstalled(event: BoardUninstalledEvent): void {
        this.logger.info('Board uninstalled: ', JSON.stringify(event));
        this.onBoardUninstalledEmitter.fire(event);
    }

    set boardsConfig(config: BoardsConfig.Config) {
        this.logger.info('Board config changed: ', JSON.stringify(config));
        this._boardsConfig = config;
        if (this.canUploadTo(this._boardsConfig)) {
            this.latestValidBoardsConfig = this._boardsConfig;
        }
        this.saveState().then(() => this.onSelectedBoardsConfigChangedEmitter.fire(this._boardsConfig));
    }

    get boardsConfig(): BoardsConfig.Config {
        return this._boardsConfig;
    }

    /**
     * `true` if the `config.selectedBoard` is defined; hence can compile against the board. Otherwise, `false`.
     */
    canVerify(
        config: BoardsConfig.Config | undefined = this.boardsConfig,
        options: { silent: boolean } = { silent: true }): config is BoardsConfig.Config & { selectedBoard: Board } {

        if (!config) {
            return false;
        }

        if (!config.selectedBoard) {
            if (!options.silent) {
                this.messageService.warn('No boards selected.', { timeout: 3000 });
            }
            return false;
        }

        return true;
    }

    /**
     * `true` if the `canVerify` and the `config.selectedPort` is also set with FQBN, hence can upload to board. Otherwise, `false`.
     */
    canUploadTo(
        config: BoardsConfig.Config | undefined = this.boardsConfig,
        options: { silent: boolean } = { silent: true }): config is RecursiveRequired<BoardsConfig.Config> {

        if (!this.canVerify(config, options)) {
            return false;
        }

        const { name } = config.selectedBoard;
        if (!config.selectedPort) {
            if (!options.silent) {
                this.messageService.warn(`No ports selected for board: '${name}'.`, { timeout: 3000 });
            }
            return false;
        }

        if (!config.selectedBoard.fqbn) {
            if (!options.silent) {
                this.messageService.warn(`The FQBN is not available for the selected board ${name}. Do you have the corresponding core installed?`, { timeout: 3000 });
            }
            return false;
        }

        return true;
    }

    protected saveState(): Promise<void> {
        return this.storageService.setData('latest-valid-boards-config', this.latestValidBoardsConfig);
    }

    protected async loadState(): Promise<void> {
        const storedValidBoardsConfig = await this.storageService.getData<RecursiveRequired<BoardsConfig.Config>>('latest-valid-boards-config');
        if (storedValidBoardsConfig) {
            this.latestValidBoardsConfig = storedValidBoardsConfig;
            if (this.canUploadTo(this.latestValidBoardsConfig)) {
                this.boardsConfig = this.latestValidBoardsConfig;
            }
        }
    }

}
