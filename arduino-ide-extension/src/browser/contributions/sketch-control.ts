import { inject, injectable } from 'inversify';
import { CommonCommands } from '@theia/core/lib/browser/common-frontend-contribution';
import { ApplicationShell } from '@theia/core/lib/browser/shell/application-shell';
import { WorkspaceCommands } from '@theia/workspace/lib/browser';
import { ContextMenuRenderer } from '@theia/core/lib/browser/context-menu-renderer';
import { Disposable, DisposableCollection } from '@theia/core/lib/common/disposable';
import { URI, SketchContribution, Command, CommandRegistry, MenuModelRegistry, KeybindingRegistry, TabBarToolbarRegistry, open } from './contribution';
import { ArduinoMenus } from '../menu/arduino-menus';

@injectable()
export class SketchControl extends SketchContribution {

    @inject(ApplicationShell)
    protected readonly shell: ApplicationShell;

    @inject(MenuModelRegistry)
    protected readonly menuRegistry: MenuModelRegistry;

    @inject(ContextMenuRenderer)
    protected readonly contextMenuRenderer: ContextMenuRenderer;

    protected readonly toDisposeBeforeCreateNewContextMenu = new DisposableCollection();

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(SketchControl.Commands.OPEN_SKETCH_CONTROL__TOOLBAR, {
            isVisible: widget => this.shell.getWidgets('main').indexOf(widget) !== -1,
            execute: async () => {
                this.toDisposeBeforeCreateNewContextMenu.dispose();
                const sketch = await this.sketchServiceClient.currentSketch();
                if (!sketch) {
                    return;
                }

                const target = document.getElementById(SketchControl.Commands.OPEN_SKETCH_CONTROL__TOOLBAR.id);
                if (!(target instanceof HTMLElement)) {
                    return;
                }
                const { parentElement } = target;
                if (!parentElement) {
                    return;
                }

                const { mainFileUri, rootFolderFileUris } = await this.sketchService.loadSketch(sketch.uri);
                const uris = [mainFileUri, ...rootFolderFileUris];
                for (let i = 0; i < uris.length; i++) {
                    const uri = new URI(uris[i]);
                    const command = { id: `arduino-focus-file--${uri.toString()}` };
                    const handler = { execute: () => open(this.openerService, uri) };
                    this.toDisposeBeforeCreateNewContextMenu.push(registry.registerCommand(command, handler));
                    this.menuRegistry.registerMenuAction(ArduinoMenus.SKETCH_CONTROL__CONTEXT__RESOURCES_GROUP, {
                        commandId: command.id,
                        label: this.labelProvider.getName(uri),
                        order: `${i}`
                    });
                    this.toDisposeBeforeCreateNewContextMenu.push(Disposable.create(() => this.menuRegistry.unregisterMenuAction(command)));
                }
                const options = {
                    menuPath: ArduinoMenus.SKETCH_CONTROL__CONTEXT,
                    anchor: {
                        x: parentElement.getBoundingClientRect().left,
                        y: parentElement.getBoundingClientRect().top + parentElement.offsetHeight
                    }
                }
                this.contextMenuRenderer.render(options);
            }
        });
    }

    registerMenus(registry: MenuModelRegistry): void {
        registry.registerMenuAction(ArduinoMenus.SKETCH_CONTROL__CONTEXT__MAIN_GROUP, {
            commandId: WorkspaceCommands.NEW_FILE.id,
            label: 'New Tab',
            order: '0'
        });
        registry.registerMenuAction(ArduinoMenus.SKETCH_CONTROL__CONTEXT__MAIN_GROUP, {
            commandId: WorkspaceCommands.FILE_RENAME.id,
            label: 'Rename',
            order: '1'
        });
        registry.registerMenuAction(ArduinoMenus.SKETCH_CONTROL__CONTEXT__MAIN_GROUP, {
            commandId: WorkspaceCommands.FILE_DELETE.id, // TODO: customize delete. Wipe sketch if deleting main file. Close window.
            label: 'Delete',
            order: '2'
        });

        registry.registerMenuAction(ArduinoMenus.SKETCH_CONTROL__CONTEXT__NAVIGATION_GROUP, {
            commandId: CommonCommands.PREVIOUS_TAB.id,
            label: 'Previous Tab',
            order: '0'
        });
        registry.registerMenuAction(ArduinoMenus.SKETCH_CONTROL__CONTEXT__NAVIGATION_GROUP, {
            commandId: CommonCommands.NEXT_TAB.id,
            label: 'Next Tab',
            order: '0'
        });
    }

    registerKeybindings(registry: KeybindingRegistry): void {
        registry.registerKeybinding({
            command: WorkspaceCommands.NEW_FILE.id,
            keybinding: 'CtrlCmd+Shift+N'
        });
        registry.registerKeybinding({
            command: CommonCommands.PREVIOUS_TAB.id,
            keybinding: 'CtrlCmd+Alt+Left' // TODO: check why electron does not show the keybindings in the UI.
        });
        registry.registerKeybinding({
            command: CommonCommands.NEXT_TAB.id,
            keybinding: 'CtrlCmd+Alt+Right'
        });
    }

    registerToolbarItems(registry: TabBarToolbarRegistry): void {
        registry.registerItem({
            id: SketchControl.Commands.OPEN_SKETCH_CONTROL__TOOLBAR.id,
            command: SketchControl.Commands.OPEN_SKETCH_CONTROL__TOOLBAR.id
        });
    }

}

export namespace SketchControl {
    export namespace Commands {
        export const OPEN_SKETCH_CONTROL__TOOLBAR: Command = {
            id: 'arduino-open-sketch-control--toolbar',
            iconClass: 'fa fa-caret-down'
        };
    }
}
