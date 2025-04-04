import { injectable } from '@theia/core/shared/inversify';
import { EditorContribution as TheiaEditorContribution } from '@theia/editor/lib/browser/editor-contribution';

@injectable()
export class EditorContribution extends TheiaEditorContribution {
  protected override updateLanguageStatus(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ..._: Parameters<TheiaEditorContribution['updateLanguageStatus']>
  ): void {
    // NOOP
  }

  protected override updateEncodingStatus(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ..._: Parameters<TheiaEditorContribution['updateEncodingStatus']>
  ): void {
    // https://github.com/arduino/arduino-ide/issues/1393
    // NOOP
  }
}
