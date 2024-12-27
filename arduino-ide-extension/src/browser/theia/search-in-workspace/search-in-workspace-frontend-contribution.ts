import { inject, injectable } from '@theia/core/shared/inversify';
import { MenuModelRegistry } from '@theia/core/lib/common/menu';
import { KeybindingRegistry } from '@theia/core/lib/browser/keybinding';
import {
  SearchInWorkspaceFrontendContribution as TheiaSearchInWorkspaceFrontendContribution,
  SearchInWorkspaceCommands,
} from '@theia/search-in-workspace/lib/browser/search-in-workspace-frontend-contribution';
import { CommandRegistry } from '@theia/core';
import { ApplicationShell } from '../core/application-shell';
import {
  CommonCommands,
  CommonMenus,
} from '@theia/core/lib/browser/common-frontend-contribution';
import { SearchInWorkspaceResultTreeWidget } from '@theia/search-in-workspace/lib/browser/search-in-workspace-result-tree-widget';
import { NavigatorContextMenu } from '@theia/navigator/lib/browser/navigator-contribution';
import { TabBarToolbarRegistry } from '../../contributions/contribution';

@injectable()
export class SearchInWorkspaceFrontendContribution extends TheiaSearchInWorkspaceFrontendContribution {
  @inject(ApplicationShell)
  protected readonly shelloverride: ApplicationShell;

  constructor() {
    super();
    this.options.defaultWidgetOptions.rank = 6;
  }

  override registerMenus(menus: MenuModelRegistry): void {
    super.registerMenus(menus);
    menus.unregisterMenuAction(SearchInWorkspaceCommands.OPEN_SIW_WIDGET);
    menus.unregisterMenuAction(SearchInWorkspaceCommands.REPLACE_IN_FILES);
    menus.unregisterMenuAction(SearchInWorkspaceCommands.FIND_IN_FOLDER);
    menus.unregisterMenuAction(SearchInWorkspaceCommands.COPY_ALL);
    menus.unregisterMenuAction(SearchInWorkspaceCommands.COPY_ONE);
    menus.unregisterMenuAction(SearchInWorkspaceCommands.DISMISS_RESULT);
    menus.unregisterMenuAction(SearchInWorkspaceCommands.REPLACE_RESULT);
    menus.unregisterMenuAction(SearchInWorkspaceCommands.REPLACE_ALL_RESULTS);
    menus.unregisterMenuAction(CommonCommands.COPY_PATH);
    menus.registerMenuAction(CommonMenus.EDIT_FIND, {
      commandId: SearchInWorkspaceCommands.REPLACE_IN_FILES.id,
      label: '在文件中替换',
      order: '3',
    });
    menus.registerMenuAction(SearchInWorkspaceResultTreeWidget.Menus.COPY, {
      commandId: SearchInWorkspaceCommands.COPY_ALL.id,
      label: '复制所有',
      order: '3',
    });
    menus.registerMenuAction(SearchInWorkspaceResultTreeWidget.Menus.COPY, {
      commandId: SearchInWorkspaceCommands.COPY_ONE.id,
      label: '复制',
      order: '1',
    });
    menus.registerMenuAction(SearchInWorkspaceResultTreeWidget.Menus.INTERNAL, {
      commandId: SearchInWorkspaceCommands.DISMISS_RESULT.id,
      label: '清除',
      order: '1',
    });
    menus.registerMenuAction(SearchInWorkspaceResultTreeWidget.Menus.INTERNAL, {
      commandId: SearchInWorkspaceCommands.REPLACE_RESULT.id,
      label: '替换 ',
      order: '1',
      when: 'replaceActive',
    });
    menus.registerMenuAction(SearchInWorkspaceResultTreeWidget.Menus.INTERNAL, {
      commandId: SearchInWorkspaceCommands.REPLACE_ALL_RESULTS.id,
      label: '全部替换',
      order: '1',
      when: 'replaceActive',
    });
    menus.registerMenuAction(SearchInWorkspaceResultTreeWidget.Menus.COPY, {
      commandId: CommonCommands.COPY_PATH.id,
      label: '复制路径',
      order: '2',
    });
    menus.registerMenuAction(NavigatorContextMenu.SEARCH, {
      commandId: SearchInWorkspaceCommands.FIND_IN_FOLDER.id,
      label: '在文件夹中找到…',
      when: 'explorerResourceIsFolder',
    });
  }

  override registerKeybindings(keybindings: KeybindingRegistry): void {
    super.registerKeybindings(keybindings);
    keybindings.unregisterKeybinding(SearchInWorkspaceCommands.OPEN_SIW_WIDGET);
  }

  override registerCommands(commands: CommandRegistry): Promise<void> {
    commands.registerCommand(
      { id: 'lingzhi-search-in-workspace' },
      {
        execute: async () => {
          super.openView({ activate: false, reveal: true });
          this.shell.rightPanelHandler.container.hide();
          this.shell.leftPanelHandler.container.hide();
          this.shell.leftPanelHandler.container.show();
          this.shell.leftPanelHandler.resize(160);
          this.shelloverride.mainContainer.show();
          this.shelloverride.rightPanelCustom.show();
        },
      }
    );
    return super.registerCommands(commands);
  }

  override async registerToolbarItems(
    toolbarRegistry: TabBarToolbarRegistry
  ): Promise<void> {
    const widget = await this.widget;
    const onDidChange = widget.onDidUpdate;
    toolbarRegistry.registerItem({
      id: SearchInWorkspaceCommands.CANCEL_SEARCH.id,
      command: SearchInWorkspaceCommands.CANCEL_SEARCH.id,
      tooltip: '取消当前搜索',
      priority: 0,
      onDidChange,
    });
    toolbarRegistry.registerItem({
      id: SearchInWorkspaceCommands.REFRESH_RESULTS.id,
      command: SearchInWorkspaceCommands.REFRESH_RESULTS.id,
      tooltip: '刷新',
      priority: 1,
      onDidChange,
    });
    toolbarRegistry.registerItem({
      id: SearchInWorkspaceCommands.CLEAR_ALL.id,
      command: SearchInWorkspaceCommands.CLEAR_ALL.id,
      tooltip: '清除搜索结果',
      priority: 2,
      onDidChange,
    });
    toolbarRegistry.registerItem({
      id: SearchInWorkspaceCommands.COLLAPSE_ALL.id,
      command: SearchInWorkspaceCommands.COLLAPSE_ALL.id,
      tooltip: '全部折叠',
      priority: 3,
      onDidChange,
    });
    toolbarRegistry.registerItem({
      id: SearchInWorkspaceCommands.EXPAND_ALL.id,
      command: SearchInWorkspaceCommands.EXPAND_ALL.id,
      tooltip: '展开全部',
      priority: 3,
      onDidChange,
    });
  }
}
