import { CommonCommands } from '@theia/core/lib/browser/common-frontend-contribution';
import { ContextMenuRenderer } from '@theia/core/lib/browser/context-menu-renderer';
import { ApplicationShell } from '@theia/core/lib/browser/shell/application-shell';
import {
  Disposable,
  DisposableCollection,
} from '@theia/core/lib/common/disposable';
import { inject, injectable } from '@theia/core/shared/inversify';
import { WorkspaceCommands } from '@theia/workspace/lib/browser/workspace-commands';
import { ArduinoMenus } from '../menu/arduino-menus';
import { CurrentSketch } from '../sketches-service-client-impl';
import {
  Command,
  CommandRegistry,
  KeybindingRegistry,
  MenuModelRegistry,
  open,
  SketchContribution,
  TabBarToolbarRegistry,
  URI,
} from './contribution';

@injectable()
export class SketchControl extends SketchContribution {
  @inject(ApplicationShell)
  private readonly shell: ApplicationShell;
  @inject(MenuModelRegistry)
  private readonly menuRegistry: MenuModelRegistry;
  @inject(ContextMenuRenderer)
  private readonly contextMenuRenderer: ContextMenuRenderer;

  protected readonly toDisposeBeforeCreateNewContextMenu =
    new DisposableCollection();
  public determiningWhetherToExpand = true;

  override registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(
      SketchControl.Commands.OPEN_SKETCH_CONTROL__TOOLBAR,
      {
        isVisible: (widget) =>
          this.shell.getWidgets('main').indexOf(widget) !== -1,
        execute: async (b) => {
          this.toDisposeBeforeCreateNewContextMenu.dispose();

          let parentElement: HTMLElement | undefined = undefined;
          let target: HTMLElement | null;
          if (b === true) {
            target = document.getElementById('lingzhi-daima-contextmenu-menu');
          } else {
            target = document.getElementById(
              SketchControl.Commands.OPEN_SKETCH_CONTROL__TOOLBAR.id
            );
          }
          if (target instanceof HTMLElement) {
            parentElement = target.parentElement ?? undefined;
          }
          if (!parentElement) {
            return;
          }

          const sketch = await this.sketchServiceClient.currentSketch();
          if (!CurrentSketch.isValid(sketch)) {
            return;
          }

          this.menuRegistry.registerMenuAction(
            ArduinoMenus.SKETCH_CONTROL__CONTEXT__MAIN_GROUP,
            {
              commandId: WorkspaceCommands.FILE_RENAME.id,
              label: '重命名',
              order: '1',
            }
          );
          this.toDisposeBeforeCreateNewContextMenu.push(
            Disposable.create(() =>
              this.menuRegistry.unregisterMenuAction(
                WorkspaceCommands.FILE_RENAME
              )
            )
          );

          this.menuRegistry.registerMenuAction(
            ArduinoMenus.SKETCH_CONTROL__CONTEXT__MAIN_GROUP,
            {
              commandId: WorkspaceCommands.FILE_DELETE.id,
              label: '删除',
              order: '2',
            }
          );
          this.toDisposeBeforeCreateNewContextMenu.push(
            Disposable.create(() =>
              this.menuRegistry.unregisterMenuAction(
                WorkspaceCommands.FILE_DELETE
              )
            )
          );
          if (this.determiningWhetherToExpand) {
            this.menuRegistry.registerMenuAction(
              ArduinoMenus.SKETCH_CONTROL__CONTEXT__NAVIGATION_GROUP,
              {
                commandId: CommonCommands.PREVIOUS_TAB.id,
                label: '上一个选项卡',
                order: '0',
              }
            );
            this.toDisposeBeforeCreateNewContextMenu.push(
              Disposable.create(() =>
                this.menuRegistry.unregisterMenuAction(
                  CommonCommands.PREVIOUS_TAB
                )
              )
            );
            this.menuRegistry.registerMenuAction(
              ArduinoMenus.SKETCH_CONTROL__CONTEXT__NAVIGATION_GROUP,
              {
                commandId: CommonCommands.NEXT_TAB.id,
                label: '下一个选项卡',
                order: '0',
              }
            );
            this.toDisposeBeforeCreateNewContextMenu.push(
              Disposable.create(() =>
                this.menuRegistry.unregisterMenuAction(CommonCommands.NEXT_TAB)
              )
            );
          }

          const { mainFileUri, rootFolderFileUris } = sketch;
          const uris = [mainFileUri, ...rootFolderFileUris];
          for (let i = 0; i < uris.length; i++) {
            const uri = new URI(uris[i]);

            // focus on the opened sketch
            const command = {
              id: `arduino-focus-file--${uri.toString()}`,
            };
            const handler = {
              execute: () => open(this.openerService, uri),
            };
            this.toDisposeBeforeCreateNewContextMenu.push(
              registry.registerCommand(command, handler)
            );
            if (this.determiningWhetherToExpand) {
              this.menuRegistry.registerMenuAction(
                ArduinoMenus.SKETCH_CONTROL__CONTEXT__RESOURCES_GROUP,
                {
                  commandId: command.id,
                  label: this.labelProvider.getName(uri),
                  order: String(i).padStart(4),
                }
              );
              this.toDisposeBeforeCreateNewContextMenu.push(
                Disposable.create(() =>
                  this.menuRegistry.unregisterMenuAction(command)
                )
              );
            }
          }
          const options = {
            // 定义菜单路径，通常是一个特定的标识符，用于确定要显示的菜单内容
            menuPath: ArduinoMenus.SKETCH_CONTROL__CONTEXT,
            anchor: {
              // 锚点的 x 坐标，设置为父元素的左边界位置
              x: parentElement.getBoundingClientRect().left,
              // 锚点的 y 坐标，设置为父元素的上边界位置加上父元素的高度
              y:
                parentElement.getBoundingClientRect().top +
                parentElement.offsetHeight,
            },
            // 是否显示禁用的菜单项
            showDisabled: true,
          };
          // 调用上下文菜单渲染器来渲染菜单，传入配置选项
          this.contextMenuRenderer.render(options);
        },
      }
    );
  }

  override registerMenus(registry: MenuModelRegistry): void {
    registry.registerMenuAction(
      ArduinoMenus.SKETCH_CONTROL__CONTEXT__MAIN_GROUP,
      {
        commandId: WorkspaceCommands.NEW_FILE.id,
        label: '新建标签页',
        order: '0',
      }
    );
  }

  override registerKeybindings(registry: KeybindingRegistry): void {
    registry.registerKeybinding({
      command: WorkspaceCommands.NEW_FILE.id,
      keybinding: 'CtrlCmd+Shift+N',
    });
    registry.registerKeybinding({
      command: CommonCommands.PREVIOUS_TAB.id,
      keybinding: 'CtrlCmd+Alt+Left',
    });
    registry.registerKeybinding({
      command: CommonCommands.NEXT_TAB.id,
      keybinding: 'CtrlCmd+Alt+Right',
    });
  }

  override registerToolbarItems(registry: TabBarToolbarRegistry): void {
    registry.registerItem({
      id: SketchControl.Commands.OPEN_SKETCH_CONTROL__TOOLBAR.id,
      command: SketchControl.Commands.OPEN_SKETCH_CONTROL__TOOLBAR.id,
    });
  }
}

export namespace SketchControl {
  export namespace Commands {
    export const OPEN_SKETCH_CONTROL__TOOLBAR: Command = {
      id: 'lingzhi-open-sketch-control--toolbar',
      iconClass: 'fa lingzhi-a-24gf-ellipsisVertical',
    };
  }
}
