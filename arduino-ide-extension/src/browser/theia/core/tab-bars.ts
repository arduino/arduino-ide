import type { TabBar } from '@theia/core/shared/@phosphor/widgets';
import { Saveable } from '@theia/core/lib/browser/saveable';
import {
  TabBarRenderer as TheiaTabBarRenderer,
  ToolbarAwareTabBar as TheiaToolbarAwareTabBar,
} from '@theia/core/lib/browser/shell/tab-bars';
import debounce from 'lodash.debounce';

export class TabBarRenderer extends TheiaTabBarRenderer {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override createTabClass(data: TabBar.IRenderData<any>): string {
    let className = super.createTabClass(data);
    if (!data.title.closable && Saveable.isDirty(data.title.owner)) {
      className += ' p-mod-closable';
    }
    return className;
  }

  protected override handleContextMenuEvent = (): void => {
    // NOOP
    // Context menus are empty, so they have been removed
  };
}

export class ToolbarAwareTabBar extends TheiaToolbarAwareTabBar {
  protected override async updateBreadcrumbs(): Promise<void> {
    // NOOP
    // IDE2 does not use breadcrumbs.
  }

  private readonly doUpdateToolbar = debounce(() => super.updateToolbar(), 500);
  protected override updateToolbar(): void {
    // Unlike Theia, IDE2 debounces the toolbar updates with 500ms
    this.doUpdateToolbar();
  }
}
