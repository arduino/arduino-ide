import { EditorContribution } from '@theia/editor/lib/browser/editor-contribution';
import { TextEditor } from '@theia/editor/lib/browser';
import { StatusBarAlignment } from '@theia/core/lib/browser';

export class ArduinoEditorContribution extends EditorContribution {

    protected updateLanguageStatus(editor: TextEditor | undefined): void {
    }

    protected setCursorPositionStatus(editor: TextEditor | undefined): void {
        if (!editor) {
            this.statusBar.removeElement('editor-status-cursor-position');
            return;
        }
        const { cursor } = editor;
        this.statusBar.setElement('editor-status-cursor-position', {
            text: `${cursor.line + 1}`,
            alignment: StatusBarAlignment.LEFT,
            priority: 100
        });
    }

}
