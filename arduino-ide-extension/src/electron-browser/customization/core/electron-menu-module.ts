import { ContainerModule } from 'inversify';
import { ElectronMenuContribution as TheiaElectronMenuContribution } from '@theia/core/lib/electron-browser/menu/electron-menu-contribution'
import { ElectronMenuContribution } from './electron-menu-contribution';
import { MainMenuManager } from '../../../common/main-menu-manager';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(ElectronMenuContribution).toSelf().inSingletonScope();
    bind(MainMenuManager).toService(ElectronMenuContribution);
    rebind(TheiaElectronMenuContribution).to(ElectronMenuContribution);
});
