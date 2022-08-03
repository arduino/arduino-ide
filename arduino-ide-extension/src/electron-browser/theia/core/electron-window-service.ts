import * as remote from '@theia/core/electron-shared/@electron/remote';
import {
  ConnectionStatus,
  ConnectionStatusService,
} from '@theia/core/lib/browser/connection-status-service';
import { nls } from '@theia/core/lib/common';
import { ElectronWindowService as TheiaElectronWindowService } from '@theia/core/lib/electron-browser/window/electron-window-service';
import {
  inject,
  injectable,
  postConstruct,
} from '@theia/core/shared/inversify';
import { WindowServiceExt } from '../../../browser/theia/core/window-service-ext';
import { ElectronMainWindowServiceExt } from '../../../electron-common/electron-main-window-service-ext';

@injectable()
export class ElectronWindowService
  extends TheiaElectronWindowService
  implements WindowServiceExt
{
  @inject(ConnectionStatusService)
  private readonly connectionStatusService: ConnectionStatusService;

  @inject(ElectronMainWindowServiceExt)
  private readonly mainWindowServiceExt: ElectronMainWindowServiceExt;

  @postConstruct()
  protected override init(): void {
    // NOOP
    // Does not listen on Theia's `window.zoomLevel` changes.
    // TODO: IDE2 must switch to the Theia preferences and drop the custom one.
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

  private _firstWindow: boolean | undefined;
  async isFirstWindow(): Promise<boolean> {
    if (this._firstWindow === undefined) {
      const windowId = remote.getCurrentWindow().id; // This is expensive and synchronous so we check it once per FE.
      this._firstWindow = await this.mainWindowServiceExt.isFirstWindow(
        windowId
      );
    }
    return this._firstWindow;
  }
}
