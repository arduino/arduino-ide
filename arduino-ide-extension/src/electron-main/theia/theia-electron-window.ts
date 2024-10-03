import { StopReason } from '@theia/core/lib/common/frontend-application-state';
import { TheiaRendererAPI } from '@theia/core/lib/electron-main/electron-api-main';
import { TheiaElectronWindow as DefaultTheiaElectronWindow } from '@theia/core/lib/electron-main/theia-electron-window';
import { injectable } from '@theia/core/shared/inversify';
import { hasStartupTasks } from '../../electron-common/startup-task';
import { ElectronArduinoRenderer } from '../electron-arduino';

@injectable()
export class TheiaElectronWindow extends DefaultTheiaElectronWindow {
  protected override reload(args?: unknown): void {
    this.handleStopRequest(async () => {
      this.applicationState = 'init';
      if (hasStartupTasks(args)) {
        const { webContents } = this._window;
        const toDisposeOnReady = TheiaRendererAPI.onApplicationStateChanged(
          webContents,
          (state) => {
            if (state === 'ready') {
              ElectronArduinoRenderer.sendStartupTasks(webContents, args);
              toDisposeOnReady.dispose();
            }
          }
        );
      }
      this._window.reload();
    }, StopReason.Reload);
  }

  protected override attachReloadListener(): void {
    this.toDispose.push(
      ElectronArduinoRenderer.onRequestReload(
        this.window.webContents,
        (args?: unknown) => this.reload(args)
      )
    );
  }
}
