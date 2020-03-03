import '../../../src/browser/style/browser-menu.css'
import { ContainerModule } from 'inversify';
import { BrowserMenuBarContribution, BrowserMainMenuFactory } from '@theia/core/lib/browser/menu/browser-menu-plugin';
import { MainMenuManager } from './main-menu-manager';
import { ArduinoMenuContribution } from './arduino-menu-contribution';
import { ArduinoBrowserMainMenuFactory } from './arduino-browser-main-menu-factory';


export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(ArduinoBrowserMainMenuFactory).toSelf().inSingletonScope();
    bind(MainMenuManager).toService(ArduinoBrowserMainMenuFactory);
    rebind(BrowserMainMenuFactory).toService(ArduinoBrowserMainMenuFactory);
    rebind(BrowserMenuBarContribution).to(ArduinoMenuContribution).inSingletonScope();
});
