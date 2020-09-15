import { injectable, inject } from 'inversify';
import { Emitter } from '@theia/core/lib/common/event';
import { ILogger } from '@theia/core/lib/common/logger';
import { MessageService } from '@theia/core/lib/common/message-service';
import { StorageService } from '@theia/core/lib/browser/storage-service';
import { FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application';
import { RecursiveRequired } from '../../common/types';
import {
    Port,
    Board,
    BoardsService,
    BoardsPackage,
    AttachedBoardsChangeEvent
} from '../../common/protocol';
import { BoardsConfig } from './boards-config';
import { naturalCompare } from '../../common/utils';
import { compareAnything } from '../theia/monaco/comparers';
import { NotificationCenter } from '../notification-center';

interface BoardMatch {
    readonly board: Board & Readonly<{ packageName: string }>;
    readonly matches: monaco.filters.IMatch[] | undefined;
}

@injectable()
export class BoardsServiceProvider implements FrontendApplicationContribution {

    @inject(ILogger)
    protected logger: ILogger;

    @inject(MessageService)
    protected messageService: MessageService;

    @inject(StorageService)
    protected storageService: StorageService;

    @inject(BoardsService)
    protected boardsService: BoardsService;

    @inject(NotificationCenter)
    protected notificationCenter: NotificationCenter;

    protected readonly onBoardsConfigChangedEmitter = new Emitter<BoardsConfig.Config>();
    protected readonly onAvailableBoardsChangedEmitter = new Emitter<AvailableBoard[]>();

    /**
     * Used for the auto-reconnecting. Sometimes, the attached board gets disconnected after uploading something to it.
     * It happens with certain boards on Windows. For example, the `MKR1000` boards is selected on post `COM5` on Windows,
     * perform an upload, the board automatically disconnects and reconnects, but on another port, `COM10`.
     * We have to listen on such changes and auto-reconnect the same board on another port.
     * See: https://arduino.slack.com/archives/CJJHJCJSJ/p1568645417013000?thread_ts=1568640504.009400&cid=CJJHJCJSJ
     */
    protected latestValidBoardsConfig: RecursiveRequired<BoardsConfig.Config> | undefined = undefined;
    protected _boardsConfig: BoardsConfig.Config = {};
    protected _attachedBoards: Board[] = []; // This does not contain the `Unknown` boards. They're visible from the available ports only.
    protected _availablePorts: Port[] = [];
    protected _availableBoards: AvailableBoard[] = [];

    /**
     * Unlike `onAttachedBoardsChanged` this even fires when the user modifies the selected board in the IDE.\
     * This even also fires, when the boards package was not available for the currently selected board,
     * and the user installs the board package. Note: installing a board package will set the `fqbn` of the
     * currently selected board.\
     * This even also emitted when the board package for the currently selected board was uninstalled.
     */
    readonly onBoardsConfigChanged = this.onBoardsConfigChangedEmitter.event;
    readonly onAvailableBoardsChanged = this.onAvailableBoardsChangedEmitter.event;

    onStart(): void {
        this.notificationCenter.onAttachedBoardsChanged(this.notifyAttachedBoardsChanged.bind(this));
        this.notificationCenter.onPlatformInstalled(this.notifyPlatformInstalled.bind(this));
        this.notificationCenter.onPlatformUninstalled(this.notifyPlatformUninstalled.bind(this));

        Promise.all([
            this.boardsService.getAttachedBoards(),
            this.boardsService.getAvailablePorts(),
            this.loadState()
        ]).then(([attachedBoards, availablePorts]) => {
            this._attachedBoards = attachedBoards;
            this._availablePorts = availablePorts;
            this.reconcileAvailableBoards().then(() => this.tryReconnect());
        });
    }

    protected notifyAttachedBoardsChanged(event: AttachedBoardsChangeEvent): void {
        if (!AttachedBoardsChangeEvent.isEmpty(event)) {
            this.logger.info('Attached boards and available ports changed:');
            this.logger.info(AttachedBoardsChangeEvent.toString(event));
            this.logger.info(`------------------------------------------`);
        }
        this._attachedBoards = event.newState.boards;
        this._availablePorts = event.newState.ports;
        this.reconcileAvailableBoards().then(() => this.tryReconnect());
    }

    protected notifyPlatformInstalled(event: { item: BoardsPackage }): void {
        this.logger.info('Boards package installed: ', JSON.stringify(event));
        const { selectedBoard } = this.boardsConfig;
        const { installedVersion, id } = event.item;
        if (selectedBoard) {
            const installedBoard = event.item.boards.find(({ name }) => name === selectedBoard.name);
            if (installedBoard && (!selectedBoard.fqbn || selectedBoard.fqbn === installedBoard.fqbn)) {
                this.logger.info(`Board package ${id}[${installedVersion}] was installed. Updating the FQBN of the currently selected ${selectedBoard.name} board. [FQBN: ${installedBoard.fqbn}]`);
                this.boardsConfig = {
                    ...this.boardsConfig,
                    selectedBoard: installedBoard
                };
                return;
            }
            // Trigger a board re-set. See: https://github.com/arduino/arduino-cli/issues/954
            // E.g: install `adafruit:avr`, then select `adafruit:avr:adafruit32u4` board, and finally install the required `arduino:avr`
            this.boardsConfig = this.boardsConfig;
        }
    }

    protected notifyPlatformUninstalled(event: { item: BoardsPackage }): void {
        this.logger.info('Boards package uninstalled: ', JSON.stringify(event));
        const { selectedBoard } = this.boardsConfig;
        if (selectedBoard && selectedBoard.fqbn) {
            const uninstalledBoard = event.item.boards.find(({ name }) => name === selectedBoard.name);
            if (uninstalledBoard && uninstalledBoard.fqbn === selectedBoard.fqbn) {
                this.logger.info(`Board package ${event.item.id} was uninstalled. Discarding the FQBN of the currently selected ${selectedBoard.name} board.`);
                const selectedBoardWithoutFqbn = {
                    name: selectedBoard.name
                    // No FQBN
                };
                this.boardsConfig = {
                    ...this.boardsConfig,
                    selectedBoard: selectedBoardWithoutFqbn
                };
            }
        }
    }

    protected async tryReconnect(): Promise<boolean> {
        if (this.latestValidBoardsConfig && !this.canUploadTo(this.boardsConfig)) {
            for (const board of this.availableBoards.filter(({ state }) => state !== AvailableBoard.State.incomplete)) {
                if (this.latestValidBoardsConfig.selectedBoard.fqbn === board.fqbn
                    && this.latestValidBoardsConfig.selectedBoard.name === board.name
                    && Port.sameAs(this.latestValidBoardsConfig.selectedPort, board.port)) {

                    this.boardsConfig = this.latestValidBoardsConfig;
                    return true;
                }
            }
            // If we could not find an exact match, we compare the board FQBN-name pairs and ignore the port, as it might have changed.
            // See documentation on `latestValidBoardsConfig`.
            for (const board of this.availableBoards.filter(({ state }) => state !== AvailableBoard.State.incomplete)) {
                if (this.latestValidBoardsConfig.selectedBoard.fqbn === board.fqbn
                    && this.latestValidBoardsConfig.selectedBoard.name === board.name) {

                    this.boardsConfig = {
                        ...this.latestValidBoardsConfig,
                        selectedPort: board.port
                    };
                    return true;
                }
            }
        }
        return false;
    }

    set boardsConfig(config: BoardsConfig.Config) {
        this.doSetBoardsConfig(config);
        this.saveState().finally(() => this.reconcileAvailableBoards().finally(() => this.onBoardsConfigChangedEmitter.fire(this._boardsConfig)));
    }

    protected doSetBoardsConfig(config: BoardsConfig.Config): void {
        this.logger.info('Board config changed: ', JSON.stringify(config));
        this._boardsConfig = config;
        if (this.canUploadTo(this._boardsConfig)) {
            this.latestValidBoardsConfig = this._boardsConfig;
        }
    }

    async searchBoards({ query, cores }: { query?: string, cores?: string[] }): Promise<Array<Board & { packageName: string }>> {
        const boards = await this.boardsService.allBoards({});
        const coresFilter = !!cores && cores.length
            ? ((toFilter: { packageName: string }) => cores.some(core => core === toFilter.packageName))
            : () => true;
        if (!query) {
            return boards.filter(coresFilter).sort(Board.compare);
        }
        const toMatch = ((toFilter: Board & { packageName: string }) => (({ board: toFilter, matches: monaco.filters.matchesFuzzy(query, toFilter.name, true) })));
        const compareEntries = (left: BoardMatch, right: BoardMatch, lookFor: string) => {
            const leftMatches = left.matches || [];
            const rightMatches = right.matches || [];
            if (leftMatches.length && !rightMatches.length) {
                return -1;
            }
            if (!leftMatches.length && rightMatches.length) {
                return 1;
            }
            if (leftMatches.length === 0 && rightMatches.length === 0) {
                return 0;
            }
            const leftLabel = left.board.name.replace(/\r?\n/g, ' ');
            const rightLabel = right.board.name.replace(/\r?\n/g, ' ');
            return compareAnything(leftLabel, rightLabel, lookFor);
        }
        const normalizedQuery = query.toLowerCase();
        return boards
            .filter(coresFilter)
            .map(toMatch)
            .filter(({ matches }) => !!matches)
            .sort((left, right) => compareEntries(left, right, normalizedQuery))
            .map(({ board }) => board);
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
     * `true` if `canVerify`, the board has an FQBN and the `config.selectedPort` is also set, hence can upload to board. Otherwise, `false`.
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

    get availableBoards(): AvailableBoard[] {
        return this._availableBoards;
    }

    protected async reconcileAvailableBoards(): Promise<void> {
        const attachedBoards = this._attachedBoards;
        const availablePorts = this._availablePorts;
        // Unset the port on the user's config, if it is not available anymore.
        if (this.boardsConfig.selectedPort && !availablePorts.some(port => Port.sameAs(port, this.boardsConfig.selectedPort))) {
            this.doSetBoardsConfig({ selectedBoard: this.boardsConfig.selectedBoard, selectedPort: undefined });
            this.onBoardsConfigChangedEmitter.fire(this._boardsConfig);
        }
        const boardsConfig = this.boardsConfig;
        const currentAvailableBoards = this._availableBoards;
        const availableBoards: AvailableBoard[] = [];
        const availableBoardPorts = availablePorts.filter(Port.isBoardPort);
        const attachedSerialBoards = attachedBoards.filter(({ port }) => !!port);

        for (const boardPort of availableBoardPorts) {
            let state = AvailableBoard.State.incomplete; // Initial pessimism.
            let board = attachedSerialBoards.find(({ port }) => Port.sameAs(boardPort, port));
            if (board) {
                state = AvailableBoard.State.recognized;
            } else {
                // If the selected board is not recognized because it is a 3rd party board: https://github.com/arduino/arduino-cli/issues/623
                // We still want to show it without the red X in the boards toolbar: https://github.com/arduino/arduino-pro-ide/issues/198#issuecomment-599355836
                const lastSelectedBoard = await this.getLastSelectedBoardOnPort(boardPort);
                if (lastSelectedBoard) {
                    board = {
                        ...lastSelectedBoard,
                        port: boardPort
                    };
                    state = AvailableBoard.State.guessed;
                }
            }
            if (!board) {
                availableBoards.push({ name: 'Unknown', port: boardPort, state });
            } else {
                const selected = BoardsConfig.Config.sameAs(boardsConfig, board);
                availableBoards.push({ ...board, state, selected, port: boardPort });
            }
        }

        if (boardsConfig.selectedBoard && !availableBoards.some(({ selected }) => selected)) {
            availableBoards.push({
                ...boardsConfig.selectedBoard,
                port: boardsConfig.selectedPort,
                selected: true,
                state: AvailableBoard.State.incomplete
            });
        }

        const sortedAvailableBoards = availableBoards.sort(AvailableBoard.compare);
        let hasChanged = sortedAvailableBoards.length !== currentAvailableBoards.length;
        for (let i = 0; !hasChanged && i < sortedAvailableBoards.length; i++) {
            hasChanged = AvailableBoard.compare(sortedAvailableBoards[i], currentAvailableBoards[i]) !== 0;
        }
        if (hasChanged) {
            this._availableBoards = sortedAvailableBoards;
            this.onAvailableBoardsChangedEmitter.fire(this._availableBoards);
        }
    }

    protected async getLastSelectedBoardOnPort(port: Port | string | undefined): Promise<Board | undefined> {
        if (!port) {
            return undefined;
        }
        const key = this.getLastSelectedBoardOnPortKey(port);
        return this.storageService.getData<Board>(key);
    }

    protected async saveState(): Promise<void> {
        // We save the port with the selected board name/FQBN, to be able to guess a better board name.
        // Required when the attached board belongs to a 3rd party boards package, and neither the name, nor
        // the FQBN can be retrieved with a `board list` command.
        // https://github.com/arduino/arduino-cli/issues/623
        const { selectedBoard, selectedPort } = this.boardsConfig;
        if (selectedBoard && selectedPort) {
            const key = this.getLastSelectedBoardOnPortKey(selectedPort);
            await this.storageService.setData(key, selectedBoard);
        }
        await this.storageService.setData('latest-valid-boards-config', this.latestValidBoardsConfig);
    }

    protected getLastSelectedBoardOnPortKey(port: Port | string): string {
        // TODO: we lose the port's `protocol` info (`serial`, `network`, etc.) here if the `port` is a `string`.
        return `last-selected-board-on-port:${typeof port === 'string' ? port : Port.toString(port)}`;
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

/**
 * Representation of a ready-to-use board, either the user has configured it or was automatically recognized by the CLI.
 * An available board was not necessarily recognized by the CLI (e.g.: it is a 3rd party board) or correctly configured but ready for `verify`.
 * If it has the selected board and a associated port, it can be used for `upload`. We render an available board for the user
 * when it has the `port` set.
 */
export interface AvailableBoard extends Board {
    readonly state: AvailableBoard.State;
    readonly selected?: boolean;
    readonly port?: Port;
}

export namespace AvailableBoard {

    export enum State {
        /**
         * Retrieved from the CLI via the `board list` command.
         */
        'recognized',
        /**
         * Guessed the name/FQBN of the board from the available board ports (3rd party).
         */
        'guessed',
        /**
         * We do not know anything about this board, probably a 3rd party. The user has not selected a board for this port yet.
         */
        'incomplete'
    }

    export function is(board: any): board is AvailableBoard {
        return Board.is(board) && 'state' in board;
    }

    export function hasPort(board: AvailableBoard): board is AvailableBoard & { port: Port } {
        return !!board.port;
    }

    export const compare = (left: AvailableBoard, right: AvailableBoard) => {
        if (left.selected && !right.selected) {
            return -1;
        }
        if (right.selected && !left.selected) {
            return 1;
        }
        let result = naturalCompare(left.name, right.name);
        if (result !== 0) {
            return result;
        }
        if (left.fqbn && right.fqbn) {
            result = naturalCompare(left.fqbn, right.fqbn);
            if (result !== 0) {
                return result;
            }
        }
        if (left.port && right.port) {
            result = Port.compare(left.port, right.port);
            if (result !== 0) {
                return result;
            }
        }
        if (!!left.selected && !right.selected) {
            return -1;
        }
        if (!!right.selected && !left.selected) {
            return 1;
        }
        return left.state - right.state;
    }

}
