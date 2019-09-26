import { injectable } from 'inversify';
import { ElectronMenuContribution } from '@theia/core/lib/electron-browser/menu/electron-menu-contribution';

@injectable()
export class ElectronArduinoMenuContribution extends ElectronMenuContribution {

    protected hideTopPanel(): void {
        // NOOP
        // We reuse the `div` for the Arduino toolbar.
    }

}
