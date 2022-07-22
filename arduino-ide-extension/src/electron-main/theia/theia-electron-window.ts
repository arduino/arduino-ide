import {
  RELOAD_REQUESTED_SIGNAL,
  StopReason,
} from '@theia/core/lib/electron-common/messaging/electron-messages';
import { createDisposableListener } from '@theia/core/lib/electron-main/event-utils';
import { TheiaElectronWindow as DefaultTheiaElectronWindow } from '@theia/core/lib/electron-main/theia-electron-window';
import { injectable } from '@theia/core/shared/inversify';
import { ipcMain, IpcMainEvent } from '@theia/electron/shared/electron';
import { StartupTask } from '../../electron-common/startup-task';
import { load } from './window';

@injectable()
export class TheiaElectronWindow extends DefaultTheiaElectronWindow {
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
