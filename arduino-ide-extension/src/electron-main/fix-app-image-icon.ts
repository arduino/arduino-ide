import { environment } from '@theia/application-package/lib/environment';
import { isOSX, isWindows } from '@theia/core/lib/common/os';
import {
  ElectronMainApplication,
  ElectronMainApplicationContribution,
} from '@theia/core/lib/electron-main/electron-main-application';
import { injectable } from '@theia/core/shared/inversify';
import { join } from 'node:path';

// Fixes no application icon for the AppImage on Linux (https://github.com/arduino/arduino-ide/issues/131)
// The fix was based on https://github.com/eclipse-theia/theia-blueprint/pull/180.
// Upstream: https://github.com/electron-userland/electron-builder/issues/4617
@injectable()
export class FixAppImageIcon implements ElectronMainApplicationContribution {
  onStart(application: ElectronMainApplication): void {
    if (isOSX || isWindows || environment.electron.isDevMode()) {
      return;
    }
    const windowOptions = application.config.electron.windowOptions;
    if (windowOptions && windowOptions.icon === undefined) {
      windowOptions.icon = join(
        __dirname,
        '..',
        '..',
        'resources',
        'icons',
        'cognify-ide.png'
      );
    }
  }
}
