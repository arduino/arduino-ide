import { injectable } from 'inversify';
import { MenuModelRegistry } from '@theia/core';
import { BoardsListWidget } from './boards-list-widget';
import { ArduinoMenus } from '../arduino-frontend-contribution';
import { BoardsPackage } from '../../common/protocol/boards-service';
import { ListWidgetFrontendContribution } from '../components/component-list/list-widget-frontend-contribution';

@injectable()
export class BoardsListWidgetFrontendContribution extends ListWidgetFrontendContribution<BoardsPackage> {

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

    async initializeLayout(): Promise<void> {
        this.openView();
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
