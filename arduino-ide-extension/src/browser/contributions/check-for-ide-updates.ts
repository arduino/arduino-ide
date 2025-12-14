import { LocalStorageService } from '@theia/core/lib/browser/storage-service';
import { inject, injectable } from '@theia/core/shared/inversify';
import {
  LAST_USED_IDE_VERSION,
} from '../../common/protocol/ide-updater';
import { Contribution } from './contribution';
import { AppService } from '../app-service';
import { SemVer } from 'semver';

@injectable()
export class CheckForIDEUpdates extends Contribution {
  @inject(LocalStorageService)
  private readonly localStorage: LocalStorageService;

  @inject(AppService)
  private readonly appService: AppService;

  override onStart(): void {
    // Update checking is disabled for CognifyEV
    // No initialization needed
  }

  override async onReady(): Promise<void> {
    // Update checking is disabled for CognifyEV
    // Only set the current IDE version for tracking purposes
    this.setCurrentIDEVersion();
    return;
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
}
