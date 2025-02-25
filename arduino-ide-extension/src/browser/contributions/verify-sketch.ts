import { Emitter, Event } from '@theia/core/lib/common/event';
import { nls } from '@theia/core/lib/common/nls';
import { inject, injectable } from '@theia/core/shared/inversify';
import type { CompileSummary, CoreService } from '../../common/protocol';
import { ArduinoMenus } from '../menu/arduino-menus';
import { CurrentSketch } from '../sketches-service-client-impl';
import { ArduinoToolbar } from '../toolbar/arduino-toolbar';
import {
  Command,
  CommandRegistry,
  CoreServiceContribution,
  KeybindingRegistry,
  MenuModelRegistry,
  TabBarToolbarRegistry,
} from './contribution';
import { CoreErrorHandler } from './core-error-handler';

export const CompileSummaryProvider = Symbol('CompileSummaryProvider');
export interface CompileSummaryProvider {
  readonly compileSummary: CompileSummary | undefined;
  readonly onDidChangeCompileSummary: Event<void>;
}

export type VerifySketchMode =
  /**
   * When the user explicitly triggers the verify command from the primary UI: menu, toolbar, or keybinding. The UI shows the output, updates the toolbar items state, etc.
   */
  | 'explicit'
  /**
   * When the verify phase automatically runs as part of the upload but there is no UI indication of the command: the toolbar items do not update.
   */
  | 'auto'
  /**
   * The verify does not run. There is no UI indication of the command. For example, when the user decides to disable the auto verify (`'arduino.upload.autoVerify'`) to skips the code recompilation phase.
   */
  | 'dry-run';

export interface VerifySketchParams {
  /**
   * Same as `CoreService.Options.Compile#exportBinaries`
   */
  readonly exportBinaries?: boolean;
  /**
   * The mode specifying how verify should run. It's `'explicit'` by default.
   */
  readonly mode?: VerifySketchMode;
}

/**
 *  - `"idle"` when neither verify, nor upload is running
 */
type VerifyProgress = 'idle' | VerifySketchMode;

@injectable()
export class VerifySketch
  extends CoreServiceContribution
  implements CompileSummaryProvider
{
  @inject(CoreErrorHandler)
  private readonly coreErrorHandler: CoreErrorHandler;

  private readonly onDidChangeEmitter = new Emitter<void>();
  private readonly onDidChange = this.onDidChangeEmitter.event;
  private readonly onDidChangeCompileSummaryEmitter = new Emitter<void>();
  private verifyProgress: VerifyProgress = 'idle';
  private _compileSummary: CompileSummary | undefined;

  override registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(VerifySketch.Commands.VERIFY_SKETCH, {
      execute: (params?: VerifySketchParams) => this.verifySketch(params),
      isEnabled: () => this.verifyProgress === 'idle',
    });
    registry.registerCommand(VerifySketch.Commands.EXPORT_BINARIES, {
      execute: () => this.verifySketch({ exportBinaries: true }),
      isEnabled: () => this.verifyProgress === 'idle',
    });
    registry.registerCommand(VerifySketch.Commands.VERIFY_SKETCH_TOOLBAR, {
      isVisible: (widget) =>
        ArduinoToolbar.is(widget) && widget.side === 'left',
      isEnabled: () => this.verifyProgress !== 'explicit',
      // toggled only when verify is running, but not toggled when automatic verify is running before the upload
      // https://github.com/arduino/arduino-ide/pull/1750#pullrequestreview-1214762975
      isToggled: () => this.verifyProgress === 'explicit',
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

  get compileSummary(): CompileSummary | undefined {
    return this._compileSummary;
  }

  get onDidChangeCompileSummary(): Event<void> {
    return this.onDidChangeCompileSummaryEmitter.event;
  }

  private async verifySketch(
    params?: VerifySketchParams
  ): Promise<CoreService.Options.Compile | undefined> {
    if (this.verifyProgress !== 'idle') {
      return undefined;
    }

    try {
      this.verifyProgress = params?.mode ?? 'explicit';
      this.onDidChangeEmitter.fire();
      this.menuManager.update();
      this.clearVisibleNotification();
      this.coreErrorHandler.reset();
      const dryRun = this.verifyProgress === 'dry-run';

      const options = await this.options(params?.exportBinaries);
      if (!options) {
        return undefined;
      }

      if (dryRun) {
        return options;
      }

      const compileSummary = await this.doWithProgress({
        progressText: nls.localize(
          'arduino/sketch/compile',
          'Compiling sketch...'
        ),
        task: (progressId, coreService, token) =>
          coreService.compile(
            {
              ...options,
              progressId,
            },
            token
          ),
        cancelable: true,
      });
      this.messageService.info(
        nls.localize('arduino/sketch/doneCompiling', 'Done compiling.'),
        { timeout: 3000 }
      );

      this._compileSummary = compileSummary;
      this.onDidChangeCompileSummaryEmitter.fire();
      if (this._compileSummary) {
        this.fireBuildDidComplete(this._compileSummary);
      }

      // Returns with the used options for the compilation
      // so that follow-up tasks (such as upload) can reuse the compiled code.
      // Note that the `fqbn` is already decorated with the board settings, if any.
      return options;
    } catch (e) {
      this.handleError(e);
      return undefined;
    } finally {
      this.verifyProgress = 'idle';
      this.onDidChangeEmitter.fire();
      this.menuManager.update();
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

  // Execute the a command contributed by the Arduino Tools VSIX to send the `ino/buildDidComplete` notification to the language server
  private fireBuildDidComplete(compileSummary: CompileSummary): void {
    const params = {
      ...compileSummary,
    };
    console.info(
      `Executing 'arduino.languageserver.notifyBuildDidComplete' with ${JSON.stringify(
        params.buildOutputUri
      )}`
    );
    this.commandService
      .executeCommand('arduino.languageserver.notifyBuildDidComplete', params)
      .catch((err) =>
        console.error(
          `Unexpected error when firing event on build did complete. ${JSON.stringify(
            params.buildOutputUri
          )}`,
          err
        )
      );
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
