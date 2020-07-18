import { injectable } from 'inversify';
import { EditorContribution, Command, MenuModelRegistry, KeybindingRegistry, CommandRegistry } from './contribution';
import { ArduinoMenus } from '../menu/arduino-menus';

@injectable()
export class ToggleComment extends EditorContribution {

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(ToggleComment.Commands.TOGGLE_COMMENT, {
            execute: () => this.toggleComment()
        });
    }

    registerMenus(registry: MenuModelRegistry): void {
        registry.registerMenuAction(ArduinoMenus.EDIT__CODE_CONTROL_GROUP, {
            commandId: ToggleComment.Commands.TOGGLE_COMMENT.id,
            label: 'Comment/Uncomment',
            order: '0'
        });
    }

    registerKeybindings(registry: KeybindingRegistry): void {
        registry.registerKeybinding({
            command: ToggleComment.Commands.TOGGLE_COMMENT.id,
            keybinding: 'CtrlCmd+L'
        });
    }

    async toggleComment(): Promise<void> {
        return this.run('editor.action.commentLine');
    }

}

export namespace ToggleComment {
    export namespace Commands {
        export const TOGGLE_COMMENT: Command = {
            id: 'arduino-toggle-comment'
        };
    }
}
