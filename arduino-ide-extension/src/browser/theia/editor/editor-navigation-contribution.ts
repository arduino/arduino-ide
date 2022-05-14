import { injectable } from '@theia/core/shared/inversify';
import { EditorNavigationContribution as TheiaEditorNavigationContribution } from '@theia/editor/lib/browser/editor-navigation-contribution';

@injectable()
export class EditorNavigationContribution extends TheiaEditorNavigationContribution {
  async onStart(): Promise<void> {
    super.onStart(); // No await
  }
}
