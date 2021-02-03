import { inject, injectable } from 'inversify';
import { NewWindowOptions } from '@theia/core/lib/browser/window/window-service';
import { ElectronMainWindowServiceImpl as TheiaElectronMainWindowService } from '@theia/core/lib/electron-main/electron-main-window-service-impl';
import { ElectronMainApplication } from './electron-main-application';

@injectable()
export class ElectronMainWindowServiceImpl extends TheiaElectronMainWindowService {

    @inject(ElectronMainApplication)
    protected readonly app: ElectronMainApplication;

    openNewWindow(url: string, { external }: NewWindowOptions): undefined {
        if (!external) {
            const existing = this.app.windows.find(window => window.webContents.getURL() === url);
            if (existing) {
                existing.focus();
                return;
            }
        }
        return super.openNewWindow(url, { external });
    }


}
