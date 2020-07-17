import { injectable } from 'inversify';
import { CommonCommands } from '@theia/core/lib/browser/common-frontend-contribution';
import { ArduinoMenus } from '../menu/arduino-menus';
import { ArduinoToolbar } from '../toolbar/arduino-toolbar';
import { SketchContribution, Command, CommandRegistry, MenuModelRegistry, KeybindingRegistry, TabBarToolbarRegistry } from './contribution';

@injectable()
export class SaveSketch extends SketchContribution {

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(SaveSketch.Commands.SAVE_SKETCH, {
            execute: () => this.saveSketch()
        });
        registry.registerCommand(SaveSketch.Commands.SAVE_SKETCH__TOOLBAR, {
            isVisible: widget => ArduinoToolbar.is(widget) && widget.side === 'left',
            execute: () => registry.executeCommand(SaveSketch.Commands.SAVE_SKETCH.id)
        });
    }

    registerMenus(registry: MenuModelRegistry): void {
        registry.registerMenuAction(ArduinoMenus.FILE__SKETCH_GROUP, {
            commandId: SaveSketch.Commands.SAVE_SKETCH.id,
            label: 'Save',
            order: '6'
        });
    }

    registerKeybindings(registry: KeybindingRegistry): void {
        registry.registerKeybinding({
            command: SaveSketch.Commands.SAVE_SKETCH.id,
            keybinding: 'CtrlCmd+S'
        });
    }

    registerToolbarItems(registry: TabBarToolbarRegistry): void {
        registry.registerItem({
            id: SaveSketch.Commands.SAVE_SKETCH__TOOLBAR.id,
            command: SaveSketch.Commands.SAVE_SKETCH__TOOLBAR.id,
            tooltip: 'Save',
            priority: 5
        });
    }

    async saveSketch(): Promise<void> {
        return this.commandService.executeCommand(CommonCommands.SAVE_ALL.id);
    }

}

export namespace SaveSketch {
    export namespace Commands {
        export const SAVE_SKETCH: Command = {
            id: 'arduino-save-sketch'
        };
        export const SAVE_SKETCH__TOOLBAR: Command = {
            id: 'arduino-save-sketch--toolbar'
        };
    }
}
