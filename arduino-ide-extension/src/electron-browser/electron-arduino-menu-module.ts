import { ContainerModule } from 'inversify';
import { ElectronMenuContribution } from '@theia/core/lib/electron-browser/menu/electron-menu-contribution'
import { ElectronArduinoMenuContribution } from './electron-arduino-menu-contribution';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(ElectronArduinoMenuContribution).toSelf().inSingletonScope();
    rebind(ElectronMenuContribution).to(ElectronArduinoMenuContribution);
});
