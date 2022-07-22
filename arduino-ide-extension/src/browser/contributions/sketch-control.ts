import { inject, injectable } from '@theia/core/shared/inversify';
import { CommonCommands } from '@theia/core/lib/browser/common-frontend-contribution';
import { ApplicationShell } from '@theia/core/lib/browser/shell/application-shell';
import { WorkspaceCommands } from '@theia/workspace/lib/browser';
import { ContextMenuRenderer } from '@theia/core/lib/browser/context-menu-renderer';
import {
  Disposable,
  DisposableCollection,
} from '@theia/core/lib/common/disposable';
import {
  URI,
  SketchContribution,
  Command,
  CommandRegistry,
  MenuModelRegistry,
  KeybindingRegistry,
  TabBarToolbarRegistry,
  open,
} from './contribution';
import { ArduinoMenus, PlaceholderMenuNode } from '../menu/arduino-menus';
import { EditorManager } from '@theia/editor/lib/browser/editor-manager';
import {
  CurrentSketch,
  SketchesServiceClientImpl,
} from '../../common/protocol/sketches-service-client-impl';
import { LocalCacheFsProvider } from '../local-cache/local-cache-fs-provider';
import { nls } from '@theia/core/lib/common';

@injectable()
export class SketchControl extends SketchContribution {
  @inject(ApplicationShell)
  protected readonly shell: ApplicationShell;

  @inject(MenuModelRegistry)
  protected readonly menuRegistry: MenuModelRegistry;

  @inject(ContextMenuRenderer)
  protected readonly contextMenuRenderer: ContextMenuRenderer;

  @inject(EditorManager)
  protected override readonly editorManager: EditorManager;

  @inject(SketchesServiceClientImpl)
  protected readonly sketchesServiceClient: SketchesServiceClientImpl;

  @inject(LocalCacheFsProvider)
  protected readonly localCacheFsProvider: LocalCacheFsProvider;

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
          const sketch = await this.sketchServiceClient.currentSketch();
          if (!CurrentSketch.isValid(sketch)) {
            return;
          }

          const target = document.getElementById(
            SketchControl.Commands.OPEN_SKETCH_CONTROL__TOOLBAR.id
          );
          if (!(target instanceof HTMLElement)) {
            return;
          }
          const { parentElement } = target;
          if (!parentElement) {
            return;
          }

          const { mainFileUri, rootFolderFileUris } = sketch;
          const uris = [mainFileUri, ...rootFolderFileUris];

          const parentSketchUri = this.editorManager.currentEditor
            ?.getResourceUri()
            ?.toString();
          const parentSketch = await this.sketchService.getSketchFolder(
            parentSketchUri || ''
          );

          // if the current file is in the current opened sketch, show extra menus
          if (
            sketch &&
            parentSketch &&
            parentSketch.uri === sketch.uri &&
            this.allowRename(parentSketch.uri)
          ) {
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
          } else {
            const renamePlaceholder = new PlaceholderMenuNode(
              ArduinoMenus.SKETCH_CONTROL__CONTEXT__MAIN_GROUP,
              nls.localize('vscode/fileActions/rename', 'Rename')
            );
            this.menuRegistry.registerMenuNode(
              ArduinoMenus.SKETCH_CONTROL__CONTEXT__MAIN_GROUP,
              renamePlaceholder
            );
            this.toDisposeBeforeCreateNewContextMenu.push(
              Disposable.create(() =>
                this.menuRegistry.unregisterMenuNode(renamePlaceholder.id)
              )
            );
          }

          if (
            sketch &&
            parentSketch &&
            parentSketch.uri === sketch.uri &&
            this.allowDelete(parentSketch.uri)
          ) {
            this.menuRegistry.registerMenuAction(
              ArduinoMenus.SKETCH_CONTROL__CONTEXT__MAIN_GROUP,
              {
                commandId: WorkspaceCommands.FILE_DELETE.id, // TODO: customize delete. Wipe sketch if deleting main file. Close window.
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
          } else {
            const deletePlaceholder = new PlaceholderMenuNode(
              ArduinoMenus.SKETCH_CONTROL__CONTEXT__MAIN_GROUP,
              nls.localize('vscode/fileActions/delete', 'Delete')
            );
            this.menuRegistry.registerMenuNode(
              ArduinoMenus.SKETCH_CONTROL__CONTEXT__MAIN_GROUP,
              deletePlaceholder
            );
            this.toDisposeBeforeCreateNewContextMenu.push(
              Disposable.create(() =>
                this.menuRegistry.unregisterMenuNode(deletePlaceholder.id)
              )
            );
          }

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

  protected isCloudSketch(uri: string): boolean {
    try {
      const cloudCacheLocation = this.localCacheFsProvider.from(new URI(uri));

      if (cloudCacheLocation) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  protected allowRename(uri: string): boolean {
    return !this.isCloudSketch(uri);
  }

  protected allowDelete(uri: string): boolean {
    return !this.isCloudSketch(uri);
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
