import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { ContainerModule } from '@theia/core/shared/inversify';
import { WindowServiceExt } from '../../../browser/theia/core/window-service-ext';
import { ElectronWindowService } from './electron-window-service';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
  bind(ElectronWindowService).toSelf().inSingletonScope();
  rebind(WindowService).toService(ElectronWindowService);
  bind(WindowServiceExt).toService(ElectronWindowService);
});
