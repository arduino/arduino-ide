import { injectable } from 'inversify';
import { Command } from '@theia/core/lib/common/command';
import { Keybinding } from '@theia/core/lib/common/keybinding';
import { KeybindingRegistry as TheiaKeybindingRegistry, KeybindingScope } from '@theia/core/lib/browser/keybinding';

@injectable()
export class KeybindingRegistry extends TheiaKeybindingRegistry {

    // https://github.com/eclipse-theia/theia/issues/8209
    unregisterKeybinding(key: string): void;
    unregisterKeybinding(keybinding: Keybinding): void;
    unregisterKeybinding(command: Command): void;
    unregisterKeybinding(arg: string | Keybinding | Command): void {
        const keymap = this.keymaps[KeybindingScope.DEFAULT];
        const filter = Command.is(arg)
            ? ({ command }: Keybinding) => command === arg.id
            : ({ keybinding }: Keybinding) => Keybinding.is(arg)
                ? keybinding === arg.keybinding
                : keybinding === arg;
        for (const binding of keymap.filter(filter)) {
            const idx = keymap.indexOf(binding);
            if (idx !== -1) {
                keymap.splice(idx, 1);
            }
        }
    }

}
