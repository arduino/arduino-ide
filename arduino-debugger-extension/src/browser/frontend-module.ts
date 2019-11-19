import { ContainerModule } from 'inversify';
import { VariableContribution } from '@theia/variable-resolver/lib/browser';
import { ArduinoVariableResolver } from './arduino-variable-resolver';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(ArduinoVariableResolver).toSelf().inSingletonScope();
    bind(VariableContribution).toService(ArduinoVariableResolver);
});
