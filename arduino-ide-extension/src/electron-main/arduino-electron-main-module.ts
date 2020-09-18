import { ContainerModule } from 'inversify';
import { ElectronMainApplication as TheiaElectronMainApplication } from '@theia/core/lib/electron-main/electron-main-application';
import { ElectronMainApplication } from './theia/electron-main-application';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(ElectronMainApplication).toSelf().inSingletonScope();
    rebind(TheiaElectronMainApplication).toService(ElectronMainApplication);
});
