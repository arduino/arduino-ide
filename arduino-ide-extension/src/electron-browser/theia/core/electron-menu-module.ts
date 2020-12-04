import { ContainerModule } from 'inversify';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { ElectronMainMenuFactory as TheiaElectronMainMenuFactory } from '@theia/core/lib/electron-browser/menu/electron-main-menu-factory';
import { ElectronMenuContribution as TheiaElectronMenuContribution } from '@theia/core/lib/electron-browser/menu/electron-menu-contribution'
import { ElectronIpcConnectionProvider } from '@theia/core/lib/electron-browser/messaging/electron-ipc-connection-provider';
import { SplashService, splashServicePath } from '../../../electron-common/splash-service';
import { MainMenuManager } from '../../../common/main-menu-manager';
import { ElectronWindowService } from '../../electron-window-service';
import { ElectronMainMenuFactory } from './electron-main-menu-factory';
import { ElectronMenuContribution } from './electron-menu-contribution';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(ElectronMenuContribution).toSelf().inSingletonScope();
    bind(MainMenuManager).toService(ElectronMenuContribution);
    rebind(TheiaElectronMenuContribution).to(ElectronMenuContribution);
    bind(ElectronMainMenuFactory).toSelf().inRequestScope();
    rebind(TheiaElectronMainMenuFactory).toService(ElectronMainMenuFactory);
    bind(ElectronWindowService).toSelf().inSingletonScope()
    rebind(WindowService).toService(ElectronWindowService);
    bind(SplashService).toDynamicValue(context => ElectronIpcConnectionProvider.createProxy(context.container, splashServicePath)).inSingletonScope();
});
