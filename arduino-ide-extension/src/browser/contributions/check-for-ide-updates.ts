import { nls } from '@theia/core/lib/common/nls';
import { LocalStorageService } from '@theia/core/lib/browser/storage-service';
import { inject, injectable } from '@theia/core/shared/inversify';
import {
  IDEUpdater,
  LAST_USED_IDE_VERSION,
  SKIP_IDE_VERSION,
} from '../../common/protocol/ide-updater';
import { IDEUpdaterDialog } from '../dialogs/ide-updater/ide-updater-dialog';
import { Contribution } from './contribution';
import { VersionWelcomeDialog } from '../dialogs/version-welcome-dialog';
import { AppService } from '../app-service';
import { SemVer } from 'semver';

@injectable()
export class CheckForIDEUpdates extends Contribution {
  @inject(IDEUpdater)
  private readonly updater: IDEUpdater;

  @inject(IDEUpdaterDialog)
  private readonly updaterDialog: IDEUpdaterDialog;

  @inject(VersionWelcomeDialog)
  private readonly versionWelcomeDialog: VersionWelcomeDialog;

  @inject(LocalStorageService)
  private readonly localStorage: LocalStorageService;

  @inject(AppService)
  private readonly appService: AppService;

  override onStart(): void {
    this.preferences.onPreferenceChanged(
      ({ preferenceName, newValue, oldValue }) => {
        if (newValue !== oldValue) {
          switch (preferenceName) {
            case 'arduino.ide.updateChannel':
            case 'arduino.ide.updateBaseUrl':
              this.updater.init(
                this.preferences.get('arduino.ide.updateChannel'),
                this.preferences.get('arduino.ide.updateBaseUrl')
              );
          }
        }
      }
    );
  }

  override async onReady(): Promise<void> {
    this.updater
      .init(
        this.preferences.get('arduino.ide.updateChannel'),
        this.preferences.get('arduino.ide.updateBaseUrl')
      )
      .then(() => {
        if (!this.preferences['arduino.checkForUpdates']) {
          return;
        }
        return this.updater.checkForUpdates(true);
      })
      .then(async (updateInfo) => {
        if (!updateInfo) {
          const isNewVersion = await this.isNewStableVersion();
          if (isNewVersion) {
            this.versionWelcomeDialog.open();
          }
          return;
        }
        const versionToSkip = await this.localStorage.getData<string>(
          SKIP_IDE_VERSION
        );
        if (versionToSkip === updateInfo.version) return;
        this.updaterDialog.open(true, updateInfo);
      })
      .catch((e) => {
        this.messageService.error(
          nls.localize(
            'arduino/ide-updater/errorCheckingForUpdates',
            'Error while checking for Arduino IDE updates.\n{0}',
            e.message
          )
        );
      })
      .finally(() => {
        this.setCurrentIDEVersion();
      });
  }

  private async setCurrentIDEVersion(): Promise<void> {
    try {
      const { appVersion } = await this.appService.info();
      const currSemVer = new SemVer(appVersion ?? '');
      this.localStorage.setData(LAST_USED_IDE_VERSION, currSemVer.format());
    } catch {
      // ignore invalid versions
    }
  }

  /**
   * Check if user is running a new IDE version for the first time.
   * @returns true if the current IDE version is greater than the last used version
   * and both are non-prerelease versions.
   */
  private async isNewStableVersion(): Promise<boolean> {
    try {
      const { appVersion } = await this.appService.info();
      const prevVersion = await this.localStorage.getData<string>(
        LAST_USED_IDE_VERSION
      );

      const prevSemVer = new SemVer(prevVersion ?? '');
      const currSemVer = new SemVer(appVersion ?? '');

      if (prevSemVer.prerelease.length || currSemVer.prerelease.length) {
        return false;
      }

      return currSemVer.compare(prevSemVer) === 1;
    } catch (e) {
      return false;
    }
  }
}
