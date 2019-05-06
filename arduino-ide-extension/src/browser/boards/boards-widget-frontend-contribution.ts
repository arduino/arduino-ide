import { injectable } from 'inversify';
import { FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application';
import { AbstractViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import { ListWidget } from './list-widget';
import { BoardsListWidget } from './boards-list-widget';

@injectable()
export abstract class ListWidgetFrontendContribution extends AbstractViewContribution<ListWidget> implements FrontendApplicationContribution {

    async initializeLayout(): Promise<void> {
        await this.openView();
    }

}

@injectable()
export class BoardsListWidgetFrontendContribution extends ListWidgetFrontendContribution {

    constructor() {
        super({
            widgetId: BoardsListWidget.WIDGET_ID,
            widgetName: BoardsListWidget.WIDGET_LABEL,
            defaultWidgetOptions: {
                area: 'left',
                rank: 600
            },
            toggleCommandId: `${BoardsListWidget.WIDGET_ID}:toggle`,
            toggleKeybinding: 'ctrlcmd+shift+b'
        });
    }

}
