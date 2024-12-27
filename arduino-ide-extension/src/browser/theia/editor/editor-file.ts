import { MenuModelRegistry } from '@theia/core';
import { CommonCommands } from '@theia/core/lib/browser';
import { injectable } from '@theia/core/shared/inversify';
import {
  EditorContextMenu,
  EditorMenuContribution as TheiaEditorMenuContribution,
} from '@theia/editor/lib/browser/editor-menu';

@injectable()
export class EditorMenuContribution extends TheiaEditorMenuContribution {
  override registerMenus(registry: MenuModelRegistry): void {
    super.registerMenus(registry);
    registry.unregisterMenuAction(CommonCommands.CLOSE_MAIN_TAB.id);
    registry.unregisterMenuAction(CommonCommands.UNDO.id);
    registry.unregisterMenuAction(CommonCommands.REDO.id);
    registry.registerMenuAction(EditorContextMenu.UNDO_REDO, {
      commandId: CommonCommands.UNDO.id,
      label: '撤销',
    });
    registry.registerMenuAction(EditorContextMenu.UNDO_REDO, {
      commandId: CommonCommands.REDO.id,
      label: '恢复',
    });

    registry.registerMenuAction(EditorContextMenu.CUT_COPY_PASTE, {
      commandId: CommonCommands.CUT.id,
      label: '剪切',
      order: '0',
    });
    registry.registerMenuAction(EditorContextMenu.CUT_COPY_PASTE, {
      commandId: CommonCommands.COPY.id,
      label: '复制',
      order: '1',
    });
    registry.registerMenuAction(EditorContextMenu.CUT_COPY_PASTE, {
      commandId: CommonCommands.PASTE.id,
      label: '粘贴',
      order: '2',
    });
  }
}
