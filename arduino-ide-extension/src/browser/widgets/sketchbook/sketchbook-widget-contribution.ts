import { inject, injectable } from '@theia/core/shared/inversify';
import {
  CommandRegistry,
  CommandService,
} from '@theia/core/lib/common/command';
import { MenuModelRegistry } from '@theia/core/lib/common/menu';
import { PreferenceService } from '@theia/core/lib/browser/preferences/preference-service';
import { AbstractViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import { FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application';
import { MainMenuManager } from '../../../common/main-menu-manager';
import { ArduinoPreferences } from '../../arduino-preferences';
import { SketchbookWidget } from './sketchbook-widget';
import { PlaceholderMenuNode } from '../../menu/arduino-menus';
import { SketchbookTree } from './sketchbook-tree';
import { SketchbookCommands } from './sketchbook-commands';
import { WorkspaceService } from '../../theia/workspace/workspace-service';
import {
  CommonCommands,
  CommonMenus,
  ContextMenuRenderer,
  Navigatable,
  RenderContextMenuOptions,
  SelectableTreeNode,
  Widget,
} from '@theia/core/lib/browser';
import {
  Disposable,
  DisposableCollection,
} from '@theia/core/lib/common/disposable';
import {
  CurrentSketch,
  SketchesServiceClientImpl,
} from '../../sketches-service-client-impl';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { URI } from '../../contributions/contribution';
import { WorkspaceInput } from '@theia/workspace/lib/browser';
import { MyWidgetCommandOther } from '../../boardImg/boardImg-widget-contribution';

// 定义 Sketchbook 的上下文标识
export const SKETCHBOOK__CONTEXT = ['arduino-sketchbook--context'];

// 定义 Sketchbook 上下文的主组标识，包括“Open Folder”和“Open in New Window”操作
export const SKETCHBOOK__CONTEXT__MAIN_GROUP = [
  ...SKETCHBOOK__CONTEXT,
  '0_main',
];

// 可注入的 SketchbookWidgetContribution 类
@injectable()
export class SketchbookWidgetContribution
  extends AbstractViewContribution<SketchbookWidget>
  implements FrontendApplicationContribution {
  // 注入 Arduino 偏好设置服务
  @inject(ArduinoPreferences)
  protected readonly arduinoPreferences: ArduinoPreferences;

  // 注入偏好服务
  @inject(PreferenceService)
  protected readonly preferenceService: PreferenceService;

  // 注入主菜单管理器
  @inject(MainMenuManager)
  protected readonly mainMenuManager: MainMenuManager;

  // 注入工作区服务
  @inject(WorkspaceService)
  protected readonly workspaceService: WorkspaceService;

  // 注入菜单模型注册表
  @inject(MenuModelRegistry)
  protected readonly menuRegistry: MenuModelRegistry;

  // 注入草图服务客户端实现
  @inject(SketchesServiceClientImpl)
  protected readonly sketchServiceClient: SketchesServiceClientImpl;

  // 注入上下文菜单渲染器
  @inject(ContextMenuRenderer)
  protected readonly contextMenuRenderer: ContextMenuRenderer;

  // 注入文件服务
  @inject(FileService)
  protected readonly fileService: FileService;

  @inject(CommandService)
  private commandService: CommandService;

  // 用于存储在新上下文菜单创建前需要清理的可清理对象集合
  protected readonly toDisposeBeforeNewContextMenu = new DisposableCollection();

  constructor() {
    // 调用父类构造函数，配置 SketchbookWidget 的相关参数
    super({
      widgetId: 'arduino-sketchbook-widget',
      widgetName: SketchbookWidget.LABEL,
      defaultWidgetOptions: {
        area: 'left',
        rank: 2,
      },
      toggleCommandId: SketchbookCommands.TOGGLE_SKETCHBOOK_WIDGET.id,
      toggleKeybinding: 'CtrlCmd+Shift+B',
    });
  }

  // 在应用启动时调用
  onStart(): void {
    // 监听当前活动小部件变化事件，当变化时调用处理函数
    this.shell.onDidChangeCurrentWidget(() =>
      this.onCurrentWidgetChangedHandler()
    );

    // 监听 Arduino 偏好设置变化事件，当特定偏好设置变化时更新主菜单
    this.arduinoPreferences.onPreferenceChanged(({ preferenceName }) => {
      if (preferenceName === 'arduino.sketchbook.showAllFiles') {
        this.mainMenuManager.update();
      }
    });
  }

  // 初始化布局，打开 SketchbookWidget
  async initializeLayout(): Promise<void> {
    return this.openView() as Promise<any>;
  }

  // 注册命令，覆盖父类方法
  override registerCommands(registry: CommandRegistry): void {
    super.registerCommands(registry);
    // 注册显示 Sketch 节点的命令
    registry.registerCommand(SketchbookCommands.REVEAL_SKETCH_NODE, {
      execute: (treeWidgetId: string, nodeUri: string) =>
        this.revealSketchNode(treeWidgetId, nodeUri),
    });

    registry.registerCommand(LINGZHI_OPEN_SKETCHBOOK_WIDGET, {
      execute: () => {
        super.openView({ activate: false, reveal: true });
        this.commandService.executeCommand(MyWidgetCommandOther.id);
      },
    });

    // 注册在新窗口中打开的命令
    registry.registerCommand(SketchbookCommands.OPEN_NEW_WINDOW, {
      execute: (arg) => this.openNewWindow(arg.node, arg?.treeWidgetId),
      isEnabled: (arg) =>
        !!arg && 'node' in arg && SketchbookTree.SketchDirNode.is(arg.node),
      isVisible: (arg) =>
        !!arg && 'node' in arg && SketchbookTree.SketchDirNode.is(arg.node),
    });
    // 注册在文件管理器中显示的命令
    registry.registerCommand(SketchbookCommands.REVEAL_IN_FINDER, {
      execute: async (arg) => {
        if (arg.node.uri) {
          const exists = await this.fileService.exists(new URI(arg.node.uri));
          if (exists) {
            const fsPath = await this.fileService.fsPath(new URI(arg.node.uri));
            if (fsPath) {
              window.electronArduino.openPath(fsPath);
            }
          }
        }
      },
      isEnabled: (arg) =>
        !!arg && 'node' in arg && SketchbookTree.SketchDirNode.is(arg.node),
      isVisible: (arg) =>
        !!arg && 'node' in arg && SketchbookTree.SketchDirNode.is(arg.node),
    });
    // 注册打开 Sketchbook 上下文菜单的命令
    registry.registerCommand(SketchbookCommands.OPEN_SKETCHBOOK_CONTEXT_MENU, {
      isEnabled: (arg) =>
        !!arg && 'node' in arg && SketchbookTree.SketchDirNode.is(arg.node),
      isVisible: (arg) =>
        !!arg && 'node' in arg && SketchbookTree.SketchDirNode.is(arg.node),
      execute: async (arg) => {
        // 清理上一个上下文菜单的条目
        this.toDisposeBeforeNewContextMenu.dispose();
        const container = arg.event.target;
        if (!container) {
          return;
        }
        // 如果当前 Sketch 与要打开上下文菜单的 Sketch 相同，禁用“打开 Sketch”命令，否则使其可点击
        const currentSketch = await this.sketchServiceClient.currentSketch();
        if (
          CurrentSketch.isValid(currentSketch) &&
          currentSketch.uri === arg.node.uri.toString()
        ) {
          const placeholder = new PlaceholderMenuNode(
            SKETCHBOOK__CONTEXT__MAIN_GROUP,
            SketchbookCommands.OPEN_NEW_WINDOW.label!
          );
          this.menuRegistry.registerMenuNode(
            SKETCHBOOK__CONTEXT__MAIN_GROUP,
            placeholder
          );
          this.toDisposeBeforeNewContextMenu.push(
            Disposable.create(() =>
              this.menuRegistry.unregisterMenuNode(placeholder.id)
            )
          );
        } else {
          this.menuRegistry.registerMenuAction(
            SKETCHBOOK__CONTEXT__MAIN_GROUP,
            {
              commandId: SketchbookCommands.OPEN_NEW_WINDOW.id,
              label: SketchbookCommands.OPEN_NEW_WINDOW.label,
            }
          );
          this.toDisposeBeforeNewContextMenu.push(
            Disposable.create(() =>
              this.menuRegistry.unregisterMenuAction(
                SketchbookCommands.OPEN_NEW_WINDOW
              )
            )
          );
        }
        // 创建并渲染上下文菜单的选项
        const options: RenderContextMenuOptions = {
          menuPath: SKETCHBOOK__CONTEXT,
          anchor: {
            x: container.getBoundingClientRect().left,
            y: container.getBoundingClientRect().top + container.offsetHeight,
          },
          args: [arg],
        };
        this.contextMenuRenderer.render(options);
      },
    });
  }

  // 注册菜单，覆盖父类方法
  override registerMenus(registry: MenuModelRegistry): void {
    super.registerMenus(registry);
    // 取消注册 Sketchbook 的主菜单动作
    registry.unregisterMenuAction({
      commandId: SketchbookCommands.TOGGLE_SKETCHBOOK_WIDGET.id,
    });
    // 注册 Sketchbook 上下文主组的菜单动作
    registry.registerMenuAction(SKETCHBOOK__CONTEXT__MAIN_GROUP, {
      commandId: SketchbookCommands.REVEAL_IN_FINDER.id,
      label: SketchbookCommands.REVEAL_IN_FINDER.label,
      order: '0',
    });

    // 编辑取消注册
    registry.unregisterMenuAction(CommonCommands.CUT);
    registry.unregisterMenuAction(CommonCommands.COPY);
    registry.unregisterMenuAction(CommonCommands.PASTE);
    registry.unregisterMenuAction(CommonCommands.SELECT_ALL);

    registry.registerMenuAction(CommonMenus.EDIT_CLIPBOARD, {
      commandId: CommonCommands.CUT.id,
      label: '剪切',
      order: '2',
    });

    registry.registerMenuAction(CommonMenus.EDIT_CLIPBOARD, {
      commandId: CommonCommands.COPY.id,
      label: '复制',
      order: '3',
    });

    registry.registerMenuAction(CommonMenus.EDIT_CLIPBOARD, {
      commandId: CommonCommands.PASTE.id,
      label: '粘贴',
      order: '4',
    });

    registry.registerMenuAction(CommonMenus.EDIT_CLIPBOARD, {
      commandId: CommonCommands.SELECT_ALL.id,
      label: '全选',
      order: '5',
    });

    registry.registerMenuAction(CommonMenus.EDIT_CLIPBOARD, {
      commandId: CommonCommands.UNDO.id,
      label: '撤销',
      order: '0',
    });

    registry.registerMenuAction(CommonMenus.EDIT_CLIPBOARD, {
      commandId: CommonCommands.REDO.id,
      label: '恢复',
      order: '1',
    });
  }

  // 在新窗口中打开 Sketch
  private openNewWindow(
    node: SketchbookTree.SketchDirNode,
    treeWidgetId?: string
  ): void {
    if (!treeWidgetId) {
      const widget = this.tryGetWidget();
      if (!widget) {
        console.warn(`Could not retrieve active sketchbook tree ID.`);
        return;
      }
      treeWidgetId = widget.activeTreeWidgetId();
    }
    const widget = this.tryGetWidget();
    if (widget) {
      const nodeUri = node.uri.toString();
      const options: WorkspaceInput = {};
      Object.assign(options, {
        tasks: [
          {
            command: SketchbookCommands.REVEAL_SKETCH_NODE.id,
            args: [treeWidgetId, nodeUri],
          },
        ],
      });
      return this.workspaceService.open(node.uri, options);
    }
  }

  // 选择与给定小部件相关的文件节点
  async selectWidgetFileNode(widget: Widget | undefined): Promise<void> {
    if (Navigatable.is(widget)) {
      const resourceUri = widget.getResourceUri();
      if (resourceUri) {
        const treeWidget = (await this.widget).getTreeWidget();
        const { model } = treeWidget;
        const node = await model.revealFile(resourceUri);
        if (SelectableTreeNode.is(node)) {
          model.selectNode(node);
        }
      }
    }
  }

  // 处理当前小部件变化的处理函数
  protected onCurrentWidgetChangedHandler(): void {
    this.selectWidgetFileNode(this.shell.currentWidget);
  }

  // 显示 Sketch 节点
  private async revealSketchNode(
    treeWidgetId: string,
    nodeUIri: string
  ): Promise<void> {
    return this.widget
      .then((widget) => this.shell.activateWidget(widget.id))
      .then((widget) => {
        if (widget instanceof SketchbookWidget) {
          return widget.revealSketchNode(treeWidgetId, nodeUIri);
        }
      });
  }
}

export const LINGZHI_OPEN_SKETCHBOOK_WIDGET = {
  id: 'lingzhi-open-sketchbook-widget',
};
