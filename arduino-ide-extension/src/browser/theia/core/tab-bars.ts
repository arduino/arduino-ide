import type { TabBar } from '@theia/core/shared/@phosphor/widgets';
import { Saveable } from '@theia/core/lib/browser/saveable';
import {
  SideBarRenderData,
  TabBarRenderer as TheiaTabBarRenderer,
  ToolbarAwareTabBar as TheiaToolbarAwareTabBar,
} from '@theia/core/lib/browser/shell/tab-bars';
import debounce from 'lodash.debounce';
import { h, VirtualElement } from '@phosphor/virtualdom';
import { PINNED_CLASS } from '@theia/core/lib/browser/widgets/widget';

export class TabBarRenderer extends TheiaTabBarRenderer {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override createTabClass(data: TabBar.IRenderData<any>): string {
    let className = super.createTabClass(data);
    if (!data.title.closable && Saveable.isDirty(data.title.owner)) {
      className += ' p-mod-closable';
    }
    return className;
  }

  override renderTab(
    data: SideBarRenderData,
    isInSidePanel?: boolean,
    isPartOfHiddenTabBar?: boolean
  ): VirtualElement {
    const title = data.title;
    const id = this.createTabId(title, isPartOfHiddenTabBar);
    const key = this.createTabKey(data);
    const style = this.createTabStyle(data);
    const className = this.createTabClass(data);
    const dataset = this.createTabDataset(data);
    const closeIconTitle = data.title.className.includes(PINNED_CLASS)
      ? '拔去别针'
      : '关闭';

    const hover =
      this.tabBar &&
        this.tabBar.orientation === 'horizontal' &&
        this.corePreferences?.['window.tabbar.enhancedPreview'] === 'classic'
        ? { title: title.caption }
        : {
          onmouseenter: this.handleMouseEnterEvent,
        };

    return h.li(
      {
        ...hover,
        key,
        className,
        id,
        style,
        dataset,
        oncontextmenu: this.handleContextMenuEvent,
        ondblclick: this.handleDblClickEvent,
        onauxclick: (e: MouseEvent) => {
          // If user closes the tab using mouse wheel, nothing should be pasted to an active editor
          e.preventDefault();
        },
      },
      h.div(
        { className: 'theia-tab-icon-label' },
        this.renderIcon(data, isInSidePanel),
        this.renderLabel(data, isInSidePanel),
        this.renderBadge(data, isInSidePanel),
        this.renderLock(data, isInSidePanel),
        this.iconName(data)
      ),
      h.div({
        className: 'p-TabBar-tabCloseIcon action-label',
        title: closeIconTitle,
        onclick: this.handleCloseClickEvent,
      })
    );
  }

  private iconName(data: SideBarRenderData): VirtualElement {
    let iconClass = data.title.iconClass;
    switch (iconClass) {
      case 'fa lingzhi-upload-home':
        iconClass = '欢迎';
        break;
      case 'fa lingzhi-coding-left':
        iconClass = '代码';
        break;
      case 'fa lingzhi-debug-left':
        iconClass = '调试';
        break;
      case 'fa lingzhi-Search':
        iconClass = '搜索';
        break;
      case 'fa lingzhi-libmager':
        iconClass = '库';
        break;
      default:
        iconClass = '';
        break;
    }
    return h.div(
      {
        className: 'lingzhi-icon-class',
      },
      iconClass
    );
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
