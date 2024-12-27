import { injectable } from '@theia/core/shared/inversify';
import {
  ReactTabBarToolbarItem,
  TabBarToolbarItem,
  TabBarToolbarRegistry,
} from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { OutputToolbarContribution as TheiaOutputToolbarContribution } from '@theia/output/lib/browser/output-toolbar-contribution';
import { OutputCommands } from '@theia/output/lib/browser/output-commands';

@injectable()
export class OutputToolbarContribution extends TheiaOutputToolbarContribution {
  override async registerToolbarItems(
    registry: TabBarToolbarRegistry
  ): Promise<void> {
    await super.registerToolbarItems(registry); // Why is it async?
    // It's a hack. Currently, it's not possible to unregister a toolbar contribution via API.
    (
      (registry as any).items as Map<
        string,
        TabBarToolbarItem | ReactTabBarToolbarItem
      >
    ).delete('channels');
    (registry as any).fireOnDidChange();

    registry.unregisterItem(OutputCommands.CLEAR__WIDGET.id);
    registry.unregisterItem(OutputCommands.LOCK__WIDGET.id);
    registry.unregisterItem(OutputCommands.UNLOCK__WIDGET.id);
    registry.registerItem({
      id: OutputCommands.CLEAR__WIDGET.id,
      command: OutputCommands.CLEAR__WIDGET.id,
      tooltip: '清除输出',
      priority: 1,
    });
    registry.registerItem({
      id: OutputCommands.LOCK__WIDGET.id,
      command: OutputCommands.LOCK__WIDGET.id,
      tooltip: '关闭自动滚动',
      onDidChange: this.onOutputWidgetStateChanged,
      priority: 2,
    });
    registry.registerItem({
      id: OutputCommands.UNLOCK__WIDGET.id,
      command: OutputCommands.UNLOCK__WIDGET.id,
      tooltip: '打开自动滚动',
      onDidChange: this.onOutputWidgetStateChanged,
      priority: 2,
    });
  }
}
