import { inject, injectable, postConstruct } from 'inversify';
import { remote } from 'electron';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import {
  ConnectionStatus,
  ConnectionStatusService,
} from '@theia/core/lib/browser/connection-status-service';
import { ElectronWindowService as TheiaElectronWindowService } from '@theia/core/lib/electron-browser/window/electron-window-service';
import { SplashService } from '../electron-common/splash-service';
import { nls } from '@theia/core/lib/common';

@injectable()
export class ElectronWindowService extends TheiaElectronWindowService {
  @inject(ConnectionStatusService)
  protected readonly connectionStatusService: ConnectionStatusService;

  @inject(SplashService)
  protected readonly splashService: SplashService;

  @inject(FrontendApplicationStateService)
  protected readonly appStateService: FrontendApplicationStateService;

  @postConstruct()
  protected init(): void {
    this.appStateService
      .reachedAnyState('initialized_layout')
      .then(() => this.splashService.requestClose());
  }

  protected shouldUnload(): boolean {
    const offline =
      this.connectionStatusService.currentStatus === ConnectionStatus.OFFLINE;
    const detail = offline
      ? nls.localize(
          'arduino/electron/couldNotSave',
          'Could not save the sketch. Please copy your unsaved work into your favorite text editor, and restart the IDE.'
        )
      : nls.localize(
          'arduino/electron/unsavedChanges',
          'Any unsaved changes will not be saved.'
        );
    const electronWindow = remote.getCurrentWindow();
    const response = remote.dialog.showMessageBoxSync(electronWindow, {
      type: 'question',
      buttons: [
        nls.localize('vscode/extensionsUtils/yes', 'Yes'),
        nls.localize('vscode/extensionsUtils/no', 'No'),
      ],
      title: nls.localize('vscode/Default/ConfirmTitle', 'Confirm'),
      message: nls.localize(
        'arduino/sketch/close',
        'Are you sure you want to close the sketch?'
      ),
      detail,
    });
    return response === 0; // 'Yes', close the window.
  }
}
