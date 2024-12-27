import type { Disposable } from '@theia/core/lib/common/disposable';
import { injectable } from '@theia/core/shared/inversify';
import type { AppInfo, AppService } from '../browser/app-service';
import type { Sketch } from '../common/protocol/sketches-service';
import type { StartupTasks } from '../electron-common/startup-task';

@injectable()
export class ElectronAppService implements AppService {
  quit(): void {
    window.electronArduino.quitApp();
  }

  info(): Promise<AppInfo> {
    return window.electronArduino.appInfo();
  }

  registerStartupTasksHandler(
    handler: (tasks: StartupTasks) => void
  ): Disposable {
    return window.electronArduino.registerStartupTasksHandler(handler);
  }

  scheduleDeletion(sketch: Sketch): void {
    window.electronArduino.scheduleDeletion(sketch);
  }
}
