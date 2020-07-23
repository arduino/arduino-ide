import { injectable } from 'inversify';
import { CommonCommands } from '@theia/core/lib/browser/common-frontend-contribution';
import { URI, Command, MenuModelRegistry, CommandRegistry, SketchContribution, open } from './contribution';
import { ArduinoMenus } from '../menu/arduino-menus';

@injectable()
export class Settings extends SketchContribution {

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(Settings.Commands.OPEN_CLI_CONFIG, {
            execute: () => this.configService.getCliConfigFileUri().then(uri => open(this.openerService, new URI(uri)))
        });
    }

    registerMenus(registry: MenuModelRegistry): void {
        registry.registerMenuAction(ArduinoMenus.FILE__SETTINGS_GROUP, {
            commandId: CommonCommands.OPEN_PREFERENCES.id,
            label: 'Preferences...',
            order: '0'
        });
        registry.registerMenuAction(ArduinoMenus.FILE__SETTINGS_GROUP, {
            commandId: Settings.Commands.OPEN_CLI_CONFIG.id,
            label: 'Open CLI Configuration',
            order: '1',
        });
    }

}

export namespace Settings {
    export namespace Commands {
        export const OPEN_CLI_CONFIG: Command = {
            id: 'arduino-open-cli-config',
            label: 'Open CLI Configuration',
            category: 'Arduino'
        }
    }
}
