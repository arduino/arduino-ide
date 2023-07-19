import { injectable } from '@theia/core/shared/inversify';
import { ScmContribution as TheiaScmContribution } from '@theia/scm/lib/browser/scm-contribution';
import { StatusBarEntry } from '@theia/core/lib/browser/status-bar/status-bar';

@injectable()
export class ScmContribution extends TheiaScmContribution {
  override async initializeLayout(): Promise<void> {
    // NOOP
  }

  protected override setStatusBarEntry(id: string, entry: StatusBarEntry): void {
    // NOOP
  }
}
