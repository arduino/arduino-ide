import * as electron from 'electron';
import { injectable, inject } from "inversify";
import { ElectronMenuContribution } from "@theia/core/lib/electron-browser/menu/electron-menu-contribution";
import { FrontendApplication } from "@theia/core/lib/browser";
import { isOSX } from '@theia/core';
import { WorkspaceService } from '@theia/workspace/lib/browser';

@injectable()
export class ElectronArduinoMenuContribution extends ElectronMenuContribution {

    @inject(WorkspaceService) protected readonly workspaceService: WorkspaceService;

    onStart(app: FrontendApplication): void {
        this.workspaceService.onWorkspaceChanged(() => {
            const createdMenuBar = this.factory.createMenuBar();
            const currentWindow = electron.remote.getCurrentWindow();
            if (isOSX) {
                electron.remote.Menu.setApplicationMenu(createdMenuBar);
                currentWindow.on('focus', () =>
                    // OSX: Recreate the menus when changing windows.
                    // OSX only has one menu bar for all windows, so we need to swap
                    // between them as the user switch windows.
                    electron.remote.Menu.setApplicationMenu(this.factory.createMenuBar())
                );
            } else {
                // Unix/Windows: Set the per-window menus
                currentWindow.setMenu(createdMenuBar);
            }
        });
    }
}