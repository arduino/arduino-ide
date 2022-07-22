import { JsonRpcConnectionHandler } from '@theia/core/lib/common/messaging/proxy-factory';
import { ElectronMainWindowService } from '@theia/core/lib/electron-common/electron-main-window-service';
import { ElectronConnectionHandler } from '@theia/core/lib/electron-common/messaging/electron-connection-handler';
import {
  ElectronMainApplication as TheiaElectronMainApplication,
  ElectronMainApplicationContribution,
} from '@theia/core/lib/electron-main/electron-main-application';
import { ElectronMessagingContribution as TheiaElectronMessagingContribution } from '@theia/core/lib/electron-main/messaging/electron-messaging-contribution';
import { TheiaElectronWindow as DefaultTheiaElectronWindow } from '@theia/core/lib/electron-main/theia-electron-window';
import { ContainerModule } from '@theia/core/shared/inversify';
import {
  IDEUpdater,
  IDEUpdaterClient,
  IDEUpdaterPath,
} from '../common/protocol/ide-updater';
import { electronMainWindowServiceExtPath } from '../electron-common/electron-main-window-service-ext';
import { IsTempSketch } from '../node/is-temp-sketch';
import { IDEUpdaterImpl } from './ide-updater/ide-updater-impl';
import { ElectronMainApplication } from './theia/electron-main-application';
import { ElectronMainWindowServiceImpl } from './theia/electron-main-window-service';
import { ElectronMessagingContribution } from './theia/electron-messaging-contribution';
import { TheiaElectronWindow } from './theia/theia-electron-window';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
  bind(ElectronMainApplication).toSelf().inSingletonScope();
  rebind(TheiaElectronMainApplication).toService(ElectronMainApplication);

  bind(ElectronMainWindowServiceImpl).toSelf().inSingletonScope();
  rebind(ElectronMainWindowService).toService(ElectronMainWindowServiceImpl);

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

  bind(TheiaElectronWindow).toSelf();
  rebind(DefaultTheiaElectronWindow).toService(TheiaElectronWindow);

  bind(ElectronConnectionHandler)
    .toDynamicValue(
      (context) =>
        new JsonRpcConnectionHandler(electronMainWindowServiceExtPath, () =>
          context.container.get(ElectronMainWindowServiceImpl)
        )
    )
    .inSingletonScope();

  bind(IsTempSketch).toSelf().inSingletonScope();

  // Fix for cannot reload window: https://github.com/eclipse-theia/theia/issues/11600
  bind(ElectronMessagingContribution).toSelf().inSingletonScope();
  rebind(TheiaElectronMessagingContribution).toService(
    ElectronMessagingContribution
  );
});
