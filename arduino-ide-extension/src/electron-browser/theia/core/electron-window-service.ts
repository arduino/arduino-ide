import { Deferred } from '@theia/core/lib/common/promise-util';
import type { NewWindowOptions } from '@theia/core/lib/common/window';
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
  implements WindowServiceExt {
  private _isFirstWindow: Deferred<boolean> | undefined;

  @postConstruct()
  protected override init(): void {
    // NOOP
    // IDE2 listens on the zoom level changes in `ArduinoFrontendContribution#onStart`
  }

  // 异步判断是否是第一个窗口
  async isFirstWindow(): Promise<boolean> {
    // 如果不是第一个窗口
    if (!this._isFirstWindow) {
      // 创建一个Deferred对象
      this._isFirstWindow = new Deferred();
      // 调用electronArduino的isFirstWindow方法，判断是否是第一个窗口
      window.electronArduino
        .isFirstWindow()
        // 如果是第一个窗口，则resolve
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
  // 重写reload方法
  override reload(options?: StartupTasks): void {
    // 如果有启动任务
    if (hasStartupTasks(options)) {
      // 请求electronArduino重新加载
      window.electronArduino.requestReload(options);
    } else {
      // 否则请求electronTheiaCore重新加载
      window.electronTheiaCore.requestReload();
    }
  }

  close(): void {
    window.electronTheiaCore.close();
  }
}
