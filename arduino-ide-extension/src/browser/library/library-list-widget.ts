import { inject, injectable } from 'inversify';
import { LibraryPackage } from '../../common/protocol/library-service';
import { ListWidget } from '../widgets/component-list/list-widget';
import { ListItemRenderer } from '../widgets/component-list/list-item-renderer';
import { LibraryServiceProvider } from './library-service-provider';

@injectable()
export class LibraryListWidget extends ListWidget<LibraryPackage> {

    static WIDGET_ID = 'library-list-widget';
    static WIDGET_LABEL = 'Library Manager';

    constructor(
        @inject(LibraryServiceProvider) protected service: LibraryServiceProvider,
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

}
