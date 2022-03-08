import { inject, injectable } from 'inversify';
import { ElectronMainWindowServiceImpl as TheiaElectronMainWindowService } from '@theia/core/lib/electron-main/electron-main-window-service-impl';
import { ElectronMainApplication } from './electron-main-application';
import { NewWindowOptions } from '@theia/core/lib/common/window';

@injectable()
export class ElectronMainWindowServiceImpl extends TheiaElectronMainWindowService {
  @inject(ElectronMainApplication)
  protected readonly app: ElectronMainApplication;

  openNewWindow(url: string, { external }: NewWindowOptions): undefined {
    if (!external) {
      const sanitizedUrl = this.sanitize(url);
      const existing = this.app.browserWindows.find(
        (window) => this.sanitize(window.webContents.getURL()) === sanitizedUrl
      );
      if (existing) {
        existing.focus();
        return;
      }
    }
    return super.openNewWindow(url, { external });
  }

  private sanitize(url: string): string {
    const copy = new URL(url);
    const searchParams: string[] = [];
    copy.searchParams.forEach((_, key) => searchParams.push(key));
    for (const param of searchParams) {
      copy.searchParams.delete(param);
    }
    return copy.toString();
  }
}
