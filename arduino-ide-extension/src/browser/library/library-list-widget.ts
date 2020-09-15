import { injectable, postConstruct, inject } from 'inversify';
import { LibraryPackage, LibraryService } from '../../common/protocol/library-service';
import { ListWidget } from '../widgets/component-list/list-widget';
import { ListItemRenderer } from '../widgets/component-list/list-item-renderer';

@injectable()
export class LibraryListWidget extends ListWidget<LibraryPackage> {

    static WIDGET_ID = 'library-list-widget';
    static WIDGET_LABEL = 'Library Manager';

    constructor(
        @inject(LibraryService) protected service: LibraryService,
        @inject(ListItemRenderer) protected itemRenderer: ListItemRenderer<LibraryPackage>) {

        super({
            id: LibraryListWidget.WIDGET_ID,
            label: LibraryListWidget.WIDGET_LABEL,
            iconClass: 'library-tab-icon',
            searchable: service,
            installable: service,
            itemLabel: (item: LibraryPackage) => item.name,
            itemRenderer
        });
    }

    @postConstruct()
    protected init(): void {
        super.init();
        this.toDispose.pushAll([
            this.notificationCenter.onLibraryInstalled(() => this.refresh(undefined)),
            this.notificationCenter.onLibraryUninstalled(() => this.refresh(undefined)),
        ]);
    }

}
