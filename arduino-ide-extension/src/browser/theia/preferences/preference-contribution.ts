import { injectable } from 'inversify';
import { KeybindingRegistry } from '@theia/core/lib/browser/keybinding';
import { PreferencesContribution as TheiaPreferencesContribution } from '@theia/preferences/lib/browser/preference-contribution';
import { CommonCommands } from '@theia/core/lib/browser';

@injectable()
export class PreferencesContribution extends TheiaPreferencesContribution {

    registerKeybindings(registry: KeybindingRegistry): void {
        // https://github.com/eclipse-theia/theia/issues/8202
        registry.registerKeybinding({
            command: CommonCommands.OPEN_PREFERENCES.id,
            keybinding: 'CtrlCmd+,',
        });
    }

}
