import { MenuAction } from '@theia/core/lib/common/menu';
import type { MenuModelRegistry } from '@theia/core/lib/common/menu/menu-model-registry';
import { nls } from '@theia/core/lib/common/nls';
import { injectable } from '@theia/core/shared/inversify';
import { EDITOR_CONTEXT_MENU } from '@theia/editor/lib/browser';
import {
  IMenuItem,
  isIMenuItem,
  MenuId,
  MenuRegistry,
} from '@theia/monaco-editor-core/esm/vs/platform/actions/common/actions';
import {
  MonacoMenus,
  MonacoEditorMenuContribution as TheiaMonacoEditorMenuContribution,
} from '@theia/monaco/lib/browser/monaco-menu';

@injectable()
export class MonacoEditorMenuContribution extends TheiaMonacoEditorMenuContribution {
  override registerMenus(registry: MenuModelRegistry): void {
    for (const item of MenuRegistry.getMenuItems(MenuId.EditorContext)) {
      if (!isIMenuItem(item)) {
        continue;
      }
      const commandId = this.commands.validate(item.command.id);
      if (commandId) {
        const menuPath = [...EDITOR_CONTEXT_MENU, item.group || ''];
        registry.registerMenuAction(
          menuPath,
          this.buildMenuAction(commandId, item)
        );
      }
    }

    this.registerPeekSubmenu(registry);

    registry.registerSubmenu(
      MonacoMenus.SELECTION,
      nls.localizeByDefault('Selection')
    );
    for (const item of MenuRegistry.getMenuItems(MenuId.MenubarSelectionMenu)) {
      if (!isIMenuItem(item)) {
        continue;
      }
      const commandId = this.commands.validate(item.command.id);
      if (commandId) {
        const menuPath = [...MonacoMenus.SELECTION, item.group || ''];
        registry.registerMenuAction(
          menuPath,
          this.buildMenuAction(commandId, item)
        );
      }
    }

    // https://github.com/arduino/arduino-ide/issues/1394
    registry.unregisterMenuAction('editor.action.refactor'); // Refactor...
    registry.unregisterMenuAction('editor.action.sourceAction'); // Source Action...
    // https://github.com/arduino/arduino-ide/pull/2027#pullrequestreview-1414246614
    // Root editor context menu
    registry.unregisterMenuAction('editor.action.revealDeclaration'); // Go to Declaration
    registry.unregisterMenuAction('editor.action.goToTypeDefinition'); // Go to Type Definition
    registry.unregisterMenuAction('editor.action.goToImplementation'); // Go to Implementations
    registry.unregisterMenuAction('editor.action.goToReferences'); // Go to References
    // Peek submenu
    registry.unregisterMenuAction('editor.action.peekDeclaration'); // Peek Declaration
    registry.unregisterMenuAction('editor.action.peekTypeDefinition'); // Peek Type Definition
    registry.unregisterMenuAction('editor.action.peekImplementation'); // Peek Implementation
    registry.unregisterMenuAction('editor.action.referenceSearch.trigger'); // Peek References
  }

  protected override registerPeekSubmenu(registry: MenuModelRegistry): void {
    registry.registerSubmenu(MonacoMenus.PEEK_CONTEXT_SUBMENU, '查看');

    for (const item of MenuRegistry.getMenuItems(MenuId.EditorContextPeek)) {
      if (!isIMenuItem(item)) {
        continue;
      }
      const commandId = this.commands.validate(item.command.id);
      if (commandId) {
        registry.registerMenuAction(
          [...MonacoMenus.PEEK_CONTEXT_SUBMENU, item.group || ''],
          this.buildMenuAction(commandId, item)
        );
      }
    }
  }

  protected override buildMenuAction(
    commandId: string,
    item: IMenuItem
  ): MenuAction {
    const title =
      typeof item.command.title === 'string'
        ? item.command.title
        : item.command.title.value;
    const label = this.removeMnemonic(title);
    const order = item.order ? String(item.order) : '';
    return { commandId, order, label };
  }

  protected override removeMnemonic(label: string): string {
    label = label.replace(/\(&&\w\)|&&/g, '');
    label = label.replace('Refactor...', '重构...');
    label = label.replace('Source Action...', '源操作...');
    label = label.replace('Go to Definition', '转到定义');
    label = label.replace('Go to Declaration', '转到声明');
    label = label.replace('Go to Type Definition', '转到类型定义');
    label = label.replace('Go to Implementations', '转到实现');
    label = label.replace('Go to References', '转到参考资料');
    label = label.replace('Format Document', '格式文件');
    label = label.replace('Format Selection', '格式选择');
    label = label.replace('Change All Occurrences', '更改所有事件');
    label = label.replace('Rename Symbol', '重命名符号');
    label = label.replace('Go to Symbol...', '转到编辑器的符号...');
    label = label.replace('Peek Definition', '查看定义');
    label = label.replace('Peek Declaration', '查看声明');
    label = label.replace('Peek Type Definition', '查看类型定义');
    label = label.replace('Peek Implementations', '查看实现');
    label = label.replace('Peek References', '查看参考资料');
    label = label.replace('Select All', '全选');
    label = label.replace('Copy Line Up', '复制一行');
    label = label.replace('Copy Line Down', '向下复制');
    label = label.replace('Duplicate Selection', '重复选择');
    label = label.replace('Move Line Up', '上移一行');
    label = label.replace('Move Line Down', '下移一行');
    label = label.replace('Add Cursor Above', '在上面添加光标');
    label = label.replace('Add Cursor Below', '在下面添加光标');
    label = label.replace('Add Cursors to Line Ends', '在行尾添加游标');
    label = label.replace('Add Next Occurrence', '添加下一个事件');
    label = label.replace('Add Previous Occurrence', '添加上一个事件');
    label = label.replace('Select All Occurrences', '选择所有事件');
    label = label.replace('Expand Selection', '展开选择');
    label = label.replace('Shrink Selection', '折叠选择');
    return label;
  }
}
