import { StatusBarAlignment } from '@theia/core/lib/browser';
import { injectable } from '@theia/core/shared/inversify';
import { EditorCommands, TextEditor } from '@theia/editor/lib/browser';
import { EditorContribution as TheiaEditorContribution } from '@theia/editor/lib/browser/editor-contribution';

@injectable()
export class EditorContribution extends TheiaEditorContribution {
  protected override updateLanguageStatus(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
    editor: TextEditor | undefined
  ): void {
    // NOOP
  }

  protected override updateEncodingStatus(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
    editor: TextEditor | undefined
  ): void {
    // https://github.com/arduino/arduino-ide/issues/1393
    // NOOP
  }

  protected override setCursorPositionStatus(
    editor: TextEditor | undefined
  ): void {
    if (!editor) {
      this.statusBar.removeElement('editor-status-cursor-position');
      return;
    }
    const { cursor } = editor;
    this.statusBar.setElement('editor-status-cursor-position', {
      text: `行${cursor.line + 1}, 列${editor.getVisibleColumn(cursor)}`,
      alignment: StatusBarAlignment.RIGHT,
      priority: 100,
      tooltip: '选择行/列',
      command: EditorCommands.GOTO_LINE_COLUMN.id,
    });
  }
}
