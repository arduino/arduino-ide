import '../../../../src/browser/style/browser-menu.css';
import { ContainerModule } from 'inversify';
import { BrowserMenuBarContribution, BrowserMainMenuFactory as TheiaBrowserMainMenuFactory } from '@theia/core/lib/browser/menu/browser-menu-plugin';
import { MainMenuManager } from '../../../common/main-menu-manager';
import { ArduinoMenuContribution } from './browser-menu-plugin';
import { BrowserMainMenuFactory } from './browser-main-menu-factory';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(BrowserMainMenuFactory).toSelf().inSingletonScope();
    bind(MainMenuManager).toService(BrowserMainMenuFactory);
    rebind(TheiaBrowserMainMenuFactory).toService(BrowserMainMenuFactory);
    rebind(BrowserMenuBarContribution).to(ArduinoMenuContribution).inSingletonScope();
});
