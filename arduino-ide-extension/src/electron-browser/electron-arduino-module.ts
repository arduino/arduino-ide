import { ContainerModule } from '@theia/core/shared/inversify';
import { AppService } from '../browser/app-service';
import { DialogService } from '../browser/dialog-service';
import { ElectronAppService } from './electron-app-service';
import { ElectronDialogService } from './electron-dialog-service';

export default new ContainerModule((bind) => {
  bind(ElectronAppService).toSelf().inSingletonScope();
  bind(AppService).toService(ElectronAppService);
  bind(ElectronDialogService).toSelf().inSingletonScope();
  bind(DialogService).toService(ElectronDialogService);
});
