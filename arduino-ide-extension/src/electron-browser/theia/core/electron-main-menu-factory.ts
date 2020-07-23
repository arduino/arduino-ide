import { injectable } from 'inversify'
import { remote } from 'electron';
import { Keybinding } from '@theia/core/lib/common/keybinding';
import { ElectronMainMenuFactory as TheiaElectronMainMenuFactory } from '@theia/core/lib/electron-browser/menu/electron-main-menu-factory';
import { ArduinoMenus } from '../../../browser/menu/arduino-menus';

@injectable()
export class ElectronMainMenuFactory extends TheiaElectronMainMenuFactory {

    protected acceleratorFor(keybinding: Keybinding): string {
        // TODO: https://github.com/eclipse-theia/theia/issues/8207
        return this.keybindingRegistry.resolveKeybinding(keybinding)
            .map(binding => this.keybindingRegistry.acceleratorForKeyCode(binding, '+'))
            .join('')
            .replace('←', 'Left')
            .replace('→', 'Right');
    }

    protected createOSXMenu(): Electron.MenuItemConstructorOptions {
        const { submenu } = super.createOSXMenu();
        const label = 'Arduino Pro IDE';
        if (!!submenu && !(submenu instanceof remote.Menu)) {
            const [about, , ...rest] = submenu;
            const menuModel = this.menuProvider.getMenu(ArduinoMenus.FILE__SETTINGS_GROUP);
            const settings = this.fillMenuTemplate([], menuModel);
            return {
                label,
                submenu: [
                    about, // TODO: we have two about dialogs! one from electron the other from Theia.
                    { type: 'separator' },
                    ...settings,
                    { type: 'separator' },
                    ...rest
                ]
            };
        }
        return { label, submenu };
    }

}
