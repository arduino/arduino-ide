import { injectable } from 'inversify';
import { BoardsListWidget } from './boards-list-widget';
import { BoardsPackage } from '../../common/protocol/boards-service';
import { ListWidgetFrontendContribution } from '../widgets/component-list/list-widget-frontend-contribution';

@injectable()
export class BoardsListWidgetFrontendContribution extends ListWidgetFrontendContribution<BoardsPackage> {

    constructor() {
        super({
            widgetId: BoardsListWidget.WIDGET_ID,
            widgetName: BoardsListWidget.WIDGET_LABEL,
            defaultWidgetOptions: {
                area: 'left',
                rank: 600
            },
            toggleCommandId: `${BoardsListWidget.WIDGET_ID}:toggle`,
            toggleKeybinding: 'CtrlCmd+Shift+B'
        });
    }

    async initializeLayout(): Promise<void> {
        this.openView();
    }

}
