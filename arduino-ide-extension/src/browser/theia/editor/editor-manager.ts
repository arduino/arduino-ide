import { injectable } from '@theia/core/shared/inversify';
import { EditorManager as TheiaEditorManager } from '@theia/editor/lib/browser/editor-manager';

@injectable()
export class EditorManager extends TheiaEditorManager {
  protected override getOrCreateCounterForUri(): number {
    return 0;
  }
}
