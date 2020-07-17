import { injectable } from 'inversify';
import { remote } from 'electron';
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
                    // TODO: check monaco model version. If `0` just close the app.
                    const { response } = await remote.dialog.showMessageBox({
                        type: 'question',
                        buttons: ["Don't Save", 'Cancel', 'Save'],
                        message: 'Do you want to save changes to this sketch before closing?',
                        detail: "If you don't save, your changes will be lost."
                    });
                    if (response === 1) { // Cancel
                        return;
                    }
                    if (response === 2) { // Save
                        const saved = await this.commandService.executeCommand(SaveAsSketch.Commands.SAVE_AS_SKETCH.id, { openAfterMove: false, execOnlyIfTemp: true });
                        if (!saved) { // If it was not saved, do bail the close.
                            return;
                        }
                    }
                }
                await this.commandService.executeCommand(WorkspaceCommands.CLOSE.id);
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
