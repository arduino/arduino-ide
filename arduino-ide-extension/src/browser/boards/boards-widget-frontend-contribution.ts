import { injectable } from 'inversify';
import { FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application';
import { AbstractViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import { ListWidget } from './list-widget';
import { BoardsListWidget } from './boards-list-widget';
import { MenuModelRegistry } from '@theia/core';
import { ArduinoMenus } from '../arduino-frontend-contribution';

@injectable()
export abstract class ListWidgetFrontendContribution extends AbstractViewContribution<ListWidget> implements FrontendApplicationContribution {

    async initializeLayout(): Promise<void> {
        // await this.openView();
    }

}

@injectable()
export class BoardsListWidgetFrontendContribution extends ListWidgetFrontendContribution {

    static readonly OPEN_MANAGER = `${BoardsListWidget.WIDGET_ID}:toggle`;

    constructor() {
        super({
            widgetId: BoardsListWidget.WIDGET_ID,
            widgetName: BoardsListWidget.WIDGET_LABEL,
            defaultWidgetOptions: {
                area: 'left',
                rank: 600
            },
            toggleCommandId: BoardsListWidgetFrontendContribution.OPEN_MANAGER,
            toggleKeybinding: 'ctrlcmd+shift+b'
        });
    }

    registerMenus(menus: MenuModelRegistry): void {
        if (this.toggleCommand) {
            menus.registerMenuAction(ArduinoMenus.TOOLS, {
                commandId: this.toggleCommand.id,
                label: 'Boards Manager...'
            });
        }
    }

}
