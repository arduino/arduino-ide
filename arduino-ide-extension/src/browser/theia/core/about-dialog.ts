import { AboutDialog as TheiaAboutDialog } from '@theia/core/lib/browser/about-dialog';
import { duration } from '../../../common/decorators';

export class AboutDialog extends TheiaAboutDialog {
  @duration({ name: 'theia-about#init' })
  protected override async init(): Promise<void> {
    // NOOP
    // IDE2 has a custom about dialog, so it does not make sense to collect Theia extensions at startup time.
  }
}
