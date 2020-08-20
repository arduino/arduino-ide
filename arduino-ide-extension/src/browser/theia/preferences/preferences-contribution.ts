import { injectable } from 'inversify';
import { MenuModelRegistry } from '@theia/core/lib/common/menu';
import { KeybindingRegistry } from '@theia/core/lib/browser/keybinding';
import { CommonCommands, CommonMenus } from '@theia/core/lib/browser';
import { PreferencesContribution as TheiaPreferencesContribution } from '@theia/preferences/lib/browser/preferences-contribution';

@injectable()
export class PreferencesContribution extends TheiaPreferencesContribution {

    registerMenus(registry: MenuModelRegistry): void {
        super.registerMenus(registry);
        // The settings group: preferences, CLI config is not part of the `File` menu on macOS.
        // On Windows and Linux, we rebind it to `Preferences...`. It is safe to remove here.
        registry.unregisterMenuAction(CommonCommands.OPEN_PREFERENCES.id, CommonMenus.FILE_SETTINGS_SUBMENU_OPEN);
    }

    registerKeybindings(registry: KeybindingRegistry): void {
        // https://github.com/eclipse-theia/theia/issues/8202
        registry.registerKeybinding({
            command: CommonCommands.OPEN_PREFERENCES.id,
            keybinding: 'CtrlCmd+,',
        });
    }

}
