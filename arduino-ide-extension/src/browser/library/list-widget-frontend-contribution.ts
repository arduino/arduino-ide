import { injectable } from 'inversify';
import { FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application';
import { AbstractViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import { ListWidget } from './list-widget';
import { LibraryListWidget } from './library-list-widget';
import { MenuModelRegistry } from '@theia/core';
import { ArduinoMenus } from '../arduino-frontend-contribution';

@injectable()
export abstract class ListWidgetFrontendContribution extends AbstractViewContribution<ListWidget> implements FrontendApplicationContribution {

    async initializeLayout(): Promise<void> {
        // await this.openView();
    }

}

@injectable()
export class LibraryListWidgetFrontendContribution extends ListWidgetFrontendContribution {

    constructor() {
        super({
            widgetId: LibraryListWidget.WIDGET_ID,
            widgetName: LibraryListWidget.WIDGET_LABEL,
            defaultWidgetOptions: {
                area: 'left',
                rank: 600
            },
            toggleCommandId: `${LibraryListWidget.WIDGET_ID}:toggle`,
            toggleKeybinding: 'ctrlcmd+shift+l'
        });
    }

    registerMenus(menus: MenuModelRegistry): void {
        if (this.toggleCommand) {
            menus.registerMenuAction(ArduinoMenus.SKETCH, {
                commandId: this.toggleCommand.id,
                label: 'Manage Libraries...'
            });
        }
    }

}
