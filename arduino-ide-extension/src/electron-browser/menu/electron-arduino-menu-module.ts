import { ContainerModule } from 'inversify';
import { ElectronMenuContribution } from '@theia/core/lib/electron-browser/menu/electron-menu-contribution'
import { ElectronArduinoMenuContribution } from './electron-arduino-menu-contribution';
import { MainMenuManager } from '../../browser/menu/main-menu-manager';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(ElectronArduinoMenuContribution).toSelf().inSingletonScope();
    bind(MainMenuManager).toService(ElectronArduinoMenuContribution);
    rebind(ElectronMenuContribution).to(ElectronArduinoMenuContribution);
});
