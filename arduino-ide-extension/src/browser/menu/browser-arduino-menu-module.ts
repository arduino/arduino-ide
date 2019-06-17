import { BrowserMenuBarContribution } from '@theia/core/lib/browser/menu/browser-menu-plugin';
import { ArduinoMenuContribution } from './arduino-menu-contribution';
import { ContainerModule, interfaces } from 'inversify';

export default new ContainerModule((bind: interfaces.Bind, unbind: interfaces.Unbind) => {
    unbind(BrowserMenuBarContribution);
    bind(BrowserMenuBarContribution).to(ArduinoMenuContribution).inSingletonScope();
})
