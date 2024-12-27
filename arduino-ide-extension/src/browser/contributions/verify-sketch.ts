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
import { CurrentSketch } from '../sketches-service-client-impl';
import {
  CoreService,
  ResponseService,
  ResponseServiceClient,
} from '../../common/protocol';
import { CoreErrorHandler } from './core-error-handler';
import { SidebarMenu } from '@theia/core/lib/browser/shell/sidebar-menu-widget';
import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { CreateFeatures } from '../create/create-features';

export interface VerifySketchParams {
  /**
   * Same as `CoreService.Options.Compile#exportBinaries`
   */
  readonly exportBinaries?: boolean;
  /**
   * If `true`, there won't be any UI indication of the verify command in the toolbar. It's `false` by default.
   */
  readonly silent?: boolean;
}

export const verifyMenu: SidebarMenu = {
  id: 'lingzhi-verify-sketch',
  iconClass: 'fa lingzhi-build-ok',
  title: '验证',
  menuPath: ArduinoMenus.SKETCH_COMMAND_ID,
  order: 2,
};

/**
 *  - `"idle"` when neither verify, nor upload is running,
 *  - `"explicit-verify"` when only verify is running triggered by the user, and
 *  - `"automatic-verify"` is when the automatic verify phase is running as part of an upload triggered by the user.
 */
type VerifyProgress = 'idle' | 'explicit-verify' | 'automatic-verify';

@injectable()
export class VerifySketch extends CoreServiceContribution {
  @inject(CoreErrorHandler)
  private readonly coreErrorHandler: CoreErrorHandler;
  @inject(ResponseService)
  private readonly responseService1: ResponseService;
  @inject(CoreService)
  private readonly coreService1: CoreService;
  @inject(ResponseServiceClient)
  private readonly responseServiceClient: ResponseServiceClient;

  private readonly onDidChangeEmitter = new Emitter<void>();
  private readonly onDidChange = this.onDidChangeEmitter.event;
  private verifyProgress: VerifyProgress = 'idle';

  @inject(CreateFeatures)
  private app: FrontendApplication;
  override onStart(app: FrontendApplication): void {
    this.app = app;

    // 在 onStart 方法中添加新菜单
    const handler = this.app.shell.leftPanelHandler;
    handler.addBottomMenu(verifyMenu);
  }

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
      isVisible: (widget, showToolbar: boolean) =>
        showToolbar && ArduinoToolbar.is(widget) && widget.side === 'left',
      isEnabled: () => this.verifyProgress !== 'explicit-verify',
      // toggled only when verify is running, but not toggled when automatic verify is running before the upload
      // https://github.com/arduino/arduino-ide/pull/1750#pullrequestreview-1214762975
      isToggled: () => this.verifyProgress === 'explicit-verify',
      execute: () =>
        registry.executeCommand(VerifySketch.Commands.VERIFY_SKETCH.id),
    });
  }

  override registerMenus(registry: MenuModelRegistry): void {
    registry.registerMenuAction(ArduinoMenus.SKETCH_COMMAND_ID, {
      commandId: verifyMenu.id,
      label: verifyMenu.title,
      order: '0',
    });

    // registry.registerMenuAction(ArduinoMenus.SKETCH__MAIN_GROUP, {
    //   commandId: VerifySketch.Commands.VERIFY_SKETCH.id,
    //   label: nls.localize('arduino/sketch/verify', 'Verify'),
    //   order: '0',
    // });

    registry.registerMenuAction(ArduinoMenus.SKETCH__MAIN_GROUP, {
      commandId: VerifySketch.Commands.EXPORT_BINARIES.id,
      label: '导出已编译的二进制文件',
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
      tooltip: '验证',
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
    if (this.verifyProgress !== 'idle') {
      return undefined;
    }

    try {
      // 根据params参数的silent属性，设置verifyProgress的值
      this.verifyProgress = params?.silent
        ? 'automatic-verify'
        : 'explicit-verify';
      // 触发onDidChangeEmitter事件
      this.onDidChangeEmitter.fire();
      // 更新menuManager
      this.menuManager.update();
      // 清除可见的通知
      this.clearVisibleNotification();
      // 重置coreErrorHandler
      this.coreErrorHandler.reset();

      // 根据params参数的exportBinaries属性，获取options
      const options = await this.options(params?.exportBinaries);
      // 如果options为空，则返回undefined
      if (!options) {
        return undefined;
      }

      // 使用doWithProgress方法，执行编译任务
      // await this.doWithProgress({
      //   // 设置进度文本
      //   progressText: nls.localize(
      //     'arduino/sketch/compile',
      //     'Compiling sketch...'
      //   ),
      //   // 设置任务
      //   task: (progressId, coreService) =>
      //     coreService.compile({
      //       // 将options和progressId作为参数传递给compile方法
      //       ...options,
      //       progressId,
      //     }),
      // });
      this.responseServiceClient.clearOutput();
      await this.coreService1.compile({
        // 将options和progressId作为参数传递给compile方法
        ...options,
      });
      const chunk = '编译完成.\n\n';
      this.responseService1.appendToOutput({ chunk });
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
        'lingzhi-is-optimize-for-debug'
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
      id: 'lingzhi-verify-sketch',
    };
    export const EXPORT_BINARIES: Command = {
      id: 'lingzhi-export-binaries',
    };
    export const VERIFY_SKETCH_TOOLBAR: Command = {
      id: 'lingzhi-verify-sketch--toolbar',
    };
  }
}
