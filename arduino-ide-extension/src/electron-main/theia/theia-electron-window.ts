import { StopReason } from '@theia/core/lib/common/frontend-application-state';
import { TheiaRendererAPI } from '@theia/core/lib/electron-main/electron-api-main';
import { TheiaElectronWindow as DefaultTheiaElectronWindow } from '@theia/core/lib/electron-main/theia-electron-window';
import { injectable } from '@theia/core/shared/inversify';
import { hasStartupTasks } from '../../electron-common/startup-task';
import { ElectronArduinoRenderer } from '../electron-arduino';

@injectable()
export class TheiaElectronWindow extends DefaultTheiaElectronWindow {
  // 重写reload方法
  protected override reload(args?: unknown): void {
    // 处理停止请求
    this.handleStopRequest(() => {
      // 将应用程序状态设置为init
      this.applicationState = 'init';
      // 如果有启动任务
      if (hasStartupTasks(args)) {
        // 获取窗口的webContents
        const { webContents } = this._window;
        // 当应用程序状态改变时，发送启动任务
        const toDisposeOnReady = TheiaRendererAPI.onApplicationStateChanged(
          // 监听应用程序状态改变事件
          webContents,
          // 当应用程序状态改变时执行的操作
          (state) => {
            // 如果应用程序状态为ready
            if (state === 'ready') {
              // 发送启动任务
              ElectronArduinoRenderer.sendStartupTasks(webContents, args);
              // 释放toDisposeOnReady
              toDisposeOnReady.dispose();
            }
          }
        );
      }
      // 重新加载窗口
      this._window.reload();
    }, StopReason.Reload);
  }

  // 重写attachReloadListener方法
  protected override attachReloadListener(): void {
    // 将ElectronArduinoRenderer的onRequestReload方法绑定到this.window.webContents上
    this.toDispose.push(
      ElectronArduinoRenderer.onRequestReload(
        this.window.webContents,
        // 当onRequestReload方法被调用时，执行this.reload方法
        (args?: unknown) => this.reload(args)
      )
    );
  }
}
