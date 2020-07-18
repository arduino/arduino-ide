import { inject, injectable } from 'inversify';
import { EditorContribution, Command, MenuModelRegistry, KeybindingRegistry, CommandRegistry } from './contribution';
import { ClipboardService } from '@theia/core/lib/browser/clipboard-service';
import { ArduinoMenus } from '../menu/arduino-menus';

@injectable()
export class CopyToForum extends EditorContribution {

    @inject(ClipboardService)
    protected readonly clipboardService: ClipboardService;

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(CopyToForum.Commands.COPY_TO_FORUM, {
            execute: () => this.copyToForum()
        })
    }

    registerMenus(registry: MenuModelRegistry): void {
        registry.registerMenuAction(ArduinoMenus.EDIT__TEXT_CONTROL_GROUP, {
            commandId: CopyToForum.Commands.COPY_TO_FORUM.id,
            label: 'Copy to Forum',
            order: '2'
        });
    }

    registerKeybindings(registry: KeybindingRegistry): void {
        registry.registerKeybinding({
            command: CopyToForum.Commands.COPY_TO_FORUM.id,
            keybinding: 'CtrlCmd+Shift+C'
        });
    }

    async copyToForum(): Promise<void> {
        const editor = await this.current();
        if (editor) {
            const value = editor.getControl().getModel()?.getValue();
            if (value !== undefined) {
                return this.clipboardService.writeText(`[code]
${value}
[/code]`);
            }
        }
    }

}

export namespace CopyToForum {
    export namespace Commands {
        export const COPY_TO_FORUM: Command = {
            id: 'arduino-copy-to-forum'
        };
    }
}
