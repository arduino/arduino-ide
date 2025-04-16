import {
  ApplicationShell as TheiaApplicationShell,
  DockPanel,
  DockPanelRenderer as TheiaDockPanelRenderer,
  Panel,
  SaveOptions,
  SHELL_TABBAR_CONTEXT_MENU,
  TabBar,
  Widget,
} from '@theia/core/lib/browser';
import { nls } from '@theia/core/lib/common/nls';
import { MessageService } from '@theia/core/lib/common/message-service';
import { inject, injectable } from '@theia/core/shared/inversify';
import { ApplicationConnectionStatusContribution } from './connection-status-service';
import { ToolbarAwareTabBar } from './tab-bars';
import { find } from '@theia/core/shared/@phosphor/algorithm';
import { OutputWidget } from '@theia/output/lib/browser/output-widget';

@injectable()
export class ApplicationShell extends TheiaApplicationShell {
  @inject(MessageService)
  private readonly messageService: MessageService;

  @inject(ApplicationConnectionStatusContribution)
  private readonly connectionStatusService: ApplicationConnectionStatusContribution;

  override async addWidget(
    widget: Widget,
    options: Readonly<TheiaApplicationShell.WidgetOptions> = {}
  ): Promise<void> {
    // By default, Theia open a widget **next** to the currently active in the target area.
    // Instead of this logic, we want to open the new widget after the last of the target area.
    if (!widget.id) {
      console.error(
        'Widgets added to the application shell must have a unique id property.'
      );
      return;
    }
    let ref: Widget | undefined = options.ref;
    const area: TheiaApplicationShell.Area = options.area || 'main';
    if (!ref && (area === 'main' || area === 'bottom')) {
      const tabBar = this.getTabBarFor(area);
      if (tabBar) {
        const last = tabBar.titles[tabBar.titles.length - 1];
        if (last) {
          ref = last.owner;
        }
      }
    }
    return super.addWidget(widget, { ...options, ref });
  }

  override doRevealWidget(id: string): Widget | undefined {
    let widget = find(this.mainPanel.widgets(), (w) => w.id === id);
    if (!widget) {
      widget = find(this.bottomPanel.widgets(), (w) => w.id === id);
      if (widget) {
        this.expandBottomPanel();
      }
    }
    if (widget) {
      const tabBar = this.getTabBarFor(widget);
      if (tabBar) {
        tabBar.currentTitle = widget.title;
      }
    }
    if (!widget) {
      widget = this.leftPanelHandler.expand(id);
    }
    if (!widget) {
      widget = this.rightPanelHandler.expand(id);
    }
    if (widget) {
      // Prevent focusing the output widget when is updated
      // See https://github.com/arduino/arduino-ide/issues/2679
      if (!(widget instanceof OutputWidget)) {
        this.windowService.focus();
      }
      return widget;
    } else {
      return this.secondaryWindowHandler.revealWidget(id);
    }
  }

  override handleEvent(): boolean {
    // NOOP, dragging has been disabled
    return false;
  }

  // Avoid hiding top panel as we use it for arduino toolbar
  protected override createTopPanel(): Panel {
    const topPanel = super.createTopPanel();
    topPanel.show();
    return topPanel;
  }

  override async saveAll(options?: SaveOptions): Promise<void> {
    // When there is no connection between the IDE2 frontend and backend.
    if (this.connectionStatusService.offlineStatus === 'backend') {
      this.messageService.error(
        nls.localize(
          'theia/core/couldNotSave',
          'Could not save the sketch. Please copy your unsaved work into your favorite text editor, and restart the IDE.'
        )
      );
      return; // Theia does not reject on failed save: https://github.com/eclipse-theia/theia/pull/8803
    }
    return super.saveAll(options);
  }
}

export class DockPanelRenderer extends TheiaDockPanelRenderer {
  override createTabBar(): TabBar<Widget> {
    const renderer = this.tabBarRendererFactory();
    // `ToolbarAwareTabBar` is from IDE2 and not from Theia. Check the imports.
    const tabBar = new ToolbarAwareTabBar(
      this.tabBarToolbarRegistry,
      this.tabBarToolbarFactory,
      this.breadcrumbsRendererFactory,
      {
        renderer,
        // Scroll bar options
        handlers: ['drag-thumb', 'keyboard', 'wheel', 'touch'],
        useBothWheelAxes: true,
        scrollXMarginOffset: 4,
        suppressScrollY: true,
      }
    );
    this.tabBarClasses.forEach((c) => tabBar.addClass(c));
    renderer.tabBar = tabBar;
    tabBar.disposed.connect(() => renderer.dispose());
    renderer.contextMenuPath = SHELL_TABBAR_CONTEXT_MENU;
    tabBar.currentChanged.connect(this.onCurrentTabChanged, this);
    return tabBar;
  }
}

const originalHandleEvent = DockPanel.prototype.handleEvent;

DockPanel.prototype.handleEvent = function (event) {
  switch (event.type) {
    case 'p-dragenter':
    case 'p-dragleave':
    case 'p-dragover':
    case 'p-drop':
      return;
  }
  originalHandleEvent.bind(this)(event);
};
