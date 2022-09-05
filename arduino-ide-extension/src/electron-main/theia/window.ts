import { MaybePromise } from '@theia/core';
import type { IpcMainEvent } from '@theia/core/electron-shared/electron';
import { BrowserWindow, ipcMain } from '@theia/core/electron-shared/electron';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { createDisposableListener } from '@theia/core/lib/electron-main/event-utils';
import { StartupTask } from '../../electron-common/startup-task';

/**
 * Should be used to load (URL) or reload a window. The returning promise will resolve
 * when the app is ready to receive startup tasks.
 */
export async function load(
  electronWindow: BrowserWindow,
  doLoad: (electronWindow: BrowserWindow) => MaybePromise<void>
): Promise<BrowserWindow> {
  const { id } = electronWindow;
  const toDispose = new DisposableCollection();
  const channel = StartupTask.Messaging.APP_READY_SIGNAL(id);
  return new Promise<BrowserWindow>((resolve, reject) => {
    toDispose.push(
      createDisposableListener(
        ipcMain,
        channel,
        ({ sender: webContents }: IpcMainEvent) => {
          if (webContents.id === electronWindow.webContents.id) {
            resolve(electronWindow);
          }
        }
      )
    );
    Promise.resolve(doLoad(electronWindow)).catch(reject);
  }).finally(() => toDispose.dispose());
}
