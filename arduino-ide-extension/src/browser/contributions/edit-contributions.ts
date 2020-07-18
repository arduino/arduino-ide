import { inject, injectable } from 'inversify';
import { EditorManager } from '@theia/editor/lib/browser';
import { MonacoEditor } from '@theia/monaco/lib/browser/monaco-editor';
import { Contribution, Command, MenuModelRegistry, KeybindingRegistry, CommandRegistry } from './contribution';
import { ArduinoMenus } from '../menu/arduino-menus';
import { ClipboardService } from '@theia/core/lib/browser/clipboard-service';

@injectable()
export class EditContributions extends Contribution {

    @inject(ClipboardService)
    protected readonly clipboardService: ClipboardService;

    @inject(EditorManager)
    protected readonly editorManager: EditorManager;

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(EditContributions.Commands.GO_TO_LINE, { execute: () => this.run('editor.action.gotoLine') });
        registry.registerCommand(EditContributions.Commands.TOGGLE_COMMENT, { execute: () => this.run('editor.action.commentLine') });
        registry.registerCommand(EditContributions.Commands.INDENT_LINES, { execute: () => this.run('editor.action.indentLines') });
        registry.registerCommand(EditContributions.Commands.OUTDENT_LINES, { execute: () => this.run('editor.action.outdentLines') });
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
        registry.registerCommand(EditContributions.Commands.COPY_FOR_MARKDOWN, {
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
            commandId: EditContributions.Commands.COPY_FOR_FORUM.id,
            label: 'Copy for Forum',
        });
        registry.registerMenuAction(ArduinoMenus.EDIT__TEXT_CONTROL_GROUP, {
            commandId: EditContributions.Commands.COPY_FOR_MARKDOWN.id,
            label: 'Copy for GitHub [Markdown]',
        });
        registry.registerMenuAction(ArduinoMenus.EDIT__TEXT_CONTROL_GROUP, {
            commandId: EditContributions.Commands.GO_TO_LINE.id,
            label: 'Go to Line...',
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
    }

    registerKeybindings(registry: KeybindingRegistry): void {
        registry.registerKeybinding({
            command: EditContributions.Commands.COPY_FOR_FORUM.id,
            keybinding: 'CtrlCmd+Shift+C'
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
        export const COPY_FOR_MARKDOWN: Command = {
            id: 'arduino-copy-for-markdown'
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
    }
}
