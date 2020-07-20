import { injectable } from 'inversify'
import { Keybinding } from '@theia/core/lib/common/keybinding';
import { ElectronMainMenuFactory as TheiaElectronMainMenuFactory } from '@theia/core/lib/electron-browser/menu/electron-main-menu-factory';

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

}
