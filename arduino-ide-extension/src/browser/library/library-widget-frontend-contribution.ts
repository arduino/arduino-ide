import { Command } from '@theia/core/lib/common/command';
import { MenuModelRegistry, MenuPath } from '@theia/core/lib/common/menu';
import { nls } from '@theia/core/lib/common/nls';
import { inject, injectable } from '@theia/core/shared/inversify';
import { Type as TypeLabel } from '../../common/nls';
import {
  LibraryPackage,
  LibrarySearch,
  TopicLabel,
} from '../../common/protocol';
import { URI } from '../contributions/contribution';
import { ArduinoMenus } from '../menu/arduino-menus';
import { MenuActionTemplate, SubmenuTemplate } from '../menu/register-menu';
import { ListWidgetFrontendContribution } from '../widgets/component-list/list-widget-frontend-contribution';
import {
  LibraryListWidget,
  LibraryListWidgetSearchOptions,
} from './library-list-widget';

@injectable()
export class LibraryListWidgetFrontendContribution extends ListWidgetFrontendContribution<
  LibraryPackage,
  LibrarySearch
> {
  @inject(LibraryListWidgetSearchOptions)
  protected readonly searchOptions: LibraryListWidgetSearchOptions;

  constructor() {
    super({
      widgetId: LibraryListWidget.WIDGET_ID,
      widgetName: LibraryListWidget.WIDGET_LABEL,
      defaultWidgetOptions: {
        area: 'left',
        rank: 3,
      },
      toggleCommandId: `${LibraryListWidget.WIDGET_ID}:toggle`,
      toggleKeybinding: 'CtrlCmd+Shift+I',
    });
  }

  override registerMenus(menus: MenuModelRegistry): void {
    if (this.toggleCommand) {
      menus.registerMenuAction(ArduinoMenus.TOOLS__MAIN_GROUP, {
        commandId: this.toggleCommand.id,
        label: nls.localize(
          'arduino/library/manageLibraries',
          'Manage Libraries...'
        ),
        order: '3',
      });
    }
  }

  protected override canParse(uri: URI): boolean {
    try {
      LibrarySearch.UriParser.parse(uri);
      return true;
    } catch {
      return false;
    }
  }

  protected override parse(uri: URI): LibrarySearch | undefined {
    return LibrarySearch.UriParser.parse(uri);
  }

  protected override buildFilterMenuGroup(
    menuPath: MenuPath
  ): Array<MenuActionTemplate | SubmenuTemplate> {
    const typeSubmenuPath = [...menuPath, TypeLabel];
    const topicSubmenuPath = [...menuPath, TopicLabel];
    return [
      {
        submenuPath: typeSubmenuPath,
        menuLabel: `${TypeLabel}: "${
          LibrarySearch.TypeLabels[this.searchOptions.options.type]
        }"`,
        options: { order: String(0) },
      },
      ...this.buildMenuActions<LibrarySearch.Type>(
        typeSubmenuPath,
        LibrarySearch.TypeLiterals.slice(),
        (type) => this.searchOptions.options.type === type,
        (type) => this.searchOptions.update({ type }),
        (type) => LibrarySearch.TypeLabels[type]
      ),
      {
        submenuPath: topicSubmenuPath,
        menuLabel: `${TopicLabel}: "${
          LibrarySearch.TopicLabels[this.searchOptions.options.topic]
        }"`,
        options: { order: String(1) },
      },
      ...this.buildMenuActions<LibrarySearch.Topic>(
        topicSubmenuPath,
        LibrarySearch.TopicLiterals.slice(),
        (topic) => this.searchOptions.options.topic === topic,
        (topic) => this.searchOptions.update({ topic }),
        (topic) => LibrarySearch.TopicLabels[topic]
      ),
    ];
  }

  protected override get showViewFilterContextMenuCommand(): Command & {
    label: string;
  } {
    return LibraryListWidgetFrontendContribution.Commands
      .SHOW_LIBRARY_LIST_WIDGET_FILTER_CONTEXT_MENU;
  }

  protected get showInstalledCommandId(): string {
    return 'arduino-show-installed-libraries';
  }

  protected get showUpdatesCommandId(): string {
    return 'arduino-show-library-updates';
  }
}
export namespace LibraryListWidgetFrontendContribution {
  export namespace Commands {
    export const SHOW_LIBRARY_LIST_WIDGET_FILTER_CONTEXT_MENU: Command & {
      label: string;
    } = {
      id: 'arduino-library-list-widget-show-filter-context-menu',
      label: nls.localize(
        'arduino/libraries/filterLibraries',
        'Filter Libraries...'
      ),
    };
  }
}
