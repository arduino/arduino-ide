import { inject, injectable } from '@theia/core/shared/inversify';
import { Emitter } from '@theia/core/lib/common/event';
import { ArduinoMenus } from '../menu/arduino-menus';
import { ArduinoToolbar } from '../toolbar/arduino-toolbar';
import {
  CoreServiceContribution,
  Command,
  CommandRegistry,
  MenuModelRegistry,
  KeybindingRegistry,
  TabBarToolbarRegistry,
} from './contribution';
import { nls } from '@theia/core/lib/common';
import { CurrentSketch } from '../../common/protocol/sketches-service-client-impl';
import { CoreService } from '../../common/protocol';
import { CoreErrorHandler } from './core-error-handler';

export interface VerifySketchParams {
  /**
   * Same as `CoreService.Options.Compile#exportBinaries`
   */
  readonly exportBinaries?: boolean;
  /**
   * If `true`, there won't be any UI indication of the verify command. It's `false` by default.
   */
  readonly silent?: boolean;
}

@injectable()
export class VerifySketch extends CoreServiceContribution {
  @inject(CoreErrorHandler)
  private readonly coreErrorHandler: CoreErrorHandler;

  private readonly onDidChangeEmitter = new Emitter<void>();
  private readonly onDidChange = this.onDidChangeEmitter.event;
  private verifyInProgress = false;

  override registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(VerifySketch.Commands.VERIFY_SKETCH, {
      execute: (params?: VerifySketchParams) => this.verifySketch(params),
      isEnabled: () => !this.verifyInProgress,
    });
    registry.registerCommand(VerifySketch.Commands.EXPORT_BINARIES, {
      execute: () => this.verifySketch({ exportBinaries: true }),
      isEnabled: () => !this.verifyInProgress,
    });
    registry.registerCommand(VerifySketch.Commands.VERIFY_SKETCH_TOOLBAR, {
      isVisible: (widget) =>
        ArduinoToolbar.is(widget) && widget.side === 'left',
      isEnabled: () => !this.verifyInProgress,
      isToggled: () => this.verifyInProgress,
      execute: () =>
        registry.executeCommand(VerifySketch.Commands.VERIFY_SKETCH.id),
    });
  }

  override registerMenus(registry: MenuModelRegistry): void {
    registry.registerMenuAction(ArduinoMenus.SKETCH__MAIN_GROUP, {
      commandId: VerifySketch.Commands.VERIFY_SKETCH.id,
      label: nls.localize('arduino/sketch/verifyOrCompile', 'Verify/Compile'),
      order: '0',
    });
    registry.registerMenuAction(ArduinoMenus.SKETCH__MAIN_GROUP, {
      commandId: VerifySketch.Commands.EXPORT_BINARIES.id,
      label: nls.localize(
        'arduino/sketch/exportBinary',
        'Export Compiled Binary'
      ),
      order: '4',
    });
  }

  override registerKeybindings(registry: KeybindingRegistry): void {
    registry.registerKeybinding({
      command: VerifySketch.Commands.VERIFY_SKETCH.id,
      keybinding: 'CtrlCmd+R',
    });
    registry.registerKeybinding({
      command: VerifySketch.Commands.EXPORT_BINARIES.id,
      keybinding: 'CtrlCmd+Alt+S',
    });
  }

  override registerToolbarItems(registry: TabBarToolbarRegistry): void {
    registry.registerItem({
      id: VerifySketch.Commands.VERIFY_SKETCH_TOOLBAR.id,
      command: VerifySketch.Commands.VERIFY_SKETCH_TOOLBAR.id,
      tooltip: nls.localize('arduino/sketch/verify', 'Verify'),
      priority: 0,
      onDidChange: this.onDidChange,
    });
  }

  protected override handleError(error: unknown): void {
    this.coreErrorHandler.tryHandle(error);
    super.handleError(error);
  }

  private async verifySketch(
    params?: VerifySketchParams
  ): Promise<CoreService.Options.Compile | undefined> {
    if (this.verifyInProgress) {
      return undefined;
    }

    try {
      if (!params?.silent) {
        this.verifyInProgress = true;
        this.onDidChangeEmitter.fire();
      }
      this.clearVisibleNotification();
      this.coreErrorHandler.reset();

      const options = await this.options(params?.exportBinaries);
      if (!options) {
        return undefined;
      }

      await this.doWithProgress({
        progressText: nls.localize(
          'arduino/sketch/compile',
          'Compiling sketch...'
        ),
        task: (progressId, coreService) =>
          coreService.compile({
            ...options,
            progressId,
          }),
      });
      this.messageService.info(
        nls.localize('arduino/sketch/doneCompiling', 'Done compiling.'),
        { timeout: 3000 }
      );
      // Returns with the used options for the compilation
      // so that follow-up tasks (such as upload) can reuse the compiled code.
      // Note that the `fqbn` is already decorated with the board settings, if any.
      return options;
    } catch (e) {
      this.handleError(e);
      return undefined;
    } finally {
      this.verifyInProgress = false;
      if (!params?.silent) {
        this.onDidChangeEmitter.fire();
      }
    }
  }

  private async options(
    exportBinaries?: boolean
  ): Promise<CoreService.Options.Compile | undefined> {
    const sketch = await this.sketchServiceClient.currentSketch();
    if (!CurrentSketch.isValid(sketch)) {
      return undefined;
    }
    const { boardsConfig } = this.boardsServiceProvider;
    const [fqbn, sourceOverride, optimizeForDebug] = await Promise.all([
      this.boardsDataStore.appendConfigToFqbn(boardsConfig.selectedBoard?.fqbn),
      this.sourceOverride(),
      this.commandService.executeCommand<boolean>(
        'arduino-is-optimize-for-debug'
      ),
    ]);
    const verbose = this.preferences.get('arduino.compile.verbose');
    const compilerWarnings = this.preferences.get('arduino.compile.warnings');
    return {
      sketch,
      fqbn,
      optimizeForDebug: Boolean(optimizeForDebug),
      verbose,
      exportBinaries,
      sourceOverride,
      compilerWarnings,
    };
  }
}

export namespace VerifySketch {
  export namespace Commands {
    export const VERIFY_SKETCH: Command = {
      id: 'arduino-verify-sketch',
    };
    export const EXPORT_BINARIES: Command = {
      id: 'arduino-export-binaries',
    };
    export const VERIFY_SKETCH_TOOLBAR: Command = {
      id: 'arduino-verify-sketch--toolbar',
    };
  }
}
