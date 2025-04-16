import { nls } from '@theia/core/lib/common';
import { inject, injectable } from '@theia/core/shared/inversify';
import { CommonCommands } from '@theia/core/lib/browser/common-frontend-contribution';
import { ClipboardService } from '@theia/core/lib/browser/clipboard-service';
import { StandaloneServices } from '@theia/monaco-editor-core/esm/vs/editor/standalone/browser/standaloneServices';
import { ICodeEditorService } from '@theia/monaco-editor-core/esm/vs/editor/browser/services/codeEditorService';
import type { ICodeEditor } from '@theia/monaco-editor-core/esm/vs/editor/browser/editorBrowser';
import type { StandaloneCodeEditor } from '@theia/monaco-editor-core/esm/vs/editor/standalone/browser/standaloneCodeEditor';
import {
  Contribution,
  Command,
  MenuModelRegistry,
  KeybindingRegistry,
  CommandRegistry,
} from './contribution';
import { ArduinoMenus } from '../menu/arduino-menus';

// TODO: [macOS]: to remove `Start Dictation...` and `Emoji & Symbol` see this thread: https://github.com/electron/electron/issues/8283#issuecomment-269522072
// Depends on https://github.com/eclipse-theia/theia/pull/7964
@injectable()
export class EditContributions extends Contribution {
  @inject(ClipboardService)
  private readonly clipboardService: ClipboardService;

  override registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(EditContributions.Commands.GO_TO_LINE, {
      execute: () => this.run('editor.action.gotoLine'),
    });
    registry.registerCommand(EditContributions.Commands.TOGGLE_COMMENT, {
      execute: () => this.run('editor.action.commentLine'),
    });
    registry.registerCommand(EditContributions.Commands.INDENT_LINES, {
      execute: () => this.run('editor.action.indentLines'),
    });
    registry.registerCommand(EditContributions.Commands.OUTDENT_LINES, {
      execute: () => this.run('editor.action.outdentLines'),
    });
    registry.registerCommand(EditContributions.Commands.FIND, {
      execute: () => this.run('actions.find'),
    });
    registry.registerCommand(EditContributions.Commands.FIND_NEXT, {
      execute: () => this.run('editor.action.nextMatchFindAction'),
    });
    registry.registerCommand(EditContributions.Commands.FIND_PREVIOUS, {
      execute: () => this.run('editor.action.previousMatchFindAction'),
    });
    registry.registerCommand(EditContributions.Commands.USE_FOR_FIND, {
      execute: () => this.run('editor.action.previousSelectionMatchFindAction'),
    });
    /* Tools */ registry.registerCommand(
      EditContributions.Commands.AUTO_FORMAT,
      { execute: () => this.run('editor.action.formatDocument') }
    );
    registry.registerCommand(EditContributions.Commands.COPY_FOR_FORUM, {
      execute: async () => {
        const value = await this.currentValue();
        if (value !== undefined) {
          this.clipboardService.writeText(`
\`\`\`cpp
${value}
\`\`\`
`);
        }
      },
    });
  }

  override registerMenus(registry: MenuModelRegistry): void {
    registry.registerMenuAction(ArduinoMenus.EDIT__TEXT_CONTROL_GROUP, {
      commandId: CommonCommands.CUT.id,
      order: '0',
    });
    registry.registerMenuAction(ArduinoMenus.EDIT__TEXT_CONTROL_GROUP, {
      commandId: CommonCommands.COPY.id,
      order: '1',
    });
    registry.registerMenuAction(ArduinoMenus.EDIT__TEXT_CONTROL_GROUP, {
      commandId: EditContributions.Commands.COPY_FOR_FORUM.id,
      label: nls.localize(
        'arduino/editor/copyForForum',
        'Copy for Forum (Markdown)'
      ),
      order: '2',
    });
    registry.registerMenuAction(ArduinoMenus.EDIT__TEXT_CONTROL_GROUP, {
      commandId: CommonCommands.PASTE.id,
      order: '3',
    });
    registry.registerMenuAction(ArduinoMenus.EDIT__TEXT_CONTROL_GROUP, {
      commandId: CommonCommands.SELECT_ALL.id,
      order: '4',
    });
    registry.registerMenuAction(ArduinoMenus.EDIT__TEXT_CONTROL_GROUP, {
      commandId: EditContributions.Commands.GO_TO_LINE.id,
      label: nls.localize(
        'vscode/standaloneStrings/gotoLineActionLabel',
        'Go to Line...'
      ),
      order: '5',
    });

    registry.registerMenuAction(ArduinoMenus.EDIT__CODE_CONTROL_GROUP, {
      commandId: EditContributions.Commands.TOGGLE_COMMENT.id,
      label: nls.localize(
        'arduino/editor/commentUncomment',
        'Comment/Uncomment'
      ),
      order: '0',
    });
    registry.registerMenuAction(ArduinoMenus.EDIT__CODE_CONTROL_GROUP, {
      commandId: EditContributions.Commands.INDENT_LINES.id,
      label: nls.localize('arduino/editor/increaseIndent', 'Increase Indent'),
      order: '1',
    });
    registry.registerMenuAction(ArduinoMenus.EDIT__CODE_CONTROL_GROUP, {
      commandId: EditContributions.Commands.OUTDENT_LINES.id,
      label: nls.localize('arduino/editor/decreaseIndent', 'Decrease Indent'),
      order: '2',
    });
    registry.registerMenuAction(ArduinoMenus.EDIT__CODE_CONTROL_GROUP, {
      commandId: EditContributions.Commands.AUTO_FORMAT.id,
      label: nls.localize('arduino/editor/autoFormat', 'Auto Format'),
      order: '3',
    });

    registry.registerMenuAction(ArduinoMenus.EDIT__FIND_GROUP, {
      commandId: EditContributions.Commands.FIND.id,
      label: nls.localize('vscode/findController/startFindAction', 'Find'),
      order: '0',
    });
    registry.registerMenuAction(ArduinoMenus.EDIT__FIND_GROUP, {
      commandId: EditContributions.Commands.FIND_NEXT.id,
      label: nls.localize(
        'vscode/findController/findNextMatchAction',
        'Find Next'
      ),
      order: '1',
    });
    registry.registerMenuAction(ArduinoMenus.EDIT__FIND_GROUP, {
      commandId: EditContributions.Commands.FIND_PREVIOUS.id,
      label: nls.localize(
        'vscode/findController/findPreviousMatchAction',
        'Find Previous'
      ),
      order: '2',
    });
    registry.registerMenuAction(ArduinoMenus.EDIT__FIND_GROUP, {
      commandId: EditContributions.Commands.USE_FOR_FIND.id,
      label: nls.localize(
        'vscode/findController/startFindWithSelectionAction',
        'Use Selection for Find'
      ), // XXX: The Java IDE uses `Use Selection For Find`.
      order: '3',
    });

    // `Tools`
    registry.registerMenuAction(ArduinoMenus.TOOLS__MAIN_GROUP, {
      commandId: EditContributions.Commands.AUTO_FORMAT.id,
      label: nls.localize('arduino/editor/autoFormat', 'Auto Format'), // XXX: The Java IDE uses `Use Selection For Find`.
      order: '0',
    });
  }

  override registerKeybindings(registry: KeybindingRegistry): void {
    registry.registerKeybinding({
      command: EditContributions.Commands.COPY_FOR_FORUM.id,
      keybinding: 'CtrlCmd+Shift+C',
      when: 'editorFocus',
    });
    registry.registerKeybinding({
      command: EditContributions.Commands.GO_TO_LINE.id,
      keybinding: 'CtrlCmd+L',
      when: 'editorFocus',
    });

    registry.registerKeybinding({
      command: EditContributions.Commands.TOGGLE_COMMENT.id,
      keybinding: 'CtrlCmd+/',
      when: 'editorFocus',
    });

    registry.registerKeybinding({
      command: EditContributions.Commands.FIND.id,
      keybinding: 'CtrlCmd+F',
    });
    registry.registerKeybinding({
      command: EditContributions.Commands.FIND_NEXT.id,
      keybinding: 'CtrlCmd+G',
    });
    registry.registerKeybinding({
      command: EditContributions.Commands.FIND_PREVIOUS.id,
      keybinding: 'CtrlCmd+Shift+G',
    });
    registry.registerKeybinding({
      command: EditContributions.Commands.USE_FOR_FIND.id,
      keybinding: 'CtrlCmd+E',
    });

    // `Tools`
    registry.registerKeybinding({
      command: EditContributions.Commands.AUTO_FORMAT.id,
      keybinding: 'CtrlCmd+T',
    });
  }

  protected async current(): Promise<
    ICodeEditor | StandaloneCodeEditor | undefined
  > {
    const codeEditorService = StandaloneServices.get(ICodeEditorService);
    return (
      codeEditorService.getFocusedCodeEditor() ||
      codeEditorService.getActiveCodeEditor() ||
      undefined
    );
  }

  protected async currentValue(): Promise<string | undefined> {
    const currentEditor = await this.current();
    if (currentEditor) {
      const selection = currentEditor.getSelection();
      if (!selection || selection.isEmpty()) {
        return currentEditor.getValue();
      }
      return currentEditor.getModel()?.getValueInRange(selection);
    }
    return undefined;
  }

  protected async run(commandId: string): Promise<any> {
    const editor = await this.current();
    if (editor) {
      const action = editor.getAction(commandId);
      if (action) {
        return action.run();
      }
    }
  }
}

export namespace EditContributions {
  export namespace Commands {
    export const COPY_FOR_FORUM: Command = {
      id: 'arduino-copy-for-forum',
    };
    export const GO_TO_LINE: Command = {
      id: 'arduino-go-to-line',
    };
    export const TOGGLE_COMMENT: Command = {
      id: 'arduino-toggle-comment',
    };
    export const INDENT_LINES: Command = {
      id: 'arduino-indent-lines',
    };
    export const OUTDENT_LINES: Command = {
      id: 'arduino-outdent-lines',
    };
    export const FIND: Command = {
      id: 'arduino-find',
    };
    export const FIND_NEXT: Command = {
      id: 'arduino-find-next',
    };
    export const FIND_PREVIOUS: Command = {
      id: 'arduino-find-previous',
    };
    export const USE_FOR_FIND: Command = {
      id: 'arduino-for-find',
    };
    export const AUTO_FORMAT: Command = {
      id: 'arduino-auto-format', // `Auto Format` should belong to `Tool`.
    };
  }
}
