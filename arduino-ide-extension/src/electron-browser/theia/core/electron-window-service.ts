import { Deferred } from '@theia/core/lib/common/promise-util';
import type {
  NewWindowOptions,
  WindowSearchParams,
} from '@theia/core/lib/common/window';
import { ElectronWindowService as TheiaElectronWindowService } from '@theia/core/lib/electron-browser/window/electron-window-service';
import { injectable, postConstruct } from '@theia/core/shared/inversify';
import { WindowServiceExt } from '../../../browser/theia/core/window-service-ext';
import {
  hasStartupTasks,
  StartupTasks,
} from '../../../electron-common/startup-task';

@injectable()
export class ElectronWindowService
  extends TheiaElectronWindowService
  implements WindowServiceExt
{
  private _isFirstWindow: Deferred<boolean> | undefined;

  @postConstruct()
  protected override init(): void {
    // Overridden to avoid calling the zoom level listener in super.
    // IDE2 listens on the zoom level changes in `ArduinoFrontendContribution#onStart`

    window.electronTheiaCore.onAboutToClose(() => {
      this.connectionCloseService.markForClose(this.frontendIdProvider.getId());
    });
  }

  async isFirstWindow(): Promise<boolean> {
    if (!this._isFirstWindow) {
      this._isFirstWindow = new Deferred();
      window.electronArduino
        .isFirstWindow()
        .then((isFirstWindow) => this._isFirstWindow?.resolve(isFirstWindow));
    }
    return this._isFirstWindow.promise;
  }

  // Overridden because the default Theia implementation destructures the additional properties of the `options` arg, such as `tasks`.
  // https://github.com/eclipse-theia/theia/blob/2deedbad70bd4b503bf9c7e733ab9603f492600f/packages/core/src/electron-browser/window/electron-window-service.ts#L43
  override openNewWindow(url: string, options?: NewWindowOptions): undefined {
    return this.delegate.openNewWindow(url, options);
  }

  // Overridden to support optional task owner params and make `tsc` happy.
  override reload(options?: StartupTasks | WindowSearchParams): void {
    if (hasStartupTasks(options)) {
      window.electronArduino.requestReload(options);
    } else {
      super.reload(options);
    }
  }

  close(): void {
    window.electronTheiaCore.close();
  }
}
