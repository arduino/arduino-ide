import { LocalStorageService } from '@theia/core/lib/browser/storage-service';
import { inject, injectable } from '@theia/core/shared/inversify';
import {
  IDEUpdater,
  SKIP_IDE_VERSION,
} from '../../common/protocol/ide-updater';
import { Contribution } from './contribution';
import { ResponseService } from '../../common/protocol';
import { IDEUpdaterDialog } from '../dialogs/ide-updater/ide-updater-dialog';
import { nls } from '@theia/core/lib/common/nls';

@injectable()
export class CheckForIDEUpdates extends Contribution {
  @inject(IDEUpdater)
  private readonly updater: IDEUpdater;

  @inject(IDEUpdaterDialog)
  private readonly updaterDialog: IDEUpdaterDialog;

  @inject(LocalStorageService)
  private readonly localStorage: LocalStorageService;

  @inject(ResponseService)
  private readonly responseService: ResponseService;

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
      .then(() => {
        if (!this.preferences['arduino.checkForUpdates']) {
          return;
        }
        return this.updater.checkForUpdates(true);
      })
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
            '检查lingzhilab IDE更新时出错。\n{0}',
            e.message
          )
        );
        const chunk = `${e.message}\n$`;
        this.responseService.appendToOutput({ chunk });
      });
  }
}
