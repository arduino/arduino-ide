import { injectable } from '@theia/core/shared/inversify';
import { EditorPreviewContribution as TheiaEditorPreviewContribution } from '@theia/editor-preview/lib/browser/editor-preview-contribution';
import { TextEditor } from '@theia/editor/lib/browser';

@injectable()
export class EditorPreviewContribution extends TheiaEditorPreviewContribution {
  protected updateLanguageStatus(editor: TextEditor | undefined): void {}

  // protected setCursorPositionStatus(editor: TextEditor | undefined): void {
  //   if (!editor) {
  //     this.statusBar.removeElement('editor-status-cursor-position');
  //     return;
  //   }
  //   const { cursor } = editor;
  //   this.statusBar.setElement('editor-status-cursor-position', {
  //     text: `${cursor.line + 1}`,
  //     alignment: StatusBarAlignment.LEFT,
  //     priority: 100,
  //   });
  // }
}
