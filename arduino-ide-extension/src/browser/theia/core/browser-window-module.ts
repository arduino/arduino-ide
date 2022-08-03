import { DefaultWindowService as TheiaDefaultWindowService } from '@theia/core/lib/browser/window/default-window-service';
import { ContainerModule } from '@theia/core/shared/inversify';
import { DefaultWindowService } from './default-window-service';
import { WindowServiceExt } from './window-service-ext';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
  bind(DefaultWindowService).toSelf().inSingletonScope();
  rebind(TheiaDefaultWindowService).toService(DefaultWindowService);
  bind(WindowServiceExt).toService(DefaultWindowService);
});
