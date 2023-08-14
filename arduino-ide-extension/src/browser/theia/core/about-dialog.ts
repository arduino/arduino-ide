import { AboutDialog as TheiaAboutDialog } from '@theia/core/lib/browser/about-dialog';

export class AboutDialog extends TheiaAboutDialog {
  protected override init(): void {
    // NOOP
    // IDE2 has a custom about dialog, so it does not make sense to collect Theia extensions at startup time.
  }
}
