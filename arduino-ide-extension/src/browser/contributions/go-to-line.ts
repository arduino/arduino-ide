import { injectable } from 'inversify';
import { EditorContribution, Command, MenuModelRegistry, KeybindingRegistry, CommandRegistry } from './contribution';
import { ArduinoMenus } from '../menu/arduino-menus';

@injectable()
export class GoToLine extends EditorContribution {

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(GoToLine.Commands.GO_TO_LINE, {
            execute: () => this.goToLine()
        });
    }

    registerMenus(registry: MenuModelRegistry): void {
        registry.registerMenuAction(ArduinoMenus.EDIT__TEXT_CONTROL_GROUP, {
            commandId: GoToLine.Commands.GO_TO_LINE.id,
            label: 'Go to Line...',
            order: '6'
        });
    }

    registerKeybindings(registry: KeybindingRegistry): void {
        registry.registerKeybinding({
            command: GoToLine.Commands.GO_TO_LINE.id,
            keybinding: 'CtrlCmd+L'
        });
    }

    async goToLine(): Promise<void> {
        return this.run('editor.action.gotoLine');
    }

}

export namespace GoToLine {
    export namespace Commands {
        export const GO_TO_LINE: Command = {
            id: 'arduino-go-to-line'
        };
    }
}
