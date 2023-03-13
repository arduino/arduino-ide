import { MenuPath } from '@theia/core';
import { Command } from '@theia/core/lib/common/command';
import { nls } from '@theia/core/lib/common/nls';
import { inject, injectable } from '@theia/core/shared/inversify';
import { Type as TypeLabel } from '../../common/nls';
import {
  BoardSearch,
  BoardsPackage,
} from '../../common/protocol/boards-service';
import { URI } from '../contributions/contribution';
import { MenuActionTemplate, SubmenuTemplate } from '../menu/register-menu';
import { ListWidgetFrontendContribution } from '../widgets/component-list/list-widget-frontend-contribution';
import {
  BoardsListWidget,
  BoardsListWidgetSearchOptions,
} from './boards-list-widget';

@injectable()
export class BoardsListWidgetFrontendContribution extends ListWidgetFrontendContribution<
  BoardsPackage,
  BoardSearch
> {
  @inject(BoardsListWidgetSearchOptions)
  protected readonly searchOptions: BoardsListWidgetSearchOptions;

  constructor() {
    super({
      widgetId: BoardsListWidget.WIDGET_ID,
      widgetName: BoardsListWidget.WIDGET_LABEL,
      defaultWidgetOptions: {
        area: 'left',
        rank: 2,
      },
      toggleCommandId: `${BoardsListWidget.WIDGET_ID}:toggle`,
      toggleKeybinding: 'CtrlCmd+Shift+B',
    });
  }

  protected canParse(uri: URI): boolean {
    try {
      BoardSearch.UriParser.parse(uri);
      return true;
    } catch {
      return false;
    }
  }

  protected parse(uri: URI): BoardSearch | undefined {
    return BoardSearch.UriParser.parse(uri);
  }

  protected buildFilterMenuGroup(
    menuPath: MenuPath
  ): Array<MenuActionTemplate | SubmenuTemplate> {
    const typeSubmenuPath = [...menuPath, TypeLabel];
    return [
      {
        submenuPath: typeSubmenuPath,
        menuLabel: `${TypeLabel}: "${
          BoardSearch.TypeLabels[this.searchOptions.options.type]
        }"`,
        options: { order: String(0) },
      },
      ...this.buildMenuActions<BoardSearch.Type>(
        typeSubmenuPath,
        BoardSearch.TypeLiterals.slice(),
        (type) => this.searchOptions.options.type === type,
        (type) => this.searchOptions.update({ type }),
        (type) => BoardSearch.TypeLabels[type]
      ),
    ];
  }

  protected get showViewFilterContextMenuCommand(): Command & {
    label: string;
  } {
    return BoardsListWidgetFrontendContribution.Commands
      .SHOW_BOARDS_LIST_WIDGET_FILTER_CONTEXT_MENU;
  }

  protected get showInstalledCommandId(): string {
    return 'arduino-show-installed-boards';
  }

  protected get showUpdatesCommandId(): string {
    return 'arduino-show-boards-updates';
  }
}
export namespace BoardsListWidgetFrontendContribution {
  export namespace Commands {
    export const SHOW_BOARDS_LIST_WIDGET_FILTER_CONTEXT_MENU: Command & {
      label: string;
    } = {
      id: 'arduino-boards-list-widget-show-filter-context-menu',
      label: nls.localize('arduino/boards/filterBoards', 'Filter Boards...'),
    };
  }
}
