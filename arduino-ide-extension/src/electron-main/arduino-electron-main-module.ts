import { ContainerModule } from 'inversify';
import { JsonRpcConnectionHandler } from '@theia/core/lib/common/messaging/proxy-factory';
import { ElectronConnectionHandler } from '@theia/core/lib/electron-common/messaging/electron-connection-handler';
import { ElectronMainApplication as TheiaElectronMainApplication } from '@theia/core/lib/electron-main/electron-main-application';
import { SplashService, splashServicePath } from '../electron-common/splash-service';
import { SplashServiceImpl } from './splash/splash-service-impl';
import { ElectronMainApplication } from './theia/electron-main-application';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(ElectronMainApplication).toSelf().inSingletonScope();
    rebind(TheiaElectronMainApplication).toService(ElectronMainApplication);

    bind(SplashServiceImpl).toSelf().inSingletonScope();
    bind(SplashService).toService(SplashServiceImpl);
    bind(ElectronConnectionHandler).toDynamicValue(context =>
        new JsonRpcConnectionHandler(splashServicePath, () => context.container.get(SplashService))).inSingletonScope();
});
