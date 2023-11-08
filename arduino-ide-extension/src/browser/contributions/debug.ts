import { Emitter, Event } from '@theia/core/lib/common/event';
import { MenuModelRegistry } from '@theia/core/lib/common/menu/menu-model-registry';
import { nls } from '@theia/core/lib/common/nls';
import { MaybePromise } from '@theia/core/lib/common/types';
import { inject, injectable } from '@theia/core/shared/inversify';
import { noBoardSelected } from '../../common/nls';
import {
  BoardDetails,
  BoardIdentifier,
  BoardsService,
  CheckDebugEnabledParams,
  ExecutableService,
  SketchRef,
  isBoardIdentifierChangeEvent,
  isCompileSummary,
} from '../../common/protocol';
import { BoardsDataStore } from '../boards/boards-data-store';
import { BoardsServiceProvider } from '../boards/boards-service-provider';
import { HostedPluginSupport } from '../hosted/hosted-plugin-support';
import { ArduinoMenus } from '../menu/arduino-menus';
import { NotificationCenter } from '../notification-center';
import { CurrentSketch } from '../sketches-service-client-impl';
import { ArduinoToolbar } from '../toolbar/arduino-toolbar';
import {
  Command,
  CommandRegistry,
  SketchContribution,
  TabBarToolbarRegistry,
  URI,
} from './contribution';

const COMPILE_FOR_DEBUG_KEY = 'arduino-compile-for-debug';

interface StartDebugParams {
  /**
   * Absolute filesystem path to the Arduino CLI executable.
   */
  readonly cliPath: string;
  /**
   * The the board to debug.
   */
  readonly board: Readonly<{ fqbn: string; name?: string }>;
  /**
   * Absolute filesystem path of the sketch to debug.
   */
  readonly sketchPath: string;
  /**
   * Location where the `launch.json` will be created on the fly before starting every debug session.
   * If not defined, it falls back to `sketchPath/.vscode/launch.json`.
   */
  readonly launchConfigsDirPath?: string;
  /**
   * Absolute path to the `arduino-cli.yaml` file. If not specified, it falls back to `~/.arduinoIDE/arduino-cli.yaml`.
   */
  readonly cliConfigPath?: string;
  /**
   * Programmer for the debugging.
   */
  readonly programmer?: string;
  /**
   * Custom progress title to use when getting the debug information from the CLI.
   */
  readonly title?: string;
}
type StartDebugResult = boolean;

@injectable()
export class Debug extends SketchContribution {
  @inject(HostedPluginSupport)
  private readonly hostedPluginSupport: HostedPluginSupport;
  @inject(NotificationCenter)
  private readonly notificationCenter: NotificationCenter;
  @inject(ExecutableService)
  private readonly executableService: ExecutableService;
  @inject(BoardsService)
  private readonly boardService: BoardsService;
  @inject(BoardsServiceProvider)
  private readonly boardsServiceProvider: BoardsServiceProvider;
  @inject(BoardsDataStore)
  private readonly boardsDataStore: BoardsDataStore;

  /**
   * If `undefined`, debugging is enabled. Otherwise, the human-readable reason why it's disabled.
   */
  private _message?: string = noBoardSelected; // Initial pessimism.
  private didChangeMessageEmitter = new Emitter<string | undefined>();
  private onDidChangeMessage = this.didChangeMessageEmitter.event;

  private get message(): string | undefined {
    return this._message;
  }
  private set message(message: string | undefined) {
    this._message = message;
    this.didChangeMessageEmitter.fire(this._message);
  }

  private readonly debugToolbarItem = {
    id: Debug.Commands.START_DEBUGGING.id,
    command: Debug.Commands.START_DEBUGGING.id,
    tooltip: `${
      this.message
        ? nls.localize(
            'arduino/debug/debugWithMessage',
            'Debug - {0}',
            this.message
          )
        : Debug.Commands.START_DEBUGGING.label
    }`,
    priority: 3,
    onDidChange: this.onDidChangeMessage as Event<void>,
  };

  override onStart(): void {
    this.onDidChangeMessage(
      () =>
        (this.debugToolbarItem.tooltip = `${
          this.message
            ? nls.localize(
                'arduino/debug/debugWithMessage',
                'Debug - {0}',
                this.message
              )
            : Debug.Commands.START_DEBUGGING.label
        }`)
    );
    this.boardsServiceProvider.onBoardsConfigDidChange((event) => {
      if (isBoardIdentifierChangeEvent(event)) {
        this.updateMessage();
      }
    });
    this.notificationCenter.onPlatformDidInstall(() => this.updateMessage());
    this.notificationCenter.onPlatformDidUninstall(() => this.updateMessage());
    this.boardsDataStore.onDidChange((event) => {
      const selectedFqbn =
        this.boardsServiceProvider.boardsConfig.selectedBoard?.fqbn;
      if (event.changes.find((change) => change.fqbn === selectedFqbn)) {
        this.updateMessage();
      }
    });
    this.commandService.onDidExecuteCommand((event) => {
      const { commandId, args } = event;
      if (
        commandId === 'arduino.languageserver.notifyBuildDidComplete' &&
        isCompileSummary(args[0])
      ) {
        this.updateMessage();
      }
    });
  }

  override onReady(): void {
    this.boardsServiceProvider.ready.then(() => this.updateMessage());
  }

  override registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(Debug.Commands.START_DEBUGGING, {
      execute: () => this.startDebug(),
      isVisible: (widget) =>
        ArduinoToolbar.is(widget) && widget.side === 'left',
      isEnabled: () => !this.message,
    });
    registry.registerCommand(Debug.Commands.TOGGLE_OPTIMIZE_FOR_DEBUG, {
      execute: () => this.toggleCompileForDebug(),
      isToggled: () => this.compileForDebug,
    });
    registry.registerCommand(Debug.Commands.IS_OPTIMIZE_FOR_DEBUG, {
      execute: () => this.compileForDebug,
    });
  }

  override registerToolbarItems(registry: TabBarToolbarRegistry): void {
    registry.registerItem(this.debugToolbarItem);
  }

  override registerMenus(registry: MenuModelRegistry): void {
    registry.registerMenuAction(ArduinoMenus.SKETCH__MAIN_GROUP, {
      commandId: Debug.Commands.TOGGLE_OPTIMIZE_FOR_DEBUG.id,
      label: Debug.Commands.TOGGLE_OPTIMIZE_FOR_DEBUG.label,
      order: '5',
    });
  }

  private async updateMessage(): Promise<void> {
    try {
      await this.isDebugEnabled();
      this.message = undefined;
    } catch (err) {
      let message = String(err);
      if (err instanceof Error) {
        message = err.message;
      }
      this.message = message;
    }
  }

  private async isDebugEnabled(
    board: BoardIdentifier | undefined = this.boardsServiceProvider.boardsConfig
      .selectedBoard
  ): Promise<string> {
    const debugFqbn = await isDebugEnabled(
      board,
      (fqbn) => this.boardService.getBoardDetails({ fqbn }),
      (fqbn) => this.boardsDataStore.getData(fqbn),
      (fqbn) => this.boardsDataStore.appendConfigToFqbn(fqbn),
      (params) => this.boardService.checkDebugEnabled(params)
    );
    return debugFqbn;
  }

  private async startDebug(
    board: BoardIdentifier | undefined = this.boardsServiceProvider.boardsConfig
      .selectedBoard,
    sketch:
      | CurrentSketch
      | undefined = this.sketchServiceClient.tryGetCurrentSketch()
  ): Promise<StartDebugResult> {
    if (!CurrentSketch.isValid(sketch)) {
      return false;
    }
    const params = await this.createStartDebugParams(board);
    if (!params) {
      return false;
    }
    await this.hostedPluginSupport.didStart;
    try {
      const result = await this.debug(params);
      return Boolean(result);
    } catch (err) {
      if (await this.isSketchNotVerifiedError(err, sketch)) {
        const yes = nls.localize('vscode/extensionsUtils/yes', 'Yes');
        const answer = await this.messageService.error(
          sketchIsNotCompiled(sketch.name),
          yes
        );
        if (answer === yes) {
          this.commandService.executeCommand('arduino-verify-sketch');
        }
      } else {
        this.messageService.error(
          err instanceof Error ? err.message : String(err)
        );
      }
    }
    return false;
  }

  private async debug(
    params: StartDebugParams
  ): Promise<StartDebugResult | undefined> {
    return this.commandService.executeCommand<StartDebugResult>(
      'arduino.debug.start',
      params
    );
  }

  get compileForDebug(): boolean {
    const value = window.localStorage.getItem(COMPILE_FOR_DEBUG_KEY);
    return value === 'true';
  }

  private toggleCompileForDebug(): void {
    const oldState = this.compileForDebug;
    const newState = !oldState;
    window.localStorage.setItem(COMPILE_FOR_DEBUG_KEY, String(newState));
    this.menuManager.update();
  }

  private async isSketchNotVerifiedError(
    err: unknown,
    sketch: SketchRef
  ): Promise<boolean> {
    if (err instanceof Error) {
      try {
        const tempBuildPaths = await this.sketchesService.tempBuildPath(sketch);
        return tempBuildPaths.some((tempBuildPath) =>
          err.message.includes(tempBuildPath)
        );
      } catch {
        return false;
      }
    }
    return false;
  }

  private async createStartDebugParams(
    board: BoardIdentifier | undefined
  ): Promise<StartDebugParams | undefined> {
    if (!board || !board.fqbn) {
      return undefined;
    }
    let debugFqbn: string | undefined = undefined;
    try {
      debugFqbn = await this.isDebugEnabled(board);
    } catch {}
    if (!debugFqbn) {
      return undefined;
    }
    const [sketch, executables, boardsData] = await Promise.all([
      this.sketchServiceClient.currentSketch(),
      this.executableService.list(),
      this.boardsDataStore.getData(board.fqbn),
    ]);
    if (!CurrentSketch.isValid(sketch)) {
      return undefined;
    }
    const ideTempFolderUri = await this.sketchesService.getIdeTempFolderUri(
      sketch
    );
    const [cliPath, sketchPath, launchConfigsDirPath] = await Promise.all([
      this.fileService.fsPath(new URI(executables.cliUri)),
      this.fileService.fsPath(new URI(sketch.uri)),
      this.fileService.fsPath(new URI(ideTempFolderUri)),
    ]);
    return {
      board: { fqbn: debugFqbn, name: board.name },
      cliPath,
      sketchPath,
      launchConfigsDirPath,
      programmer: boardsData.selectedProgrammer?.id,
      title: nls.localize(
        'arduino/debug/getDebugInfo',
        'Getting debug info...'
      ),
    };
  }
}
export namespace Debug {
  export namespace Commands {
    export const START_DEBUGGING = Command.toLocalizedCommand(
      {
        id: 'arduino-start-debug',
        label: 'Start Debugging',
        category: 'Arduino',
      },
      'vscode/debug.contribution/startDebuggingHelp'
    );
    export const TOGGLE_OPTIMIZE_FOR_DEBUG = Command.toLocalizedCommand(
      {
        id: 'arduino-toggle-optimize-for-debug',
        label: 'Optimize for Debugging',
        category: 'Arduino',
      },
      'arduino/debug/optimizeForDebugging'
    );
    export const IS_OPTIMIZE_FOR_DEBUG: Command = {
      id: 'arduino-is-optimize-for-debug',
    };
  }
}

/**
 * (non-API)
 */
export async function isDebugEnabled(
  board: BoardIdentifier | undefined,
  getDetails: (fqbn: string) => MaybePromise<BoardDetails | undefined>,
  getData: (fqbn: string) => MaybePromise<BoardsDataStore.Data>,
  appendConfigToFqbn: (fqbn: string) => MaybePromise<string | undefined>,
  checkDebugEnabled: (params: CheckDebugEnabledParams) => MaybePromise<string>
): Promise<string> {
  if (!board) {
    throw new Error(noBoardSelected);
  }
  const { fqbn } = board;
  if (!fqbn) {
    throw new Error(noPlatformInstalledFor(board.name));
  }
  const [details, data, fqbnWithConfig] = await Promise.all([
    getDetails(fqbn),
    getData(fqbn),
    appendConfigToFqbn(fqbn),
  ]);
  if (!details) {
    throw new Error(noPlatformInstalledFor(board.name));
  }
  if (!fqbnWithConfig) {
    throw new Error(
      `Failed to append boards config to the FQBN. Original FQBN was: ${fqbn}`
    );
  }
  if (!data.selectedProgrammer) {
    throw new Error(noProgrammerSelectedFor(board.name));
  }
  const params = {
    fqbn: fqbnWithConfig,
    programmer: data.selectedProgrammer.id,
  };
  try {
    const debugFqbn = await checkDebugEnabled(params);
    return debugFqbn;
  } catch (err) {
    throw new Error(debuggingNotSupported(board.name));
  }
}

/**
 * (non-API)
 */
export function sketchIsNotCompiled(sketchName: string): string {
  return nls.localize(
    'arduino/debug/sketchIsNotCompiled',
    "Sketch '{0}' must be verified before starting a debug session. Please verify the sketch and start debugging again. Do you want to verify the sketch now?",
    sketchName
  );
}
/**
 * (non-API)
 */
export function noPlatformInstalledFor(boardName: string): string {
  return nls.localize(
    'arduino/debug/noPlatformInstalledFor',
    "Platform is not installed for '{0}'",
    boardName
  );
}
/**
 * (non-API)
 */
export function debuggingNotSupported(boardName: string): string {
  return nls.localize(
    'arduino/debug/debuggingNotSupported',
    "Debugging is not supported by '{0}'",
    boardName
  );
}
/**
 * (non-API)
 */
export function noProgrammerSelectedFor(boardName: string): string {
  return nls.localize(
    'arduino/debug/noProgrammerSelectedFor',
    "No programmer selected for '{0}'",
    boardName
  );
}
