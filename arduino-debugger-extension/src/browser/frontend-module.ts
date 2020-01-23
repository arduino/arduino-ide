import { ContainerModule } from 'inversify';
import { VariableContribution } from '@theia/variable-resolver/lib/browser';
import { ArduinoVariableResolver } from './arduino-variable-resolver';
import { DebugSessionManager } from '@theia/debug/lib/browser/debug-session-manager';
import { DebugFrontendApplicationContribution } from '@theia/debug/lib/browser/debug-frontend-application-contribution';
import { DebugConfigurationManager } from '@theia/debug/lib/browser/debug-configuration-manager';
import { ArduinoDebugConfigurationManager } from './arduino-debug-configuration-manager';
import { ArduinoDebugFrontendApplicationContribution } from './arduino-debug-frontend-application-contribution';
import { ArduinoDebugSessionManager } from './arduino-debug-session-manager';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(ArduinoVariableResolver).toSelf().inSingletonScope();
    bind(VariableContribution).toService(ArduinoVariableResolver);
    rebind(DebugSessionManager).to(ArduinoDebugSessionManager).inSingletonScope();
    rebind(DebugConfigurationManager).to(ArduinoDebugConfigurationManager).inSingletonScope();
    rebind(DebugFrontendApplicationContribution).to(ArduinoDebugFrontendApplicationContribution);
});
