import { injectable } from 'inversify';
import { remote } from 'electron';
import { isOSX } from '@theia/core/lib/common/os';
import { Keybinding } from '@theia/core/lib/common/keybinding';
import {
    CompositeMenuNode,
    MAIN_MENU_BAR,
    MenuPath,
} from '@theia/core/lib/common/menu';
import {
    ElectronMainMenuFactory as TheiaElectronMainMenuFactory,
    ElectronMenuOptions,
} from '@theia/core/lib/electron-browser/menu/electron-main-menu-factory';
import {
    ArduinoMenus,
    PlaceholderMenuNode,
} from '../../../browser/menu/arduino-menus';

@injectable()
export class ElectronMainMenuFactory extends TheiaElectronMainMenuFactory {
    createMenuBar(): Electron.Menu {
        this._toggledCommands.clear(); // https://github.com/eclipse-theia/theia/issues/8977
        const menuModel = this.menuProvider.getMenu(MAIN_MENU_BAR);
        const template = this.fillMenuTemplate([], menuModel);
        if (isOSX) {
            template.unshift(this.createOSXMenu());
        }
        const menu = remote.Menu.buildFromTemplate(
            this.escapeAmpersand(template)
        );
        this._menu = menu;
        return menu;
    }

    createContextMenu(menuPath: MenuPath, args?: any[]): Electron.Menu {
        const menuModel = this.menuProvider.getMenu(menuPath);
        const template = this.fillMenuTemplate([], menuModel, args, {
            showDisabled: false,
        });
        return remote.Menu.buildFromTemplate(this.escapeAmpersand(template));
    }

    // TODO: remove after https://github.com/eclipse-theia/theia/pull/9231
    private escapeAmpersand(
        template: Electron.MenuItemConstructorOptions[]
    ): Electron.MenuItemConstructorOptions[] {
        for (const option of template) {
            if (option.label) {
                option.label = option.label.replace(/\&+/g, '&$&');
            }
            if (option.submenu) {
                this.escapeAmpersand(
                    option.submenu as Electron.MenuItemConstructorOptions[]
                );
            }
        }
        return template;
    }

    protected acceleratorFor(keybinding: Keybinding): string {
        // TODO: https://github.com/eclipse-theia/theia/issues/8207
        return this.keybindingRegistry
            .resolveKeybinding(keybinding)
            .map((binding) =>
                this.keybindingRegistry.acceleratorForKeyCode(binding, '+')
            )
            .join('')
            .replace('←', 'Left')
            .replace('→', 'Right');
    }

    protected createOSXMenu(): Electron.MenuItemConstructorOptions {
        const { submenu } = super.createOSXMenu();
        const label = 'Arduino IDE';
        if (!!submenu && !(submenu instanceof remote.Menu)) {
            const [, , /* about */ /* preferences */ ...rest] = submenu;
            const about = this.fillMenuTemplate(
                [],
                this.menuProvider.getMenu(ArduinoMenus.HELP__ABOUT_GROUP)
            );
            const preferences = this.fillMenuTemplate(
                [],
                this.menuProvider.getMenu(ArduinoMenus.FILE__PREFERENCES_GROUP)
            );
            const advanced = this.fillMenuTemplate(
                [],
                this.menuProvider.getMenu(ArduinoMenus.FILE__ADVANCED_GROUP)
            );
            return {
                label,
                submenu: [
                    ...about,
                    { type: 'separator' },
                    ...preferences,
                    ...advanced,
                    { type: 'separator' },
                    ...rest,
                ],
            };
        }
        return { label, submenu };
    }

    protected handleDefault(
        menuNode: CompositeMenuNode,
        args: any[] = [],
        options?: ElectronMenuOptions
    ): Electron.MenuItemConstructorOptions[] {
        if (menuNode instanceof PlaceholderMenuNode) {
            return [
                {
                    label: menuNode.label,
                    enabled: false,
                    visible: true,
                },
            ];
        }
        return [];
    }
}
