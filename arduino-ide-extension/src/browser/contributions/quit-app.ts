import { injectable } from 'inversify';
import { remote } from 'electron';
import { isOSX, isWindows } from '@theia/core/lib/common/os';
import { Contribution, Command, MenuModelRegistry, KeybindingRegistry, CommandRegistry } from './contribution';
import { ArduinoMenus } from '../menu/arduino-menus';

@injectable()
export class QuitApp extends Contribution {

    registerCommands(registry: CommandRegistry): void {
        if (!isOSX) {
            registry.registerCommand(QuitApp.Commands.QUIT_APP, {
                execute: () => remote.app.quit()
            });
        }
    }

    registerMenus(registry: MenuModelRegistry): void {
        if (!isOSX) {
            registry.registerMenuAction(ArduinoMenus.FILE__QUIT_GROUP, {
                commandId: QuitApp.Commands.QUIT_APP.id,
                label: 'Quit',
                order: '0'
            });
        }
    }

    registerKeybindings(registry: KeybindingRegistry): void {
        if (!isOSX) {
            registry.registerKeybinding({
                command: QuitApp.Commands.QUIT_APP.id,
                keybinding: 'CtrlCmd+Q'
            });
        }
    }

}

export namespace QuitApp {
    export namespace Commands {
        export const QUIT_APP: Command = {
            id: 'arduino-quit-app'
        };
    }
}
