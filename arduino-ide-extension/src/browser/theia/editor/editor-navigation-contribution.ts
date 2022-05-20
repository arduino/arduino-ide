import { injectable } from '@theia/core/shared/inversify';
import { EditorNavigationContribution as TheiaEditorNavigationContribution } from '@theia/editor/lib/browser/editor-navigation-contribution';

@injectable()
export class EditorNavigationContribution extends TheiaEditorNavigationContribution {
  override async onStart(): Promise<void> {
    // No await.
    // Restore the navigation history asynchronously.
    super.onStart();
  }
}
