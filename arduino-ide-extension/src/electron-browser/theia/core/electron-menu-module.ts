import { ContainerModule } from 'inversify';
import { ElectronMenuContribution as TheiaElectronMenuContribution } from '@theia/core/lib/electron-browser/menu/electron-menu-contribution'
import { ElectronMenuContribution } from './electron-menu-contribution';
import { MainMenuManager } from '../../../common/main-menu-manager';
import { ElectronMainMenuFactory as TheiaElectronMainMenuFactory } from '@theia/core/lib/electron-browser/menu/electron-main-menu-factory';
import { ElectronMainMenuFactory } from './electron-main-menu-factory';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(ElectronMenuContribution).toSelf().inSingletonScope();
    bind(MainMenuManager).toService(ElectronMenuContribution);
    rebind(TheiaElectronMenuContribution).to(ElectronMenuContribution);
    bind(ElectronMainMenuFactory).toSelf().inRequestScope();
    rebind(TheiaElectronMainMenuFactory).toService(ElectronMainMenuFactory);
});
