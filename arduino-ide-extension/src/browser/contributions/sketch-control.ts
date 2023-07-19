import { CommonCommands } from '@theia/core/lib/browser/common-frontend-contribution';
import { ContextMenuRenderer } from '@theia/core/lib/browser/context-menu-renderer';
import { ApplicationShell } from '@theia/core/lib/browser/shell/application-shell';
import {
  Disposable,
  DisposableCollection,
} from '@theia/core/lib/common/disposable';
import { nls } from '@theia/core/lib/common/nls';
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

  override registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(
      SketchControl.Commands.OPEN_SKETCH_CONTROL__TOOLBAR,
      {
        isVisible: (widget) =>
          this.shell.getWidgets('main').indexOf(widget) !== -1,
        execute: async () => {
          this.toDisposeBeforeCreateNewContextMenu.dispose();

          let parentElement: HTMLElement | undefined = undefined;
          const target = document.getElementById(
            SketchControl.Commands.OPEN_SKETCH_CONTROL__TOOLBAR.id
          );
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
              label: nls.localize('vscode/fileActions/rename', 'Rename'),
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
              label: nls.localize('vscode/fileActions/delete', 'Delete'),
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
          const options = {
            menuPath: ArduinoMenus.SKETCH_CONTROL__CONTEXT,
            anchor: {
              x: parentElement.getBoundingClientRect().left,
              y:
                parentElement.getBoundingClientRect().top +
                parentElement.offsetHeight,
            },
            showDisabled: true,
          };
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
        label: nls.localize('vscode/menubar/mNewTab', 'New Tab'),
        order: '0',
      }
    );

    registry.registerMenuAction(
      ArduinoMenus.SKETCH_CONTROL__CONTEXT__NAVIGATION_GROUP,
      {
        commandId: CommonCommands.PREVIOUS_TAB.id,
        label: nls.localize('vscode/menubar/mShowPreviousTab', 'Previous Tab'),
        order: '0',
      }
    );
    registry.registerMenuAction(
      ArduinoMenus.SKETCH_CONTROL__CONTEXT__NAVIGATION_GROUP,
      {
        commandId: CommonCommands.NEXT_TAB.id,
        label: nls.localize('vscode/menubar/mShowNextTab', 'Next Tab'),
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
      id: 'arduino-open-sketch-control--toolbar',
      iconClass: 'fa fa-arduino-sketch-tabs-menu',
    };
  }
}
