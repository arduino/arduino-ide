import { inject, injectable } from 'inversify';
import { remote } from 'electron';
import { ConnectionStatus, ConnectionStatusService } from '@theia/core/lib/browser/connection-status-service';
import { ElectronWindowService as TheiaElectronWindowService } from '@theia/core/lib/electron-browser/window/electron-window-service';

@injectable()
export class ElectronWindowService extends TheiaElectronWindowService {

    @inject(ConnectionStatusService)
    protected readonly connectionStatusService: ConnectionStatusService;

    protected shouldUnload(): boolean {
        const offline = this.connectionStatusService.currentStatus === ConnectionStatus.OFFLINE;
        const detail = offline
            ? 'Could not save the sketch. Please copy your unsaved work into your favorite text editor, and restart the IDE.'
            : 'Any unsaved changes will not be saved.'
        const electronWindow = remote.getCurrentWindow();
        const response = remote.dialog.showMessageBoxSync(electronWindow, {
            type: 'question',
            buttons: ['Yes', 'No'],
            title: 'Confirm',
            message: 'Are you sure you want to close the sketch?',
            detail
        });
        return response === 0; // 'Yes', close the window.
    }

}
