import { injectable } from '@theia/core/shared/inversify';
import { EditorWidget } from '@theia/editor/lib/browser';
import {
  EditorManager as TheiaEditorManager,
  WidgetId,
} from '@theia/editor/lib/browser/editor-manager';

@injectable()
export class EditorManager extends TheiaEditorManager {
  protected override getOrCreateCounterForUri(): number {
    return 0;
  }

  protected override extractIdFromWidget(widget: EditorWidget): WidgetId {
    const { id, uri } = super.extractIdFromWidget(widget);
    // https://github.com/eclipse-theia/theia/commit/86a4fc66c112310fb39f50024ea4a2607ed5927e#r79349262
    if (Number.isNaN(id)) {
      return { uri, id: 0 };
    }
    return { id, uri };
  }
}
