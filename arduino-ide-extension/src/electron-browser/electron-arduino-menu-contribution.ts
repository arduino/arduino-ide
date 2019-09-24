import * as electron from 'electron';
import { injectable, inject } from 'inversify';
import { isOSX } from '@theia/core/lib/common/os';
import { Disposable } from '@theia/core/lib/common/disposable';
import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { ElectronMenuContribution } from '@theia/core/lib/electron-browser/menu/electron-menu-contribution';
import { FrontendApplicationStateService, FrontendApplicationState } from '@theia/core/lib/browser/frontend-application-state';

// Code was copied from https://github.com/eclipse-theia/theia/pull/5140/commits/be873411eff1f48822a65261305bbe3549ac903d
@injectable()
export class ElectronArduinoMenuContribution extends ElectronMenuContribution {

    @inject(FrontendApplicationStateService)
    protected readonly stateService: FrontendApplicationStateService;

    onStart(app: FrontendApplication): void {
        this.setMenu();
        if (isOSX) {
            // OSX: Recreate the menus when changing windows.
            // OSX only has one menu bar for all windows, so we need to swap
            // between them as the user switches windows.
            electron.remote.getCurrentWindow().on('focus', () => this.setMenu());
        }
        // Make sure the application menu is complete, once the frontend application is ready.
        // https://github.com/theia-ide/theia/issues/5100
        let onStateChange: Disposable | undefined = undefined;
        const stateServiceListener = (state: FrontendApplicationState) => {
            if (state === 'ready') {
                this.setMenu();
            }
            if (state === 'closing_window') {
                if (!!onStateChange) {
                    onStateChange.dispose();
                }
            }
        };
        onStateChange = this.stateService.onStateChanged(stateServiceListener);
    }

    private setMenu(menu: electron.Menu = this.factory.createMenuBar(), electronWindow: electron.BrowserWindow = electron.remote.getCurrentWindow()): void {
        if (isOSX) {
            electron.remote.Menu.setApplicationMenu(menu);
        } else {
            // Unix/Windows: Set the per-window menus
            electronWindow.setMenu(menu);
        }
    }

}
