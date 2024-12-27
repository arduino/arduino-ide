import { Emitter } from '@theia/core/lib/common/event';
import { inject, injectable } from '@theia/core/shared/inversify';
import {
  CoreService,
  MonitorManagerProxyClient,
  Port,
  ResponseService,
  sanitizeFqbn,
} from '../../common/protocol';
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
import { UserFields } from './user-fields';
import type { VerifySketchParams } from './verify-sketch';
import { SidebarMenu } from '@theia/core/lib/browser/shell/sidebar-menu-widget';
import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { CreateFeatures } from '../create/create-features';
import { ApplicationShell } from '@theia/core/lib/browser';
import { MonitorWidget } from '../serial/monitor/monitor-widget';

export const uploadMenu: SidebarMenu = {
  id: 'lingzhi-upload-sketch',
  iconClass: 'fa lingzhi-upload',
  title: '上传',
  menuPath: ArduinoMenus.UPLOAD_SKETCH,
  order: 1,
};

@injectable()
export class UploadSketch extends CoreServiceContribution {
  @inject(UserFields)
  private readonly userFields: UserFields;
  @inject(ApplicationShell)
  private readonly applicationShell: ApplicationShell;
  @inject(MonitorManagerProxyClient)
  private readonly monitorManagerProxy: MonitorManagerProxyClient;
  @inject(CoreService)
  private readonly coreService1: CoreService;
  @inject(ResponseService)
  private readonly responseService1: ResponseService;

  private readonly onDidChangeEmitter = new Emitter<void>();
  private readonly onDidChange = this.onDidChangeEmitter.event;
  private uploadInProgress = false;

  @inject(CreateFeatures)
  private app: FrontendApplication;
  override onStart(app: FrontendApplication): void {
    this.app = app;

    // 在 onStart 方法中添加新菜单
    const handler = this.app.shell.leftPanelHandler;
    handler.addBottomMenu(uploadMenu);
  }

  override registerCommands(registry: CommandRegistry): void {
    // 注册一个命令，命令名为UPLOAD_SKETCH
    registry.registerCommand(UploadSketch.Commands.UPLOAD_SKETCH, {
      // 执行命令的方法
      execute: async () => {
        // 检查用户字段对话框
        if (await this.userFields.checkUserFieldsDialog()) {
          // 上传草图
          this.uploadSketch();
        }
      },
      // 判断命令是否可用的方法
      isEnabled: () => !this.uploadInProgress,
    });
    registry.registerCommand(UploadSketch.Commands.UPLOAD_WITH_CONFIGURATION, {
      execute: async () => {
        if (await this.userFields.checkUserFieldsDialog(true)) {
          this.uploadSketch();
        }
      },
      isEnabled: () => !this.uploadInProgress && this.userFields.isRequired(),
    });
    registry.registerCommand(
      UploadSketch.Commands.UPLOAD_SKETCH_USING_PROGRAMMER,
      {
        execute: () => this.uploadSketch(true),
        isEnabled: () => !this.uploadInProgress,
      }
    );
    registry.registerCommand(UploadSketch.Commands.UPLOAD_SKETCH_TOOLBAR, {
      isVisible: (widget, showToolbar: boolean) =>
        showToolbar && ArduinoToolbar.is(widget) && widget.side === 'left',
      isEnabled: () => !this.uploadInProgress,
      isToggled: () => this.uploadInProgress,
      execute: () =>
        registry.executeCommand(UploadSketch.Commands.UPLOAD_SKETCH.id),
    });
  }

  override registerMenus(registry: MenuModelRegistry): void {
    // registry.registerMenuAction(ArduinoMenus.SKETCH__MAIN_GROUP, {
    //   commandId: UploadSketch.Commands.UPLOAD_SKETCH.id,
    //   label: nls.localize('arduino/sketch/upload', 'Upload'),
    //   order: '1',
    // });

    registry.registerMenuAction(ArduinoMenus.UPLOAD_SKETCH, {
      commandId: UploadSketch.Commands.UPLOAD_SKETCH.id,
      label: '上传',
      order: '1',
    });

    registry.registerMenuAction(ArduinoMenus.SKETCH__MAIN_GROUP, {
      commandId: UploadSketch.Commands.UPLOAD_SKETCH_USING_PROGRAMMER.id,
      label: '使用编程器上传',
      order: '2',
    });
  }

  override registerKeybindings(registry: KeybindingRegistry): void {
    registry.registerKeybinding({
      command: UploadSketch.Commands.UPLOAD_SKETCH.id,
      keybinding: 'CtrlCmd+U',
    });
    registry.registerKeybinding({
      command: UploadSketch.Commands.UPLOAD_SKETCH_USING_PROGRAMMER.id,
      keybinding: 'CtrlCmd+Shift+U',
    });
  }

  override registerToolbarItems(registry: TabBarToolbarRegistry): void {
    registry.registerItem({
      id: UploadSketch.Commands.UPLOAD_SKETCH_TOOLBAR.id,
      command: UploadSketch.Commands.UPLOAD_SKETCH_TOOLBAR.id,
      tooltip: '上传',
      priority: 1,
      onDidChange: this.onDidChange,
    });
  }

  async uploadSketch(usingProgrammer = false): Promise<void> {
    if (this.uploadInProgress) {
      return;
    }

    try {
      // toggle the toolbar button and menu item state.
      // uploadInProgress will be set to false whether the upload fails or not
      // 设置上传状态为正在进行
      this.uploadInProgress = true;
      // 更新菜单管理器
      this.menuManager.update();
      // 触发onDidChangeEmitter事件
      this.onDidChangeEmitter.fire();
      // 清除可见的通知
      this.clearVisibleNotification();

      // this.boardsServiceProvider.onBoardListDidChange((boardList) => {
      //   const { selectedBoard } = boardList.boardsConfig;
      //   if (selectedBoard) {
      //     const chunk = '\n未连接开发板\n';
      //     this.responseService1.appendToOutput({ chunk });
      //   }
      // });

      const boardList = this.boardsServiceProvider.boardList;

      const groupedPorts = boardList.portsGroupedByProtocol();

      const { selectedBoard } = boardList.boardsConfig;
      if (!selectedBoard) {
        const chunk = '\n未选择开发板!\n';
        const severity = 0;
        this.responseService1.appendToOutput({ chunk, severity });
        return;
      }

      let newPort: Port | undefined = undefined;
      Object.entries(groupedPorts).forEach(([protocol, ports]) => {
        const { port } = ports[0];
        newPort = port;
      });

      if (!newPort) {
        const chunk = '\n未连接开发板!\n';
        const severity = 0;
        this.responseService1.appendToOutput({ chunk, severity });
        return;
      }

      // 调用命令服务执行命令，获取编译选项
      // 执行命令，获取编译选项
      const verifyOptions =
        await this.commandService.executeCommand<CoreService.Options.Compile>(
          'lingzhi-verify-sketch',
          <VerifySketchParams>{
            // 不导出二进制文件
            exportBinaries: false,
            // 静默模式
            silent: true,
          }
        );
      // 如果没有获取到编译选项，则返回
      if (!verifyOptions) {
        return;
      }

      // 调用uploadOptions方法，获取上传选项
      const uploadOptions = await this.uploadOptions(
        usingProgrammer,
        verifyOptions
      );
      // 如果没有获取到上传选项，则返回
      if (!uploadOptions) {
        return;
      }

      // 检查用户字段是否满足上传条件
      if (!this.userFields.checkUserFieldsForUpload()) {
        return;
      }

      let wiget = this.applicationShell.getWidgetById(MonitorWidget.ID);
      if (wiget !== undefined) {
        wiget.close();
      }
      //关闭串口绘图仪
      await this.monitorManagerProxy.stopLastMonitor();

      // 调用doWithProgress方法，执行上传操作
      // const uploadResponse = await this.doWithProgress({
      //   progressText: nls.localize('arduino/sketch/uploading', 'Uploading...'),
      //   task: (progressId, coreService) =>
      //     coreService.upload({ ...uploadOptions, progressId }),
      //   keepOutput: true,
      // });
      // this.responseServiceClient.clearOutput();
      await this.coreService1.upload({ ...uploadOptions });
      // the port update is NOOP if nothing has changed
      // this.boardsServiceProvider.updateConfig(uploadResponse.portAfterUpload);

      // this.messageService.info(
      //   nls.localize('arduino/sketch/doneUploading', '完成上传.'),
      //   { timeout: 3000 }
      // );
      const chunk = '\n完成上传.\n';
      this.responseService1.appendToOutput({ chunk });
    } catch (e) {
      this.userFields.notifyFailedWithError(e);
      this.handleError(e);
    } finally {
      // TODO: here comes the port change if happened during the upload
      // https://github.com/arduino/arduino-cli/issues/2245
      this.uploadInProgress = false;
      this.menuManager.update();
      this.onDidChangeEmitter.fire();
    }
  }

  private async uploadOptions(
    usingProgrammer: boolean,
    verifyOptions: CoreService.Options.Compile
  ): Promise<CoreService.Options.Upload | undefined> {
    const sketch = await this.sketchServiceClient.currentSketch();
    if (!CurrentSketch.isValid(sketch)) {
      return undefined;
    }
    const userFields = this.userFields.getUserFields();
    const { boardsConfig } = this.boardsServiceProvider;
    const [fqbn, { selectedProgrammer: programmer }, verify, verbose] =
      await Promise.all([
        verifyOptions.fqbn, // already decorated FQBN
        this.boardsDataStore.getData(sanitizeFqbn(verifyOptions.fqbn)),
        this.preferences.get('arduino.upload.verify'),
        this.preferences.get('arduino.upload.verbose'),
      ]);
    const port = boardsConfig.selectedPort;
    return {
      sketch,
      fqbn,
      ...(usingProgrammer && { programmer }),
      port,
      verbose,
      verify,
      userFields,
    };
  }
}

export namespace UploadSketch {
  export namespace Commands {
    export const UPLOAD_SKETCH: Command = {
      id: 'lingzhi-upload-sketch',
    };
    export const UPLOAD_WITH_CONFIGURATION: Command & { label: string } = {
      id: 'arduino-upload-with-configuration-sketch',
      label: '配置并上传',
      category: 'LingZhi',
    };
    export const UPLOAD_SKETCH_USING_PROGRAMMER: Command = {
      id: 'lingzhi-upload-sketch-using-programmer',
    };
    export const UPLOAD_SKETCH_TOOLBAR: Command = {
      id: 'lingzhi-upload-sketch--toolbar',
    };
  }
}
