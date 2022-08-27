import { injectable } from '@theia/core/shared/inversify';
import { PreferencesEditorWidget as TheiaPreferencesEditorWidget } from '@theia/preferences/lib/browser/views/preference-editor-widget';

@injectable()
export class PreferencesEditorWidget extends TheiaPreferencesEditorWidget {
  protected override resetScroll(
    nodeIDToScrollTo?: string,
    filterWasCleared = false
  ): void {
    if (this.scrollBar) {
      // Absent on widget creation
      this.doResetScroll(nodeIDToScrollTo, filterWasCleared);
    } else {
      // NOOP
      // Unlike Theia, IDE2 does not start multiple tasks to check if the scrollbar is ready to reset it.
      // If the "scroll reset" request arrived before the existence of the scrollbar, what to reset?
    }
  }
}
