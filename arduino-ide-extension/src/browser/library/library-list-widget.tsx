import { ListWidget } from './list-widget';

export class LibraryListWidget extends ListWidget {

    static WIDGET_ID = 'library-list-widget';
    static WIDGET_LABEL = 'Library Manager';

    protected widgetProps(): ListWidget.Props {
        return {
            id: LibraryListWidget.WIDGET_ID,
            title: LibraryListWidget.WIDGET_LABEL,
            iconClass: 'library-tab-icon'
        }
    }

}