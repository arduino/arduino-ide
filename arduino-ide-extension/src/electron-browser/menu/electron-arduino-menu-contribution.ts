import { injectable } from 'inversify';
import { ElectronMenuContribution } from '@theia/core/lib/electron-browser/menu/electron-menu-contribution';
import { MainMenuManager } from '../../browser/menu/main-menu-manager';

@injectable()
export class ElectronArduinoMenuContribution extends ElectronMenuContribution implements MainMenuManager {

    protected hideTopPanel(): void {
        // NOOP
        // We reuse the `div` for the Arduino toolbar.
    }

    update(): void {
        (this as any).setMenu();
    }

}
