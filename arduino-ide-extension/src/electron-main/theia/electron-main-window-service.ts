import type { NewWindowOptions } from '@theia/core/lib/common/window';
import { ElectronMainWindowServiceImpl as TheiaElectronMainWindowService } from '@theia/core/lib/electron-main/electron-main-window-service-impl';
import { inject, injectable } from '@theia/core/shared/inversify';
import { hasStartupTasks } from '../../electron-common/startup-task';
import { ElectronArduinoRenderer } from '../electron-arduino';
import { ElectronMainApplication } from './electron-main-application';
import { TheiaRendererAPI } from '@theia/core/lib/electron-main/electron-api-main';

@injectable()
export class ElectronMainWindowServiceImpl extends TheiaElectronMainWindowService {
  @inject(ElectronMainApplication)
  protected override readonly app: ElectronMainApplication;

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

    // Default.
    if (!hasStartupTasks(options)) {
      return super.openNewWindow(url, options);
    }

    // Create new window and share the startup tasks.
    this.app.createWindow().then((electronWindow) => {
      const { webContents } = electronWindow;
      const toDisposeOnReady = TheiaRendererAPI.onApplicationStateChanged(
        webContents,
        (state) => {
          if (state === 'ready') {
            ElectronArduinoRenderer.sendStartupTasks(webContents, options);
            toDisposeOnReady.dispose();
          }
        }
      );
      return electronWindow.loadURL(url);
    });
    return undefined;
  }
}
