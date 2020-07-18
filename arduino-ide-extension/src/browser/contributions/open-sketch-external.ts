import { injectable } from 'inversify';
import { remote } from 'electron';
import { ArduinoMenus } from '../menu/arduino-menus';
import { SketchContribution, Command, CommandRegistry, MenuModelRegistry, KeybindingRegistry, URI } from './contribution';

@injectable()
export class OpenSketchExternal extends SketchContribution {

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(OpenSketchExternal.Commands.OPEN_EXTERNAL, {
            execute: () => this.openExternal()
        });
    }

    registerMenus(registry: MenuModelRegistry): void {
        registry.registerMenuAction(ArduinoMenus.SKETCH__UTILS_GROUP, {
            commandId: OpenSketchExternal.Commands.OPEN_EXTERNAL.id,
            label: 'Show Sketch Folder',
            order: '0'
        });
    }

    registerKeybindings(registry: KeybindingRegistry): void {
        registry.registerKeybinding({
            command: OpenSketchExternal.Commands.OPEN_EXTERNAL.id,
            keybinding: 'CtrlCmd+Alt+K'
        });
    }

    protected async openExternal(): Promise<void> {
        const sketch = await this.currentSketch();
        if (sketch) {
            const uri = new URI(sketch.uri).resolve(`${sketch.name}.ino`).toString();
            const exists = this.fileSystem.exists(uri);
            if (exists) {
                const fsPath = await this.fileSystem.getFsPath(uri);
                if (fsPath) {
                    remote.shell.showItemInFolder(fsPath);
                }
            }
        }
    }

}

export namespace OpenSketchExternal {
    export namespace Commands {
        export const OPEN_EXTERNAL: Command = {
            id: 'arduino-open-sketch-external'
        };
    }
}
