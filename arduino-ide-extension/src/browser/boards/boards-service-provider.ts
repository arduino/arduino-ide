import { FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import {
  Command,
  CommandContribution,
  CommandRegistry,
  CommandService,
} from '@theia/core/lib/common/command';
import type { Disposable } from '@theia/core/lib/common/disposable';
import { Emitter } from '@theia/core/lib/common/event';
import { ILogger } from '@theia/core/lib/common/logger';
import { MessageService } from '@theia/core/lib/common/message-service';
import { nls } from '@theia/core/lib/common/nls';
import { Deferred } from '@theia/core/lib/common/promise-util';
import type { Mutable } from '@theia/core/lib/common/types';
import { inject, injectable, optional } from '@theia/core/shared/inversify';
import {
  OutputChannel,
  OutputChannelManager,
} from '@theia/output/lib/browser/output-channel';
import {
  BoardIdentifier,
  boardIdentifierEquals,
  BoardsConfig,
  BoardsConfigChangeEvent,
  BoardsPackage,
  BoardsService,
  BoardUserField,
  BoardWithPackage,
  DetectedPorts,
  emptyBoardsConfig,
  isBoardIdentifier,
  isPortIdentifier,
  Port,
  PortIdentifier,
  portIdentifierEquals,
  serializePlatformIdentifier,
} from '../../common/protocol';
import {
  BoardList,
  BoardListHistory,
  createBoardList,
  isBoardListHistory,
} from '../../common/protocol/board-list';
import { Defined } from '../../common/types';
import {
  StartupTask,
  StartupTaskProvider,
} from '../../electron-common/startup-task';
import { NotificationCenter } from '../notification-center';
import { StorageWrapper } from '../storage-wrapper';
import { BoardsDataStore } from './boards-data-store';

const boardListHistoryStorageKey = 'arduino-ide:boardListHistory';
const selectedPortStorageKey = 'arduino-ide:selectedPort';
const selectedBoardStorageKey = 'arduino-ide:selectedBoard';

type UpdateBoardsConfigReason =
  /**
   * Restore previous state at IDE startup.
   */
  | 'restore'
  /**
   * The board and the optional port were changed from the dialog.
   */
  | 'dialog'
  /**
   * The board and the port were updated from the board select toolbar.
   */
  | 'toolbar'
  /**
   * The board and port configuration was inherited from another window.
   */
  | 'inherit';

interface RefreshBoardListParams {
  detectedPorts?: DetectedPorts;
  boardsConfig?: BoardsConfig;
  boardListHistory?: BoardListHistory;
}

export type SelectBoardsConfigActionParams = Defined<BoardsConfig>;
export interface SelectBoardsConfigAction {
  (params: SelectBoardsConfigActionParams): void;
}

export interface EditBoardsConfigActionParams {
  readonly selectedPort?: PortIdentifier;
  readonly selectedBoard?: BoardIdentifier;
  /**
   * Query string to search for. Or `'clear-if-not-empty'` action when the `<input>` should be cleared. It's a NOOP, if already empty. Use `'clear'` to force rerun the search.
   */
  readonly query?:
    | string
    | Readonly<{ action: 'clear-if-not-empty' | 'clear' }>;
}
export interface EditBoardsConfigAction {
  (params?: EditBoardsConfigActionParams): void;
}

export interface BoardListUI extends BoardList {
  /**
   * Sets the frontend's port and board configuration according to the params.
   */
  onSelect: SelectBoardsConfigAction;
  /**
   * Opens up the boards config dialog with the port and (optional) board to select in the dialog.
   * Calling this function does not immediately change the frontend's port and board config, but
   * preselects items in the dialog.
   */
  onEdit: EditBoardsConfigAction;
}

@injectable()
export class BoardListDumper implements Disposable {
  @inject(OutputChannelManager)
  private readonly outputChannelManager: OutputChannelManager;

  private outputChannel: OutputChannel | undefined;

  dump(boardList: BoardList): void {
    if (!this.outputChannel) {
      this.outputChannel = this.outputChannelManager.getChannel(
        'Developer (Arduino)'
      );
    }
    this.outputChannel.show({ preserveFocus: true });
    this.outputChannel.append(boardList.toString() + '\n');
  }

  dispose(): void {
    this.outputChannel?.dispose();
  }
}

@injectable()
export class BoardsServiceProvider
  implements
    FrontendApplicationContribution,
    StartupTaskProvider,
    CommandContribution
{
  @inject(ILogger)
  private readonly logger: ILogger;
  @inject(MessageService)
  private messageService: MessageService;

  @inject(BoardsService)
  private readonly boardsService: BoardsService;
  @inject(CommandService)
  private readonly commandService: CommandService;
  @inject(NotificationCenter)
  private readonly notificationCenter: NotificationCenter;
  @inject(FrontendApplicationStateService)
  private readonly appStateService: FrontendApplicationStateService;
  @inject(BoardsDataStore)
  private readonly boardsDataStore: BoardsDataStore;
  @optional()
  @inject(BoardListDumper)
  private readonly boardListDumper?: BoardListDumper;

  private _boardsConfig = emptyBoardsConfig();
  private _detectedPorts: DetectedPorts = {};
  private _boardList = this.createBoardListUI(createBoardList({}));
  private _boardListHistory: Mutable<BoardListHistory> = {};
  private _ready = new Deferred<void>();

  private readonly boardsConfigDidChangeEmitter =
    new Emitter<BoardsConfigChangeEvent>();
  readonly onBoardsConfigDidChange = this.boardsConfigDidChangeEmitter.event;

  private readonly boardListDidChangeEmitter = new Emitter<BoardListUI>();
  /**
   * Emits an event on board config (port or board) change, and when the discovery (`board list --watch`) detected any changes.
   */
  readonly onBoardListDidChange = this.boardListDidChangeEmitter.event;

  onStart(): void {
    this.notificationCenter.onDetectedPortsDidChange(({ detectedPorts }) =>
      this.refreshBoardList({ detectedPorts })
    );
    this.notificationCenter.onPlatformDidInstall((event) =>
      this.maybeUpdateSelectedBoard(event)
    );
    this.appStateService
      .reachedState('ready')
      .then(async () => {
        const [detectedPorts, storedState] = await Promise.all([
          this.boardsService.getDetectedPorts(),
          this.restoreState(),
        ]);
        const { selectedBoard, selectedPort, boardListHistory } = storedState;
        const options: RefreshBoardListParams = {
          boardListHistory,
          detectedPorts,
        };
        // If either the port or the board is set, restore it. Otherwise, do not restore nothing.
        // It might override the inherited boards config from the other window on File > New Sketch
        if (selectedBoard || selectedPort) {
          options.boardsConfig = { selectedBoard, selectedPort };
        }
        this.refreshBoardList(options);
        this._ready.resolve();
      })
      .finally(() => this._ready.resolve());
  }

  private async maybeUpdateSelectedBoard(event: {
    item: BoardsPackage;
  }): Promise<void> {
    const { selectedBoard } = this._boardsConfig;
    if (
      selectedBoard &&
      !selectedBoard.fqbn &&
      BoardWithPackage.is(selectedBoard)
    ) {
      const selectedBoardPlatformId = serializePlatformIdentifier(
        selectedBoard.packageId
      );
      if (selectedBoardPlatformId === event.item.id) {
        const installedSelectedBoard = event.item.boards.find(
          (board) => board.name === selectedBoard.name
        );
        // if the board can be found by its name after the install event select it. otherwise unselect it
        // historical hint: https://github.com/arduino/arduino-ide/blob/144df893d0dafec64a26565cf912a98f32572da9/arduino-ide-extension/src/browser/boards/boards-service-provider.ts#L289-L320
        this.updateBoard(installedSelectedBoard);
        if (!installedSelectedBoard) {
          const yes = nls.localize('vscode/extensionsUtils/yes', 'Yes');
          const answer = await this.messageService.warn(
            nls.localize(
              'arduino/board/couldNotFindPreviouslySelected',
              "Could not find previously selected board '{0}' in installed platform '{1}'. Please manually reselect the board you want to use. Do you want to reselect it now?",
              selectedBoard.name,
              event.item.name
            ),
            nls.localize('arduino/board/reselectLater', 'Reselect later'),
            yes
          );
          if (answer === yes) {
            this.onBoardsConfigEdit({
              query: selectedBoard.name,
              selectedPort: this._boardsConfig.selectedPort,
            });
          }
        }
      }
    }
  }

  onStop(): void {
    this.boardListDumper?.dispose();
  }

  registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(USE_INHERITED_CONFIG, {
      execute: (
        boardsConfig: BoardsConfig,
        boardListHistory: BoardListHistory
      ) => {
        if (boardListHistory) {
          this._boardListHistory = boardListHistory;
        }
        this.update({ boardsConfig }, 'inherit');
      },
    });
    if (this.boardListDumper) {
      registry.registerCommand(DUMP_BOARD_LIST, {
        execute: () => this.boardListDumper?.dump(this._boardList),
      });
    }
    registry.registerCommand(CLEAR_BOARD_LIST_HISTORY, {
      execute: () => {
        this.refreshBoardList({ boardListHistory: {} });
        this.setData(boardListHistoryStorageKey, undefined);
      },
    });
    registry.registerCommand(CLEAR_BOARDS_CONFIG, {
      execute: () => {
        this.refreshBoardList({ boardsConfig: emptyBoardsConfig() });
        Promise.all([
          this.setData(selectedPortStorageKey, undefined),
          this.setData(selectedBoardStorageKey, undefined),
        ]);
      },
    });
  }

  tasks(): StartupTask[] {
    return [
      {
        command: USE_INHERITED_CONFIG.id,
        args: [this._boardsConfig, this._boardListHistory],
      },
    ];
  }

  private refreshBoardList(params?: RefreshBoardListParams): void {
    if (params?.detectedPorts) {
      this._detectedPorts = params.detectedPorts;
    }
    if (params?.boardsConfig) {
      this._boardsConfig = params.boardsConfig;
    }
    if (params?.boardListHistory) {
      this._boardListHistory = params.boardListHistory;
    }
    const boardList = createBoardList(
      this._detectedPorts,
      this._boardsConfig,
      this._boardListHistory
    );
    this._boardList = this.createBoardListUI(boardList);
    this.boardListDidChangeEmitter.fire(this._boardList);
  }

  private createBoardListUI(boardList: BoardList): BoardListUI {
    return Object.assign(boardList, {
      onSelect: this.onBoardsConfigSelect.bind(this),
      onEdit: this.onBoardsConfigEdit.bind(this),
    });
  }

  private onBoardsConfigSelect(params: SelectBoardsConfigActionParams): void {
    this.updateConfig(params, 'toolbar');
  }

  private async onBoardsConfigEdit(
    params?: EditBoardsConfigActionParams
  ): Promise<void> {
    const boardsConfig = await this.commandService.executeCommand<
      BoardsConfig | undefined
    >('arduino-open-boards-dialog', params);
    if (boardsConfig) {
      this.update({ boardsConfig }, 'dialog');
    }
  }

  private update(
    params: RefreshBoardListParams,
    reason?: UpdateBoardsConfigReason
  ): void {
    const { boardsConfig } = params;
    if (!boardsConfig) {
      return;
    }
    const { selectedBoard, selectedPort } = boardsConfig;
    if (selectedBoard && selectedPort) {
      this.updateConfig(
        {
          selectedBoard,
          selectedPort,
        },
        reason
      );
    } else if (selectedBoard) {
      this.updateBoard(selectedBoard);
    } else if (selectedPort) {
      this.updatePort(selectedPort);
    }
  }

  updateConfig(
    boardsConfig: Defined<BoardsConfig>,
    reason?: UpdateBoardsConfigReason
  ): boolean {
    const selectedBoard = boardsConfig.selectedBoard;
    const previousSelectedBoard = this._boardsConfig.selectedBoard;
    const selectedPort = boardsConfig.selectedPort;
    const previousSelectedPort = this._boardsConfig.selectedPort;

    if (selectedBoard.fqbn && (reason === 'toolbar' || reason === 'inherit')) {
      const [, , , ...rest] = selectedBoard.fqbn.split(':');
      if (rest && rest.length) {
        console.log(
          typeof this.boardsDataStore,
          'TODO: save update data store if reason is toolbar and the FQBN has options'
        );
      }
    }
    if (
      previousSelectedBoard !== undefined &&
      boardIdentifierEquals(previousSelectedBoard, selectedBoard)
    ) {
      // the board did not change, fall back to port
      return this.updatePort(selectedPort);
    }

    if (selectedPort && selectedBoard) {
      this._boardListHistory[Port.keyOf(selectedPort)] = selectedBoard;
    }
    if (
      previousSelectedPort !== undefined &&
      portIdentifierEquals(previousSelectedPort, selectedPort)
    ) {
      // the port did not change, fall back to board
      return this.updateBoard(selectedBoard);
    }

    this._boardsConfig.selectedBoard = selectedBoard;
    this._boardsConfig.selectedPort = selectedPort;
    this.boardsConfigDidChangeEmitter.fire({
      selectedBoard,
      previousSelectedBoard,
      previousSelectedPort,
      selectedPort,
    });
    this.refreshBoardList();
    this.saveState();
    return true;
  }

  updateBoard(selectedBoard: BoardIdentifier | undefined): boolean {
    const previousSelectedBoard = this._boardsConfig.selectedBoard;
    if (boardIdentifierEquals(previousSelectedBoard, selectedBoard)) {
      // NOOP if they're the same
      return false;
    }
    this._boardsConfig.selectedBoard = selectedBoard;
    this.boardsConfigDidChangeEmitter.fire({
      previousSelectedBoard,
      selectedBoard,
    });
    this.refreshBoardList();
    this.saveState();
    return true;
  }

  updatePort(selectedPort: PortIdentifier | undefined): boolean {
    const selectedBoard = this._boardsConfig.selectedBoard;
    const previousSelectedPort = this._boardsConfig.selectedPort;
    if (selectedPort && selectedBoard) {
      this._boardListHistory[Port.keyOf(selectedPort)] = selectedBoard;
    }
    this._boardsConfig.selectedPort = selectedPort;
    if (portIdentifierEquals(previousSelectedPort, selectedPort)) {
      // NOOP if they're the same
      return false;
    }
    this.boardsConfigDidChangeEmitter.fire({
      previousSelectedPort,
      selectedPort,
    });
    this.refreshBoardList();
    this.saveState();
    return true;
  }

  get ready(): Promise<void> {
    return this._ready.promise;
  }

  get boardsConfig(): BoardsConfig {
    return this._boardsConfig;
  }

  get boardList(): BoardListUI {
    return this._boardList;
  }

  get detectedPorts(): DetectedPorts {
    return this._detectedPorts;
  }

  async searchBoards({
    query,
  }: {
    query?: string;
    cores?: string[];
  }): Promise<BoardWithPackage[]> {
    const boards = await this.boardsService.searchBoards({ query });
    return boards;
  }

  async selectedBoardUserFields(): Promise<BoardUserField[]> {
    if (!this._boardsConfig.selectedBoard) {
      return [];
    }
    const fqbn = this._boardsConfig.selectedBoard.fqbn;
    if (!fqbn) {
      return [];
    }
    // Protocol must be set to `default` when uploading without a port selected:
    // https://arduino.github.io/arduino-cli/dev/platform-specification/#sketch-upload-configuration
    const protocol = this._boardsConfig.selectedPort?.protocol || 'default';
    return await this.boardsService.getBoardUserFields({ fqbn, protocol });
  }

  private async saveState(): Promise<void> {
    const { selectedBoard, selectedPort } = this.boardsConfig;
    await Promise.all([
      this.setData(
        selectedBoardStorageKey,
        selectedBoard
          ? // to make sure no other properties of the board object are persisted
            JSON.stringify({
              name: selectedBoard.name,
              fqbn: selectedBoard.fqbn,
            })
          : undefined
      ),
      this.setData(
        selectedPortStorageKey,
        selectedPort
          ? // to make sure no other properties are persisted from the port object
            JSON.stringify({
              protocol: selectedPort.protocol,
              address: selectedPort.address,
            })
          : undefined
      ),
      this.setData(
        boardListHistoryStorageKey,
        JSON.stringify(this._boardListHistory)
      ),
    ]);
  }

  private async restoreState(): Promise<
    Readonly<BoardsConfig> & { boardListHistory: BoardListHistory | undefined }
  > {
    const [maybeSelectedBoard, maybeSelectedPort, maybeBoardHistory] =
      await Promise.all([
        this.getData<string>(selectedBoardStorageKey),
        this.getData<string>(selectedPortStorageKey),
        this.getData<string>(boardListHistoryStorageKey),
      ]);
    const selectedBoard = this.tryParse(maybeSelectedBoard, isBoardIdentifier);
    const selectedPort = this.tryParse(maybeSelectedPort, isPortIdentifier);
    const boardListHistory = this.tryParse(
      maybeBoardHistory,
      isBoardListHistory
    );
    return { selectedBoard, selectedPort, boardListHistory };
  }

  private tryParse<T>(
    raw: string | undefined,
    typeGuard: (object: unknown) => object is T
  ): T | undefined {
    if (!raw) {
      return undefined;
    }
    try {
      const object = JSON.parse(raw);
      if (typeGuard(object)) {
        return object;
      }
    } catch {
      this.logger.error(`Failed to parse raw: '${raw}'`);
    }
    return undefined;
  }

  private setData<T>(key: string, value: T): Promise<void> {
    return this.commandService.executeCommand(
      StorageWrapper.Commands.SET_DATA.id,
      key,
      value
    );
  }

  private getData<T>(key: string): Promise<T | undefined> {
    return this.commandService.executeCommand<T>(
      StorageWrapper.Commands.GET_DATA.id,
      key
    );
  }
}

/**
 * It should be neither visible nor called from outside.
 *
 * This service creates a startup task with the current board config and
 * passes the task to the electron-main process so that the new window
 * can inherit the boards config state of this service.
 *
 * Note that the state is always set, but new windows might ignore it.
 * For example, the new window already has a valid boards config persisted to the local storage.
 */
const USE_INHERITED_CONFIG: Command = {
  id: 'arduino-use-inherited-boards-config',
};

const DUMP_BOARD_LIST: Command = {
  id: 'arduino-dump-board-list',
  label: nls.localize('arduino/developer/dumpBoardList', 'Dump the Board List'),
  category: 'Developer (Arduino)',
};

const CLEAR_BOARD_LIST_HISTORY: Command = {
  id: 'arduino-clear-board-list-history',
  label: nls.localize(
    'arduino/developer/clearBoardList',
    'Clear the Board List History'
  ),
  category: 'Developer (Arduino)',
};

const CLEAR_BOARDS_CONFIG: Command = {
  id: 'arduino-clear-boards-config',
  label: nls.localize(
    'arduino/developer/clearBoardsConfig',
    'Clear the Board and Port Selection'
  ),
  category: 'Developer (Arduino)',
};
