import { injectable } from '@theia/core/shared/inversify';
import { TextEditor } from '@theia/editor/lib/browser';
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
}
