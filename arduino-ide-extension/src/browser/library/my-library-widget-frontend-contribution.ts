/* eslint-disable prettier/prettier */
import { AbstractViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import { MyLibraryListWidget } from './my-library-list-widget';

export class MyLibraryListWidgetFrontendContribution extends AbstractViewContribution<MyLibraryListWidget> {
    constructor() {
        super({
            widgetId: 'lingzhi-library-widget',
            widgetName: '库',
            defaultWidgetOptions: {
                area: 'left',
                rank: 1,
            },
            toggleCommandId: 'toggle-linzghi-library-widget',
        });
    }
}
