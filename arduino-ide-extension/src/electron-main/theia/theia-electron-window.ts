import { injectable } from '@theia/core/shared/inversify';
import { ipcMain, IpcMainEvent } from '@theia/electron/shared/electron';
import {
  RELOAD_REQUESTED_SIGNAL,
  StopReason,
} from '@theia/core/lib/electron-common/messaging/electron-messages';
import { TheiaElectronWindow as DefaultTheiaElectronWindow } from '@theia/core/lib/electron-main/theia-electron-window';
import { FileUri } from '@theia/core/lib/node';
import URI from '@theia/core/lib/common/uri';
import { createDisposableListener } from '@theia/core/lib/electron-main/event-utils';
import { StartupTask } from '../../electron-common/startup-task';
import { load } from './window';

@injectable()
export class TheiaElectronWindow extends DefaultTheiaElectronWindow {
  protected override async handleStopRequest(
    onSafeCallback: () => unknown,
    reason: StopReason
  ): Promise<boolean> {
    // Only confirm close to windows that have loaded our frontend.
    // Both the windows's URL and the FS path of the `index.html` should be converted to the "same" format to be able to compare them. (#11226)
    // Notes:
    //  - Windows: file:///C:/path/to/somewhere vs file:///c%3A/path/to/somewhere
    //  - macOS: file:///Applications/App%20Name.app/Contents vs /Applications/App Name.app/Contents
    // This URL string comes from electron, we can expect that this is properly encoded URL. For example, a space is `%20`
    const currentUrl = new URI(this.window.webContents.getURL()).toString();
    // THEIA_FRONTEND_HTML_PATH is an FS path, we have to covert to an encoded URI string.
    const frontendUri = FileUri.create(
      this.globals.THEIA_FRONTEND_HTML_PATH
    ).toString();
    const safeToClose =
      !currentUrl.includes(frontendUri) || (await this.checkSafeToStop(reason));
    if (safeToClose) {
      try {
        await onSafeCallback();
        return true;
      } catch (e) {
        console.warn(`Request ${StopReason[reason]} failed.`, e);
      }
    }
    return false;
  }

  protected override reload(tasks?: StartupTask[]): void {
    this.handleStopRequest(() => {
      this.applicationState = 'init';
      if (tasks && tasks.length) {
        load(this._window, (electronWindow) => electronWindow.reload()).then(
          (electronWindow) =>
            electronWindow.webContents.send(
              StartupTask.Messaging.STARTUP_TASKS_SIGNAL,
              { tasks }
            )
        );
      } else {
        this._window.reload();
      }
    }, StopReason.Reload);
  }

  protected override attachReloadListener(): void {
    createDisposableListener(
      ipcMain,
      RELOAD_REQUESTED_SIGNAL,
      (e: IpcMainEvent, arg: unknown) => {
        if (this.isSender(e)) {
          if (StartupTask.has(arg)) {
            this.reload(arg.tasks);
          } else {
            this.reload();
          }
        }
      },
      this.toDispose
    );
  }

  // https://github.com/eclipse-theia/theia/issues/11600#issuecomment-1240657481
  protected override isSender(e: IpcMainEvent): boolean {
    return e.sender.id === this._window.webContents.id;
  }
}
