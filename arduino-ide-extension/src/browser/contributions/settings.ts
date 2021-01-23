import { inject, injectable } from 'inversify';
import { Command, MenuModelRegistry, CommandRegistry, SketchContribution, KeybindingRegistry } from './contribution';
import { ArduinoMenus } from '../menu/arduino-menus';
import { Settings as Preferences, SettingsDialog } from '../settings';

@injectable()
export class Settings extends SketchContribution {

    @inject(SettingsDialog)
    protected readonly settingsDialog: SettingsDialog;

    protected settingsOpened = false;

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(Settings.Commands.OPEN, {
            execute: async () => {
                let settings: Preferences | undefined = undefined;
                try {
                    this.settingsOpened = true;
                    settings = await this.settingsDialog.open();
                } finally {
                    this.settingsOpened = false;
                }
                if (settings) {
                    await this.settingsService.update(settings);
                    await this.settingsService.save();
                } else {
                    await this.settingsService.reset();
                }
            },
            isEnabled: () => !this.settingsOpened
        });
    }

    registerMenus(registry: MenuModelRegistry): void {
        registry.registerMenuAction(ArduinoMenus.FILE__SETTINGS_GROUP, {
            commandId: Settings.Commands.OPEN.id,
            label: 'Preferences...',
            order: '0'
        });
    }

    registerKeybindings(registry: KeybindingRegistry): void {
        registry.registerKeybinding({
            command: Settings.Commands.OPEN.id,
            keybinding: 'CtrlCmd+,',
        });
    }

}

export namespace Settings {
    export namespace Commands {
        export const OPEN: Command = {
            id: 'arduino-settings-open',
            label: 'Open Preferences...',
            category: 'Arduino'
        }
    }
}
