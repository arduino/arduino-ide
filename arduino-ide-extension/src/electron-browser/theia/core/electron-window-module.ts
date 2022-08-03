import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { ElectronIpcConnectionProvider } from '@theia/core/lib/electron-browser/messaging/electron-ipc-connection-provider';
import { ContainerModule } from '@theia/core/shared/inversify';
import { WindowServiceExt } from '../../../browser/theia/core/window-service-ext';
import {
  ElectronMainWindowServiceExt,
  electronMainWindowServiceExtPath,
} from '../../../electron-common/electron-main-window-service-ext';
import {
  SplashService,
  splashServicePath,
} from '../../../electron-common/splash-service';
import { ElectronWindowService } from './electron-window-service';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
  bind(ElectronWindowService).toSelf().inSingletonScope();
  rebind(WindowService).toService(ElectronWindowService);
  bind(WindowServiceExt).toService(ElectronWindowService);
  bind(ElectronMainWindowServiceExt)
    .toDynamicValue(({ container }) =>
      ElectronIpcConnectionProvider.createProxy(
        container,
        electronMainWindowServiceExtPath
      )
    )
    .inSingletonScope();
  bind(SplashService)
    .toDynamicValue(({ container }) =>
      ElectronIpcConnectionProvider.createProxy(container, splashServicePath)
    )
    .inSingletonScope();
});
