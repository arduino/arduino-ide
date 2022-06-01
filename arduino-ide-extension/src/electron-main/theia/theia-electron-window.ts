import { injectable } from '@theia/core/shared/inversify';
import { StopReason } from '@theia/core/lib/electron-common/messaging/electron-messages';
import { TheiaElectronWindow as DefaultTheiaElectronWindow } from '@theia/core/lib/electron-main/theia-electron-window';
import { FileUri } from '@theia/core/lib/node';
import URI from '@theia/core/lib/common/uri';

@injectable()
export class TheiaElectronWindow extends DefaultTheiaElectronWindow {
  protected async handleStopRequest(
    onSafeCallback: () => unknown,
    reason: StopReason
  ): Promise<boolean> {
    // Only confirm close to windows that have loaded our frontend.
    // Both the windows's URL and the FS path of the `index.html` should be converted to the "same" format to be able to compare them. (#11226)
    // Notes:
    //  - Windows: file:///C:/path/to/somewhere vs file:///c%3A/path/to/somewhere
    //  - macOS: file:///Applications/App%20Name.app/Contents vs /Applications/App Name.app/Contents
    // This URL string comes from electron, we can expect that this is properly encoded URL. For example, a space is `%20`
    const currentUrl = new URI(this.window.webContents.getURL()).toString();
    // THEIA_FRONTEND_HTML_PATH is an FS path, we have to covert to an encoded URI string.
    const frontendUri = FileUri.create(
      this.globals.THEIA_FRONTEND_HTML_PATH
    ).toString();
    const safeToClose =
      !currentUrl.includes(frontendUri) || (await this.checkSafeToStop(reason));
    if (safeToClose) {
      try {
        await onSafeCallback();
        return true;
      } catch (e) {
        console.warn(`Request ${StopReason[reason]} failed.`, e);
      }
    }
    return false;
  }
}
