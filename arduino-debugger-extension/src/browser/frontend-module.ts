import { ContainerModule } from 'inversify';
import { VariableContribution } from '@theia/variable-resolver/lib/browser';
import { ArduinoVariableResolver } from './arduino-variable-resolver';
import { ArduinoAdvancedMode } from 'arduino-ide-extension/lib/browser/arduino-frontend-contribution';
import { DebugFrontendApplicationContribution } from '@theia/debug/lib/browser/debug-frontend-application-contribution';
import { SilentDebugFrontendApplicationContribution } from './silent-debug-frontend-application-contribution';
import { DebugConfigurationManager } from '@theia/debug/lib/browser/debug-configuration-manager';
import { ArduinoDebugConfigurationManager } from './arduino-debug-configuration-manager';
import { ArduinoDebugFrontendApplicationContribution } from './arduino-debug-frontend-application-contribution';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(ArduinoVariableResolver).toSelf().inSingletonScope();
    bind(VariableContribution).toService(ArduinoVariableResolver);

    if (!ArduinoAdvancedMode.TOGGLED) {
        unbind(DebugFrontendApplicationContribution);
        bind(DebugFrontendApplicationContribution).to(SilentDebugFrontendApplicationContribution);
    } else {
        unbind(DebugConfigurationManager);
        bind(DebugConfigurationManager).to(ArduinoDebugConfigurationManager).inSingletonScope();
        unbind(DebugFrontendApplicationContribution);
        bind(DebugFrontendApplicationContribution).to(ArduinoDebugFrontendApplicationContribution);
    }
});
