import { inject, injectable } from 'inversify';
import { ScmContribution as TheiaScmContribution } from '@theia/scm/lib/browser/scm-contribution';
import { StatusBarEntry } from '@theia/core/lib/browser/status-bar/status-bar';
import { EditorMode } from '../../editor-mode';

@injectable()
export class ScmContribution extends TheiaScmContribution {

    @inject(EditorMode)
    protected readonly editorMode: EditorMode;

    async initializeLayout(): Promise<void> {
        if (this.editorMode.proMode) {
            return super.initializeLayout();
        }
    }

    protected setStatusBarEntry(id: string, entry: StatusBarEntry): void {
        if (this.editorMode.proMode) {
            super.setStatusBarEntry(id, entry);
        }
    }

}
