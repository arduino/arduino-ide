import { inject, injectable } from '@theia/core/shared/inversify';
import { Event, Emitter } from '@theia/core/lib/common/event';
import { HostedPluginSupport } from '@theia/plugin-ext/lib/hosted/browser/hosted-plugin';
import { ArduinoToolbar } from '../toolbar/arduino-toolbar';
import { NotificationCenter } from '../notification-center';
import { Board, BoardsService, ExecutableService } from '../../common/protocol';
import { BoardsServiceProvider } from '../boards/boards-service-provider';
import {
  URI,
  Command,
  CommandRegistry,
  SketchContribution,
  TabBarToolbarRegistry,
} from './contribution';
import { MaybePromise, MenuModelRegistry, nls } from '@theia/core/lib/common';
import { CurrentSketch } from '../../common/protocol/sketches-service-client-impl';
import { ArduinoMenus } from '../menu/arduino-menus';
import {
  PreferenceScope,
  PreferenceService,
} from '@theia/core/lib/browser/preferences/preference-service';

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

  @inject(PreferenceService)
  private readonly preferenceService: PreferenceService;

  /**
   * If `undefined`, debugging is enabled. Otherwise, the reason why it's disabled.
   */
  private _disabledMessages?: string = nls.localize(
    'arduino/common/noBoardSelected',
    'No board selected'
  ); // Initial pessimism.
  private disabledMessageDidChangeEmitter = new Emitter<string | undefined>();
  private onDisabledMessageDidChange =
    this.disabledMessageDidChangeEmitter.event;

  private get disabledMessage(): string | undefined {
    return this._disabledMessages;
  }
  private set disabledMessage(message: string | undefined) {
    this._disabledMessages = message;
    this.disabledMessageDidChangeEmitter.fire(this._disabledMessages);
  }

  private readonly debugToolbarItem = {
    id: Debug.Commands.START_DEBUGGING.id,
    command: Debug.Commands.START_DEBUGGING.id,
    tooltip: `${
      this.disabledMessage
        ? nls.localize(
            'arduino/debug/debugWithMessage',
            'Debug - {0}',
            this.disabledMessage
          )
        : Debug.Commands.START_DEBUGGING.label
    }`,
    priority: 3,
    onDidChange: this.onDisabledMessageDidChange as Event<void>,
  };

  override onStart(): void {
    this.onDisabledMessageDidChange(
      () =>
        (this.debugToolbarItem.tooltip = `${
          this.disabledMessage
            ? nls.localize(
                'arduino/debug/debugWithMessage',
                'Debug - {0}',
                this.disabledMessage
              )
            : Debug.Commands.START_DEBUGGING.label
        }`)
    );
    this.boardsServiceProvider.onBoardsConfigChanged(({ selectedBoard }) =>
      this.refreshState(selectedBoard)
    );
    this.notificationCenter.onPlatformDidInstall(() => this.refreshState());
    this.notificationCenter.onPlatformDidUninstall(() => this.refreshState());
  }

  override onReady(): MaybePromise<void> {
    this.refreshState();
  }

  override registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(Debug.Commands.START_DEBUGGING, {
      execute: () => this.startDebug(),
      isVisible: (widget) =>
        ArduinoToolbar.is(widget) && widget.side === 'left',
      isEnabled: () => !this.disabledMessage,
    });
    registry.registerCommand(Debug.Commands.OPTIMIZE_FOR_DEBUG, {
      execute: () => this.toggleOptimizeForDebug(),
      isToggled: () => this.isOptimizeForDebug(),
    });
  }

  override registerToolbarItems(registry: TabBarToolbarRegistry): void {
    registry.registerItem(this.debugToolbarItem);
  }

  override registerMenus(registry: MenuModelRegistry): void {
    registry.registerMenuAction(ArduinoMenus.SKETCH__MAIN_GROUP, {
      commandId: Debug.Commands.OPTIMIZE_FOR_DEBUG.id,
      label: Debug.Commands.OPTIMIZE_FOR_DEBUG.label,
      order: '5',
    });
  }

  private async refreshState(
    board: Board | undefined = this.boardsServiceProvider.boardsConfig
      .selectedBoard
  ): Promise<void> {
    if (!board) {
      this.disabledMessage = nls.localize(
        'arduino/common/noBoardSelected',
        'No board selected'
      );
      return;
    }
    const fqbn = board.fqbn;
    if (!fqbn) {
      this.disabledMessage = nls.localize(
        'arduino/debug/noPlatformInstalledFor',
        "Platform is not installed for '{0}'",
        board.name
      );
      return;
    }
    const details = await this.boardService.getBoardDetails({ fqbn });
    if (!details) {
      this.disabledMessage = nls.localize(
        'arduino/debug/noPlatformInstalledFor',
        "Platform is not installed for '{0}'",
        board.name
      );
      return;
    }
    const { debuggingSupported } = details;
    if (!debuggingSupported) {
      this.disabledMessage = nls.localize(
        'arduino/debug/debuggingNotSupported',
        "Debugging is not supported by '{0}'",
        board.name
      );
    } else {
      this.disabledMessage = undefined;
    }
  }

  private async startDebug(
    board: Board | undefined = this.boardsServiceProvider.boardsConfig
      .selectedBoard
  ): Promise<void> {
    if (!board) {
      return;
    }
    const { name, fqbn } = board;
    if (!fqbn) {
      return;
    }
    await this.hostedPluginSupport.didStart;
    const [sketch, executables] = await Promise.all([
      this.sketchServiceClient.currentSketch(),
      this.executableService.list(),
    ]);
    if (!CurrentSketch.isValid(sketch)) {
      return;
    }
    const ideTempFolderUri = await this.sketchService.getIdeTempFolderUri(
      sketch
    );
    const [cliPath, sketchPath, configPath] = await Promise.all([
      this.fileService.fsPath(new URI(executables.cliUri)),
      this.fileService.fsPath(new URI(sketch.uri)),
      this.fileService.fsPath(new URI(ideTempFolderUri)),
    ]);
    const config = {
      cliPath,
      board: {
        fqbn,
        name,
      },
      sketchPath,
      configPath,
    };
    return this.commandService.executeCommand('arduino.debug.start', config);
  }

  private isOptimizeForDebug(): boolean {
    return this.preferences.get('arduino.compile.optimizeForDebug');
  }

  private async toggleOptimizeForDebug(): Promise<void> {
    return this.preferenceService.set(
      'arduino.compile.optimizeForDebug',
      !this.isOptimizeForDebug(),
      PreferenceScope.User
    );
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
    export const OPTIMIZE_FOR_DEBUG = Command.toLocalizedCommand(
      {
        id: 'arduino-optimize-for-debug',
        label: 'Optimize for Debugging',
        category: 'Arduino',
      },
      'arduino/debug/optimizeForDebugging'
    );
  }
}
