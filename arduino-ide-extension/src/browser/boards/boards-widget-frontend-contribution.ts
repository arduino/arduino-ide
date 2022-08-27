import { injectable } from '@theia/core/shared/inversify';
import { BoardsListWidget } from './boards-list-widget';
import type {
  BoardSearch,
  BoardsPackage,
} from '../../common/protocol/boards-service';
import { ListWidgetFrontendContribution } from '../widgets/component-list/list-widget-frontend-contribution';

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
        rank: 2,
      },
      toggleCommandId: `${BoardsListWidget.WIDGET_ID}:toggle`,
      toggleKeybinding: 'CtrlCmd+Shift+B',
    });
  }

  override async initializeLayout(): Promise<void> {
    this.openView();
  }
}
