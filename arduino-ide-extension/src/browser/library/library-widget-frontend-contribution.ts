import { injectable } from 'inversify';
import { FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application';
import { AbstractViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import { MenuModelRegistry } from '@theia/core';
import { LibraryListWidget } from './library-list-widget';
import { ArduinoMenus } from '../menu/arduino-menus';

@injectable()
export class LibraryListWidgetFrontendContribution extends AbstractViewContribution<LibraryListWidget> implements FrontendApplicationContribution {

    constructor() {
        super({
            widgetId: LibraryListWidget.WIDGET_ID,
            widgetName: LibraryListWidget.WIDGET_LABEL,
            defaultWidgetOptions: {
                area: 'left',
                rank: 700
            },
            toggleCommandId: `${LibraryListWidget.WIDGET_ID}:toggle`,
            toggleKeybinding: 'CtrlCmd+Shift+I'
        });
    }

    async initializeLayout(): Promise<void> {
        this.openView();
    }

    registerMenus(menus: MenuModelRegistry): void {
        if (this.toggleCommand) {
            menus.registerMenuAction(ArduinoMenus.TOOLS__MAIN_GROUP, {
                commandId: this.toggleCommand.id,
                label: 'Manage Libraries...',
                order: '3'
            });
        }
    }

}
