import { injectable } from 'inversify';
import { CommandRegistry } from '@theia/core/lib/common/command';
import { MenuModelRegistry } from '@theia/core/lib/common/menu';
import { KeybindingRegistry } from '@theia/core/lib/browser/keybinding';
import { ElectronMenuContribution as TheiaElectronMenuContribution, ElectronCommands } from '@theia/core/lib/electron-browser/menu/electron-menu-contribution';
import { MainMenuManager } from '../../../common/main-menu-manager';

@injectable()
export class ElectronMenuContribution extends TheiaElectronMenuContribution implements MainMenuManager {

    protected hideTopPanel(): void {
        // NOOP
        // We reuse the `div` for the Arduino toolbar.
    }

    update(): void {
        (this as any).setMenu();
    }

    registerCommands(registry: CommandRegistry): void {
        super.registerCommands(registry);
        registry.unregisterCommand(ElectronCommands.CLOSE_WINDOW);
    }

    registerMenus(registry: MenuModelRegistry): void {
        super.registerMenus(registry);
        registry.unregisterMenuAction(ElectronCommands.CLOSE_WINDOW);
    }

    registerKeybindings(registry: KeybindingRegistry): void {
        super.registerKeybindings(registry);
        registry.unregisterKeybinding(ElectronCommands.CLOSE_WINDOW.id);
        registry.unregisterKeybinding(ElectronCommands.ZOOM_IN.id);
        registry.unregisterKeybinding(ElectronCommands.ZOOM_OUT.id);
    }

}
