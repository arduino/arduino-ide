import { inject, injectable, postConstruct } from 'inversify';
import { BoardsPackage, BoardsService } from '../../common/protocol/boards-service';
import { ListWidget } from '../widgets/component-list/list-widget';
import { ListItemRenderer } from '../widgets/component-list/list-item-renderer';

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

    @postConstruct()
    protected init(): void {
        super.init();
        this.toDispose.pushAll([
            this.notificationCenter.onPlatformInstalled(() => this.refresh(undefined)),
            this.notificationCenter.onPlatformUninstalled(() => this.refresh(undefined)),
        ]);
    }

    protected async install({ item, progressId, version }: { item: BoardsPackage, progressId: string, version: string; }): Promise<void> {
        await super.install({ item, progressId, version });
        this.messageService.info(`Successfully installed platform ${item.name}:${version}`, { timeout: 3000 });
    }

    protected async uninstall({ item, progressId }: { item: BoardsPackage, progressId: string }): Promise<void> {
        await super.uninstall({ item, progressId });
        this.messageService.info(`Successfully uninstalled platform ${item.name}:${item.installedVersion}`, { timeout: 3000 });
    }

}
