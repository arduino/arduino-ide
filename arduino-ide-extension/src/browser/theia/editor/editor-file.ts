import { MenuModelRegistry } from '@theia/core';
import { CommonCommands } from '@theia/core/lib/browser';
import { injectable } from '@theia/core/shared/inversify';
import { EditorMenuContribution as TheiaEditorMenuContribution } from '@theia/editor/lib/browser/editor-menu';

@injectable()
export class EditorMenuContribution extends TheiaEditorMenuContribution {
  override registerMenus(registry: MenuModelRegistry): void {
    super.registerMenus(registry);
    registry.unregisterMenuAction(CommonCommands.CLOSE_MAIN_TAB.id);
  }
}
