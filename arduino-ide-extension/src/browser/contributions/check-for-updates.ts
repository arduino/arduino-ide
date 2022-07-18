import { nls } from '@theia/core/lib/common/nls';
import { LocalStorageService } from '@theia/core/lib/browser/storage-service';
import { inject, injectable } from '@theia/core/shared/inversify';
import {
  IDEUpdater,
  SKIP_IDE_VERSION,
} from '../../common/protocol/ide-updater';
import { IDEUpdaterDialog } from '../dialogs/ide-updater/ide-updater-dialog';
import { Contribution } from './contribution';

@injectable()
export class CheckForUpdates extends Contribution {
  @inject(IDEUpdater)
  private readonly updater: IDEUpdater;

  @inject(IDEUpdaterDialog)
  private readonly updaterDialog: IDEUpdaterDialog;

  @inject(LocalStorageService)
  private readonly localStorage: LocalStorageService;

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

  override onReady(): void {
    this.updater
      .init(
        this.preferences.get('arduino.ide.updateChannel'),
        this.preferences.get('arduino.ide.updateBaseUrl')
      )
      .then(() => this.updater.checkForUpdates(true))
      .then(async (updateInfo) => {
        if (!updateInfo) return;
        const versionToSkip = await this.localStorage.getData<string>(
          SKIP_IDE_VERSION
        );
        if (versionToSkip === updateInfo.version) return;
        this.updaterDialog.open(updateInfo);
      })
      .catch((e) => {
        this.messageService.error(
          nls.localize(
            'arduino/ide-updater/errorCheckingForUpdates',
            'Error while checking for Arduino IDE updates.\n{0}',
            e.message
          )
        );
      });
  }
}
