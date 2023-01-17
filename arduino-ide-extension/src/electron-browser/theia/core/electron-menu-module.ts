import { ContextMenuRenderer } from '@theia/core/lib/browser/context-menu-renderer';
import { ElectronMainMenuFactory as TheiaElectronMainMenuFactory } from '@theia/core/lib/electron-browser/menu/electron-main-menu-factory';
import { ElectronMenuContribution as TheiaElectronMenuContribution } from '@theia/core/lib/electron-browser/menu/electron-menu-contribution';
import { ContainerModule } from '@theia/core/shared/inversify';
import { MainMenuManager } from '../../../common/main-menu-manager';
import { ElectronContextMenuRenderer } from './electron-context-menu-renderer';
import { ElectronMainMenuFactory } from './electron-main-menu-factory';
import { ElectronMenuContribution } from './electron-menu-contribution';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
  bind(ElectronMenuContribution).toSelf().inSingletonScope();
  bind(MainMenuManager).toService(ElectronMenuContribution);
  bind(ElectronContextMenuRenderer).toSelf().inSingletonScope();
  rebind(ContextMenuRenderer).toService(ElectronContextMenuRenderer);
  rebind(TheiaElectronMenuContribution).toService(ElectronMenuContribution);
  bind(ElectronMainMenuFactory).toSelf().inSingletonScope();
  rebind(TheiaElectronMainMenuFactory).toService(ElectronMainMenuFactory);
});
