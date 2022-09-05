import * as remote from '@theia/core/electron-shared/@electron/remote';
import { ipcRenderer } from '@theia/core/electron-shared/electron';
import {
  ConnectionStatus,
  ConnectionStatusService,
} from '@theia/core/lib/browser/connection-status-service';
import { nls } from '@theia/core/lib/common';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { NewWindowOptions } from '@theia/core/lib/common/window';
import { ElectronWindowService as TheiaElectronWindowService } from '@theia/core/lib/electron-browser/window/electron-window-service';
import { RELOAD_REQUESTED_SIGNAL } from '@theia/core/lib/electron-common/messaging/electron-messages';
import {
  inject,
  injectable,
  postConstruct,
} from '@theia/core/shared/inversify';
import { WindowServiceExt } from '../../../browser/theia/core/window-service-ext';
import { ElectronMainWindowServiceExt } from '../../../electron-common/electron-main-window-service-ext';
import { StartupTask } from '../../../electron-common/startup-task';

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

  private _firstWindow: Deferred<boolean> | undefined;
  async isFirstWindow(): Promise<boolean> {
    if (this._firstWindow === undefined) {
      this._firstWindow = new Deferred<boolean>();
      const windowId = remote.getCurrentWindow().id; // This is expensive and synchronous so we check it once per FE.
      this.mainWindowServiceExt
        .isFirstWindow(windowId)
        .then((firstWindow) => this._firstWindow?.resolve(firstWindow));
    }
    return this._firstWindow.promise;
  }

  // Overridden because the default Theia implementation destroys the additional properties of the `options` arg, such as `tasks`.
  override openNewWindow(url: string, options?: NewWindowOptions): undefined {
    return this.delegate.openNewWindow(url, options);
  }

  // Overridden to support optional task owner params and make `tsc` happy.
  override reload(options?: StartupTask.Owner): void {
    if (options?.tasks && options.tasks.length) {
      const { tasks } = options;
      ipcRenderer.send(RELOAD_REQUESTED_SIGNAL, { tasks });
    } else {
      ipcRenderer.send(RELOAD_REQUESTED_SIGNAL);
    }
  }
}
