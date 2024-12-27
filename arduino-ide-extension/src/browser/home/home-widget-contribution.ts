/* eslint-disable prettier/prettier */
import {
    AbstractViewContribution,
    FrontendApplicationContribution,
} from '@theia/core/lib/browser';
import { injectable } from '@theia/core/shared/inversify';
import { HomeWidget } from './home-widget';
import { CommandRegistry, MenuModelRegistry } from '@theia/core';
import { HomeCommands } from './home-commands';

@injectable()
export class HomeWidgetContribution
    extends AbstractViewContribution<HomeWidget>
    implements FrontendApplicationContribution {
    constructor() {
        super({
            widgetId: 'lingzhi-home-widget',
            widgetName: HomeWidget.LABEL,
            defaultWidgetOptions: {
                area: 'left',
                rank: 1,
            },
            toggleCommandId: HomeCommands.OPEN_HOME.id,
        });
    }

    async initializeLayout(): Promise<void> {
        return this.openView() as Promise<any>;
    }

    override registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(HomeCommands.OPEN_HOME, {
            execute: () => super.openView({ activate: false, reveal: true }),
        });
    }

    override registerMenus(registry: MenuModelRegistry): void {
        registry.unregisterMenuAction({
            commandId: HomeCommands.OPEN_HOME.id,
        });
    }
}
