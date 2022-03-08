import { ContainerModule } from '@theia/core/shared/inversify';
import { JsonRpcConnectionHandler } from '@theia/core/lib/common/messaging/proxy-factory';
import { ElectronConnectionHandler } from '@theia/core/lib/electron-common/messaging/electron-connection-handler';
import { ElectronMainWindowService } from '@theia/core/lib/electron-common/electron-main-window-service';
import {
  ElectronMainApplication as TheiaElectronMainApplication,
  ElectronMainApplicationContribution,
} from '@theia/core/lib/electron-main/electron-main-application';
import {
  SplashService,
  splashServicePath,
} from '../electron-common/splash-service';
import { SplashServiceImpl } from './splash/splash-service-impl';
import { ElectronMainApplication } from './theia/electron-main-application';
import { ElectronMainWindowServiceImpl } from './theia/electron-main-window-service';
import {
  IDEUpdater,
  IDEUpdaterClient,
  IDEUpdaterPath,
} from '../common/protocol/ide-updater';
import { IDEUpdaterImpl } from './ide-updater/ide-updater-impl';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
  bind(ElectronMainApplication).toSelf().inSingletonScope();
  rebind(TheiaElectronMainApplication).toService(ElectronMainApplication);

  bind(ElectronMainWindowServiceImpl).toSelf().inSingletonScope();
  rebind(ElectronMainWindowService).toService(ElectronMainWindowServiceImpl);

  bind(SplashServiceImpl).toSelf().inSingletonScope();
  bind(SplashService).toService(SplashServiceImpl);
  bind(ElectronConnectionHandler)
    .toDynamicValue(
      (context) =>
        new JsonRpcConnectionHandler(splashServicePath, () =>
          context.container.get(SplashService)
        )
    )
    .inSingletonScope();

  // IDE updater bindings
  bind(IDEUpdaterImpl).toSelf().inSingletonScope();
  bind(IDEUpdater).toService(IDEUpdaterImpl);
  bind(ElectronMainApplicationContribution).toService(IDEUpdater);
  bind(ElectronConnectionHandler)
    .toDynamicValue(
      (context) =>
        new JsonRpcConnectionHandler<IDEUpdaterClient>(
          IDEUpdaterPath,
          (client) => {
            const server = context.container.get<IDEUpdater>(IDEUpdater);
            server.setClient(client);
            client.onDidCloseConnection(() => server.disconnectClient(client));
            return server;
          }
        )
    )
    .inSingletonScope();
});
