import type { NewWindowOptions } from '@theia/core/lib/common/window';
import type { BrowserWindow } from '@theia/core/electron-shared/electron';
import { ElectronMainWindowServiceImpl as TheiaElectronMainWindowService } from '@theia/core/lib/electron-main/electron-main-window-service-impl';
import { inject, injectable } from '@theia/core/shared/inversify';
import { ElectronMainWindowServiceExt } from '../../electron-common/electron-main-window-service-ext';
import { StartupTask } from '../../electron-common/startup-task';
import { ElectronMainApplication } from './electron-main-application';
import { load } from './window';

@injectable()
export class ElectronMainWindowServiceImpl
  extends TheiaElectronMainWindowService
  implements ElectronMainWindowServiceExt
{
  @inject(ElectronMainApplication)
  protected override readonly app: ElectronMainApplication;

  async isFirstWindow(windowId: number): Promise<boolean> {
    return this.app.firstWindowId === windowId;
  }

  override openNewWindow(url: string, options: NewWindowOptions): undefined {
    // External window has highest precedence.
    if (options?.external) {
      return super.openNewWindow(url, options);
    }

    // Look for existing window with the same URL and focus it.
    const existing = this.app.browserWindows.find(
      ({ webContents }) => webContents.getURL() === url
    );
    if (existing) {
      existing.focus();
      return undefined;
    }

    // Create new window and share the startup tasks.
    if (StartupTask.has(options)) {
      const { tasks } = options;
      this.app.createWindow().then((electronWindow) => {
        this.loadURL(electronWindow, url).then(() => {
          electronWindow.webContents.send(
            StartupTask.Messaging.STARTUP_TASKS_SIGNAL,
            { tasks }
          );
        });
      });
      return undefined;
    }

    // Default.
    return super.openNewWindow(url, options);
  }

  private loadURL(
    electronWindow: BrowserWindow,
    url: string
  ): Promise<BrowserWindow> {
    return load(electronWindow, (electronWindow) =>
      electronWindow.loadURL(url)
    );
  }
}
