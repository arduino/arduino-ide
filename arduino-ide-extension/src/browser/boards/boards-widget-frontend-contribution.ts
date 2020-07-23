import { injectable } from 'inversify';
import { MenuModelRegistry } from '@theia/core';
import { BoardsListWidget } from './boards-list-widget';
import { BoardsPackage } from '../../common/protocol/boards-service';
import { ListWidgetFrontendContribution } from '../widgets/component-list/list-widget-frontend-contribution';
import { ArduinoMenus } from '../menu/arduino-menus';

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
            toggleKeybinding: 'CtrlCmd+Shift+B'
        });
    }

    async initializeLayout(): Promise<void> {
        this.openView();
    }

    registerMenus(menus: MenuModelRegistry): void {
        if (this.toggleCommand) {
            menus.registerMenuAction(ArduinoMenus.TOOLS__MAIN_GROUP, {
                commandId: this.toggleCommand.id,
                label: 'Boards Manager...',
                order: '4'
            });
        }
    }

}
