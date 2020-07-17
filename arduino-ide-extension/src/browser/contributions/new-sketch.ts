import { injectable } from 'inversify';
import { ArduinoMenus } from '../menu/arduino-menus';
import { ArduinoToolbar } from '../toolbar/arduino-toolbar';
import { SketchContribution, URI, Command, CommandRegistry, MenuModelRegistry, KeybindingRegistry, TabBarToolbarRegistry } from './contribution';

@injectable()
export class NewSketch extends SketchContribution {

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(NewSketch.Commands.NEW_SKETCH, {
            execute: () => this.newSketch()
        });
        registry.registerCommand(NewSketch.Commands.NEW_SKETCH__TOOLBAR, {
            isVisible: widget => ArduinoToolbar.is(widget) && widget.side === 'left',
            execute: () => registry.executeCommand(NewSketch.Commands.NEW_SKETCH.id)
        });
    }

    registerMenus(registry: MenuModelRegistry): void {
        registry.registerMenuAction(ArduinoMenus.FILE__SKETCH_GROUP, {
            commandId: NewSketch.Commands.NEW_SKETCH.id,
            label: 'New',
            order: '0'
        });
    }

    registerKeybindings(registry: KeybindingRegistry): void {
        registry.registerKeybinding({
            command: NewSketch.Commands.NEW_SKETCH.id,
            keybinding: 'CtrlCmd+N'
        });
    }

    registerToolbarItems(registry: TabBarToolbarRegistry): void {
        registry.registerItem({
            id: NewSketch.Commands.NEW_SKETCH__TOOLBAR.id,
            command: NewSketch.Commands.NEW_SKETCH__TOOLBAR.id,
            tooltip: 'New',
            priority: 3
        });
    }

    async newSketch(): Promise<void> {
        try {
            const sketch = await this.sketchService.createNewSketch();
            this.workspaceService.open(new URI(sketch.uri));
        } catch (e) {
            await this.messageService.error(e.toString());
        }
    }

}

export namespace NewSketch {
    export namespace Commands {
        export const NEW_SKETCH: Command = {
            id: 'arduino-new-sketch'
        };
        export const NEW_SKETCH__TOOLBAR: Command = {
            id: 'arduino-new-sketch--toolbar'
        };
    }
}
