import { ContainerModule } from 'inversify';
import { DebugAdapterContribution } from '@theia/debug/lib/common/debug-model';
import { ArduinoDebugAdapterContribution } from './arduino-debug-adapter-contribution';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(DebugAdapterContribution).to(ArduinoDebugAdapterContribution).inSingletonScope();
});
