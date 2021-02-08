import { injectable } from 'inversify';
import { ScmContribution as TheiaScmContribution } from '@theia/scm/lib/browser/scm-contribution';
import { StatusBarEntry } from '@theia/core/lib/browser/status-bar/status-bar';

@injectable()
export class ScmContribution extends TheiaScmContribution {

    async initializeLayout(): Promise<void> {
        // NOOP
    }

    protected setStatusBarEntry(id: string, entry: StatusBarEntry): void {
        // NOOP
    }

}
