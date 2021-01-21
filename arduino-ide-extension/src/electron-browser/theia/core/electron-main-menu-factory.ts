import { injectable } from 'inversify'
import { remote } from 'electron';
import { Keybinding } from '@theia/core/lib/common/keybinding';
import { ElectronMainMenuFactory as TheiaElectronMainMenuFactory } from '@theia/core/lib/electron-browser/menu/electron-main-menu-factory';
import { ArduinoMenus } from '../../../browser/menu/arduino-menus';

@injectable()
export class ElectronMainMenuFactory extends TheiaElectronMainMenuFactory {

    createMenuBar(): Electron.Menu {
        this._toggledCommands.clear(); // https://github.com/eclipse-theia/theia/issues/8977
        return super.createMenuBar();
    }

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
            const [/* about */, /* settings */, ...rest] = submenu;
            const about = this.fillMenuTemplate([], this.menuProvider.getMenu(ArduinoMenus.HELP__ABOUT_GROUP));
            const settings = this.fillMenuTemplate([], this.menuProvider.getMenu(ArduinoMenus.FILE__SETTINGS_GROUP));
            return {
                label,
                submenu: [
                    ...about,
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
