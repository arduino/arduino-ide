import { injectable } from 'inversify';
import { WorkspaceCommands } from '@theia/workspace/lib/browser/workspace-commands';
import { ArduinoMenus } from '../menu/arduino-menus';
import { SketchContribution, Command, CommandRegistry, MenuModelRegistry, KeybindingRegistry } from './contribution';
import { SaveAsSketch } from './save-as-sketch';

@injectable()
export class CloseSketch extends SketchContribution {

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(CloseSketch.Commands.CLOSE_SKETCH, {
            execute: async () => {
                const sketch = await this.getCurrentSketch();
                if (!sketch) {
                    return;
                }
                const isTemp = await this.sketchService.isTemp(sketch);
                if (isTemp) {
                    await this.commandService.executeCommand(SaveAsSketch.Commands.SAVE_AS_SKETCH.id, { openAfterMove: false, execOnlyIfTemp: true });
                    await this.commandService.executeCommand(WorkspaceCommands.CLOSE.id);
                }
            }
        });
    }

    registerMenus(registry: MenuModelRegistry): void {
        registry.registerMenuAction(ArduinoMenus.FILE__SKETCH_GROUP, {
            commandId: CloseSketch.Commands.CLOSE_SKETCH.id,
            label: 'Close',
            order: '5'
        });
    }

    registerKeybindings(registry: KeybindingRegistry): void {
        registry.registerKeybinding({
            command: CloseSketch.Commands.CLOSE_SKETCH.id,
            keybinding: 'CtrlCmd+W' // TODO: Windows binding?
        });
    }

}

export namespace CloseSketch {
    export namespace Commands {
        export const CLOSE_SKETCH: Command = {
            id: 'arduino-close-sketch'
        };
    }
}
