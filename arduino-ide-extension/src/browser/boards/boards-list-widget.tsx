import { ListWidget } from './list-widget';

export class BoardsListWidget extends ListWidget {

    static WIDGET_ID = 'boards-list-widget';
    static WIDGET_LABEL = 'Boards Manager';

    protected widgetProps(): ListWidget.Props {
        return {
            id: BoardsListWidget.WIDGET_ID,
            title: BoardsListWidget.WIDGET_LABEL,
            iconClass: 'fa fa-microchip'
        }
    }

}