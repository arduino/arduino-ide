import { injectable } from '@theia/core/shared/inversify';
import {
  BoardSearch,
  BoardsPackage,
} from '../../common/protocol/boards-service';
import { URI } from '../contributions/contribution';
import { ListWidgetFrontendContribution } from '../widgets/component-list/list-widget-frontend-contribution';
import { BoardsListWidget } from './boards-list-widget';

@injectable()
export class BoardsListWidgetFrontendContribution extends ListWidgetFrontendContribution<
  BoardsPackage,
  BoardSearch
> {
  constructor() {
    super({
      widgetId: BoardsListWidget.WIDGET_ID,
      widgetName: BoardsListWidget.WIDGET_LABEL,
      defaultWidgetOptions: {
        area: 'left',
        rank: 3,
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
}
