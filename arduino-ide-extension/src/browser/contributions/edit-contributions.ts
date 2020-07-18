import { inject, injectable } from 'inversify';
import { EditorManager } from '@theia/editor/lib/browser';
import { MonacoEditor } from '@theia/monaco/lib/browser/monaco-editor';
import { Contribution, Command, MenuModelRegistry, KeybindingRegistry, CommandRegistry } from './contribution';
import { ArduinoMenus } from '../menu/arduino-menus';
import { ClipboardService } from '@theia/core/lib/browser/clipboard-service';
import { CommonCommands } from '@theia/core/lib/browser';

// TODO: [macOS]: to remove `Start Dictation...` and `Emoji & Symbol` see this thread: https://github.com/electron/electron/issues/8283#issuecomment-269522072
// Depends on https://github.com/eclipse-theia/theia/pull/7964
@injectable()
export class EditContributions extends Contribution {

    @inject(EditorManager)
    protected readonly editorManager: EditorManager;

    @inject(ClipboardService)
    protected readonly clipboardService: ClipboardService;

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(EditContributions.Commands.GO_TO_LINE, { execute: () => this.run('editor.action.gotoLine') });
        registry.registerCommand(EditContributions.Commands.TOGGLE_COMMENT, { execute: () => this.run('editor.action.commentLine') });
        registry.registerCommand(EditContributions.Commands.INDENT_LINES, { execute: () => this.run('editor.action.indentLines') });
        registry.registerCommand(EditContributions.Commands.OUTDENT_LINES, { execute: () => this.run('editor.action.outdentLines') });
        registry.registerCommand(EditContributions.Commands.FIND, { execute: () => this.run('actions.find') });
        registry.registerCommand(EditContributions.Commands.FIND_NEXT, { execute: () => this.run('actions.findWithSelection') });
        registry.registerCommand(EditContributions.Commands.FIND_PREVIOUS, { execute: () => this.run('editor.action.nextMatchFindAction') });
        registry.registerCommand(EditContributions.Commands.USE_FOR_FIND, { execute: () => this.run('editor.action.previousSelectionMatchFindAction') });
        /* Tools */registry.registerCommand(EditContributions.Commands.AUTO_FORMAT, { execute: () => this.run('editor.action.formatDocument') });
        registry.registerCommand(EditContributions.Commands.COPY_FOR_FORUM, {
            execute: async () => {
                const value = await this.currentValue();
                if (value !== undefined) {
                    this.clipboardService.writeText(`[code]
${value}
[/code]`)
                }
            }
        });
        registry.registerCommand(EditContributions.Commands.COPY_FOR_GITHUB, {
            execute: async () => {
                const value = await this.currentValue();
                if (value !== undefined) {
                    this.clipboardService.writeText(`\`\`\`cpp
${value}
\`\`\``)
                }
            }
        });
    }

    registerMenus(registry: MenuModelRegistry): void {
        registry.registerMenuAction(ArduinoMenus.EDIT__TEXT_CONTROL_GROUP, {
            commandId: CommonCommands.CUT.id,
            order: '0'
        });
        registry.registerMenuAction(ArduinoMenus.EDIT__TEXT_CONTROL_GROUP, {
            commandId: CommonCommands.COPY.id,
            order: '1'
        });
        registry.registerMenuAction(ArduinoMenus.EDIT__TEXT_CONTROL_GROUP, {
            commandId: EditContributions.Commands.COPY_FOR_FORUM.id,
            label: 'Copy for Forum',
            order: '2'
        });
        registry.registerMenuAction(ArduinoMenus.EDIT__TEXT_CONTROL_GROUP, {
            commandId: EditContributions.Commands.COPY_FOR_GITHUB.id,
            label: 'Copy for GitHub',
            order: '3'
        });
        registry.registerMenuAction(ArduinoMenus.EDIT__TEXT_CONTROL_GROUP, {
            commandId: CommonCommands.PASTE.id,
            order: '4'
        });
        registry.registerMenuAction(ArduinoMenus.EDIT__TEXT_CONTROL_GROUP, {
            commandId: CommonCommands.SELECT_ALL.id,
            order: '5'
        });
        registry.registerMenuAction(ArduinoMenus.EDIT__TEXT_CONTROL_GROUP, {
            commandId: EditContributions.Commands.GO_TO_LINE.id,
            label: 'Go to Line...',
            order: '6'
        });

        registry.registerMenuAction(ArduinoMenus.EDIT__CODE_CONTROL_GROUP, {
            commandId: EditContributions.Commands.TOGGLE_COMMENT.id,
            label: 'Comment/Uncomment',
            order: '0'
        });
        registry.registerMenuAction(ArduinoMenus.EDIT__CODE_CONTROL_GROUP, {
            commandId: EditContributions.Commands.INDENT_LINES.id,
            label: 'Increase Indent',
            order: '1'
        });
        registry.registerMenuAction(ArduinoMenus.EDIT__CODE_CONTROL_GROUP, {
            commandId: EditContributions.Commands.OUTDENT_LINES.id,
            label: 'Decrease Indent',
            order: '2'
        });

        registry.registerMenuAction(ArduinoMenus.EDIT__FIND_GROUP, {
            commandId: EditContributions.Commands.FIND.id,
            label: 'Find',
            order: '0'
        });
        registry.registerMenuAction(ArduinoMenus.EDIT__FIND_GROUP, {
            commandId: EditContributions.Commands.FIND_NEXT.id,
            label: 'Find Next',
            order: '1'
        });
        registry.registerMenuAction(ArduinoMenus.EDIT__FIND_GROUP, {
            commandId: EditContributions.Commands.FIND_PREVIOUS.id,
            label: 'Find Previous',
            order: '2'
        });
        registry.registerMenuAction(ArduinoMenus.EDIT__FIND_GROUP, {
            commandId: EditContributions.Commands.USE_FOR_FIND.id,
            label: 'Use Selection for Find', // XXX: The Java IDE uses `Use Selection For Find`.
            order: '3'
        });

        // `Tools`
        registry.registerMenuAction(ArduinoMenus.TOOLS__MAIN_GROUP, {
            commandId: EditContributions.Commands.AUTO_FORMAT.id,
            label: 'Auto Format', // XXX: The Java IDE uses `Use Selection For Find`.
            order: '0'
        });
    }

    registerKeybindings(registry: KeybindingRegistry): void {
        registry.registerKeybinding({
            command: EditContributions.Commands.COPY_FOR_FORUM.id,
            keybinding: 'CtrlCmd+Shift+C'
        });
        registry.registerKeybinding({
            command: EditContributions.Commands.COPY_FOR_GITHUB.id,
            keybinding: 'CtrlCmd+Alt+C'
        });
        registry.registerKeybinding({
            command: EditContributions.Commands.GO_TO_LINE.id,
            keybinding: 'CtrlCmd+L'
        });

        registry.registerKeybinding({
            command: EditContributions.Commands.TOGGLE_COMMENT.id,
            keybinding: 'CtrlCmd+/'
        });
        registry.registerKeybinding({
            command: EditContributions.Commands.INDENT_LINES.id,
            keybinding: 'Tab'
        });
        registry.registerKeybinding({
            command: EditContributions.Commands.OUTDENT_LINES.id,
            keybinding: 'Shift+Tab'
        });

        registry.registerKeybinding({
            command: EditContributions.Commands.FIND.id,
            keybinding: 'CtrlCmd+F'
        });
        registry.registerKeybinding({
            command: EditContributions.Commands.FIND_NEXT.id,
            keybinding: 'CtrlCmd+G'
        });
        registry.registerKeybinding({
            command: EditContributions.Commands.FIND_PREVIOUS.id,
            keybinding: 'CtrlCmd+Shift+G'
        });
        registry.registerKeybinding({
            command: EditContributions.Commands.USE_FOR_FIND.id,
            keybinding: 'CtrlCmd+E'
        });

        // `Tools`
        registry.registerKeybinding({
            command: EditContributions.Commands.AUTO_FORMAT.id,
            keybinding: 'CtrlCmd+T'
        });
    }

    protected async current(): Promise<MonacoEditor | undefined> {
        const editor = this.editorManager.currentEditor?.editor;
        return editor instanceof MonacoEditor ? editor : undefined;
    }

    protected async currentValue(): Promise<string | undefined> {
        return this.editorManager.currentEditor?.editor.document.getText();
    }

    protected async run(commandId: string): Promise<any> {
        const editor = await this.current();
        if (editor) {
            const action = editor.getControl().getAction(commandId);
            if (action) {
                return action.run();
            }
        }
    }

}

export namespace EditContributions {
    export namespace Commands {
        export const COPY_FOR_FORUM: Command = {
            id: 'arduino-copy-for-forum'
        };
        export const COPY_FOR_GITHUB: Command = {
            id: 'arduino-copy-for-github'
        };
        export const GO_TO_LINE: Command = {
            id: 'arduino-go-to-line'
        };
        export const TOGGLE_COMMENT: Command = {
            id: 'arduino-toggle-comment'
        };
        export const INDENT_LINES: Command = {
            id: 'arduino-indent-lines'
        };
        export const OUTDENT_LINES: Command = {
            id: 'arduino-outdent-lines'
        };
        export const FIND: Command = {
            id: 'arduino-find'
        };
        export const FIND_NEXT: Command = {
            id: 'arduino-find-next'
        };
        export const FIND_PREVIOUS: Command = {
            id: 'arduino-find-previous'
        };
        export const USE_FOR_FIND: Command = {
            id: 'arduino-for-find'
        };
        // `Auto Format` does not belong here.
        export const AUTO_FORMAT: Command = {
            id: 'arduino-auto-format'
        };
    }
}
