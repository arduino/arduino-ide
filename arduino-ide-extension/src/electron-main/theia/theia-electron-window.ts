import { injectable } from '@theia/core/shared/inversify';
import { isWindows } from '@theia/core/lib/common/os';
import { StopReason } from '@theia/core/lib/electron-common/messaging/electron-messages';
import { TheiaElectronWindow as DefaultTheiaElectronWindow } from '@theia/core/lib/electron-main/theia-electron-window';
import { FileUri } from '@theia/core/lib/node';

@injectable()
export class TheiaElectronWindow extends DefaultTheiaElectronWindow {
  protected async handleStopRequest(
    onSafeCallback: () => unknown,
    reason: StopReason
  ): Promise<boolean> {
    // Only confirm close to windows that have loaded our front end.
    let currentUrl = this.window.webContents.getURL(); // this comes from electron, expected to be an URL encoded string. e.g: space will be `%20`
    let frontendUri = FileUri.create(
      this.globals.THEIA_FRONTEND_HTML_PATH
    ).toString(false); // Map the FS path to an URI, ensure the encoding is not skipped, so that a space will be `%20`.
    // Since our resolved frontend HTML path might contain backward slashes on Windows, we normalize everything first.
    if (isWindows) {
      currentUrl = currentUrl.replace(/\\/g, '/');
      frontendUri = frontendUri.replace(/\\/g, '/');
    }
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
