import { inject, injectable } from 'inversify';
import { BoardsPackage, BoardsService } from '../../common/protocol/boards-service';
import { ListWidget } from '../components/component-list/list-widget';
import { ListItemRenderer } from '../components/component-list/list-item-renderer';

@injectable()
export class BoardsListWidget extends ListWidget<BoardsPackage> {

    static WIDGET_ID = 'boards-list-widget';
    static WIDGET_LABEL = 'Boards Manager';

    constructor(
        @inject(BoardsService) protected service: BoardsService,
        @inject(ListItemRenderer) protected itemRenderer: ListItemRenderer<BoardsPackage>) {

        super({
            id: BoardsListWidget.WIDGET_ID,
            label: BoardsListWidget.WIDGET_LABEL,
            iconClass: 'fa fa-microchip',
            searchable: service,
            installable: service,
            itemLabel: (item: BoardsPackage) => item.name,
            itemRenderer
        });
    }

}
