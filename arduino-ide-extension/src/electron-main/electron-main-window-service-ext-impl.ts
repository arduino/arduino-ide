import { inject, injectable } from '@theia/core/shared/inversify';
import { ElectronMainWindowServiceExt } from '../electron-common/electron-main-window-service-ext';
import { ElectronMainApplication } from './theia/electron-main-application';

@injectable()
export class ElectronMainWindowServiceExtImpl
  implements ElectronMainWindowServiceExt
{
  @inject(ElectronMainApplication)
  private readonly app: ElectronMainApplication;

  async isFirstWindow(windowId: number): Promise<boolean> {
    return this.app.firstWindowId === windowId;
  }
}
