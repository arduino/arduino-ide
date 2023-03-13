import {
  Disposable,
  DisposableCollection,
} from '@theia/core/lib/common/disposable';
import { ContextMenuRenderer } from '@theia/core/lib/browser/context-menu-renderer';
import { FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application';
import {
  OpenerOptions,
  OpenHandler,
} from '@theia/core/lib/browser/opener-service';
import {
  TabBarToolbarContribution,
  TabBarToolbarRegistry,
} from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { AbstractViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import { codicon } from '@theia/core/lib/browser/widgets/widget';
import {
  Command,
  CommandContribution,
  CommandRegistry,
} from '@theia/core/lib/common/command';
import { MenuModelRegistry, MenuPath } from '@theia/core/lib/common/menu';
import { URI } from '@theia/core/lib/common/uri';
import { Widget } from '@theia/core/shared/@phosphor/widgets';
import { inject, injectable } from '@theia/core/shared/inversify';
import { Searchable } from '../../../common/protocol';
import { ArduinoComponent } from '../../../common/protocol/arduino-component';
import { showDisabledContextMenuOptions } from '../../menu/arduino-menus';
import {
  MenuActionTemplate,
  menuActionWithCommandDelegate,
  registerMenus,
  SubmenuTemplate,
} from '../../menu/register-menu';
import { ListWidget, ListWidgetSearchOptions } from './list-widget';
import { Event, nls } from '@theia/core';

@injectable()
export abstract class ListWidgetFrontendContribution<
    T extends ArduinoComponent,
    S extends Searchable.Options
  >
  extends AbstractViewContribution<ListWidget<T, S>>
  implements
    FrontendApplicationContribution,
    OpenHandler,
    TabBarToolbarContribution,
    CommandContribution
{
  @inject(ContextMenuRenderer)
  private readonly contextMenuRenderer: ContextMenuRenderer;
  @inject(CommandRegistry)
  private readonly commandRegistry: CommandRegistry;
  @inject(MenuModelRegistry)
  private readonly menuRegistry: MenuModelRegistry;
  protected abstract readonly searchOptions: ListWidgetSearchOptions<S>;

  private readonly toDisposeBeforeShowContextMenu = new DisposableCollection();

  readonly id: string = `http-opener-${this.viewId}`;

  async initializeLayout(): Promise<void> {
    this.openView();
  }

  onStop(): void {
    this.toDisposeBeforeShowContextMenu.dispose();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override registerMenus(_: MenuModelRegistry): void {
    // NOOP
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  canHandle(uri: URI, _?: OpenerOptions): number {
    // `500` is the default HTTP opener in Theia. IDE2 has higher priority.
    // https://github.com/eclipse-theia/theia/blob/b75b6144b0ffea06a549294903c374fa642135e4/packages/core/src/browser/http-open-handler.ts#L39
    return this.canParse(uri) ? 501 : 0;
  }

  async open(
    uri: URI,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _?: OpenerOptions | undefined
  ): Promise<void> {
    const searchOptions = this.parse(uri);
    if (!searchOptions) {
      console.warn(
        `Failed to parse URI into a search options. URI: ${uri.toString()}`
      );
      return;
    }
    const widget = await this.openView({
      activate: true,
      reveal: true,
    });
    if (!widget) {
      console.warn(`Failed to open view for URI: ${uri.toString()}`);
      return;
    }
    widget.refresh(searchOptions);
  }

  protected abstract canParse(uri: URI): boolean;
  protected abstract parse(uri: URI): S | undefined;

  registerToolbarItems(registry: TabBarToolbarRegistry): void {
    const filterCommand = this.showViewFilterContextMenuCommand;
    registry.registerItem({
      id: filterCommand.id,
      command: filterCommand.id,
      icon: () =>
        codicon(
          this.searchOptions.hasFilters() ? 'filter-filled' : 'filter',
          true
        ),
      onDidChange: this.searchOptions
        .onDidChange as Event<unknown> as Event<void>,
    });
  }

  override registerCommands(registry: CommandRegistry): void {
    const filterCommand = this.showViewFilterContextMenuCommand;
    registry.registerCommand(filterCommand, {
      execute: () => this.showFilterContextMenu(filterCommand.id),
      isVisible: (arg: unknown) =>
        arg instanceof Widget && arg.id === this.viewId,
    });
  }

  protected abstract get showViewFilterContextMenuCommand(): Command & {
    label: string;
  };

  protected abstract get showInstalledCommandId(): string;

  protected abstract get showUpdatesCommandId(): string;

  protected abstract buildFilterMenuGroup(
    menuPath: MenuPath
  ): Array<MenuActionTemplate | SubmenuTemplate>;

  private buildQuickFiltersMenuGroup(
    menuPath: MenuPath
  ): Array<MenuActionTemplate | SubmenuTemplate> {
    return [
      menuActionWithCommandDelegate(
        {
          menuPath,
          command: this.showInstalledCommandId,
        },
        this.commandRegistry
      ),
      menuActionWithCommandDelegate(
        { menuPath, command: this.showUpdatesCommandId },
        this.commandRegistry
      ),
    ];
  }

  private buildActionsMenuGroup(
    menuPath: MenuPath
  ): Array<MenuActionTemplate | SubmenuTemplate> {
    if (!this.searchOptions.hasFilters()) {
      return [];
    }
    return [
      {
        menuPath,
        menuLabel: nls.localize('arduino/filter/clearAll', 'Clear All Filters'),
        handler: {
          execute: () => this.searchOptions.clearFilters(),
        },
      },
    ];
  }

  protected buildMenuActions<T>(
    menuPath: MenuPath,
    literals: T[],
    isSelected: (literal: T) => boolean,
    select: (literal: T) => void,
    menuLabelProvider: (literal: T) => string
  ): MenuActionTemplate[] {
    return literals
      .map((literal) => ({ literal, label: menuLabelProvider(literal) }))
      .map(({ literal, label }) => ({
        menuPath,
        menuLabel: label,
        handler: {
          execute: () => select(literal),
          isToggled: () => isSelected(literal),
        },
      }));
  }

  private showFilterContextMenu(commandId: string): void {
    this.toDisposeBeforeShowContextMenu.dispose();
    const element = document.getElementById(commandId);
    if (!element) {
      return;
    }
    const client = element.getBoundingClientRect();
    const menuPath = [`${this.viewId}-filter-context-menu`];
    this.toDisposeBeforeShowContextMenu.pushAll([
      this.registerMenuGroup(
        this.buildFilterMenuGroup([...menuPath, '0_filter'])
      ),
      this.registerMenuGroup(
        this.buildQuickFiltersMenuGroup([...menuPath, '1_quick_filters'])
      ),
      this.registerMenuGroup(
        this.buildActionsMenuGroup([...menuPath, '2_actions'])
      ),
    ]);
    const options = showDisabledContextMenuOptions({
      menuPath,
      anchor: { x: client.left, y: client.bottom + client.height / 2 },
    });
    this.contextMenuRenderer.render(options);
  }

  private registerMenuGroup(
    templates: Array<MenuActionTemplate | SubmenuTemplate>
  ): Disposable {
    return registerMenus({
      commandRegistry: this.commandRegistry,
      menuRegistry: this.menuRegistry,
      contextId: this.viewId,
      templates,
    });
  }
}
