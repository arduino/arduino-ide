import { inject, injectable } from 'inversify';
import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { SearchInWorkspaceFrontendContribution } from '@theia/search-in-workspace/lib/browser/search-in-workspace-frontend-contribution';
import { EditorMode } from '../editor-mode';

@injectable()
export class ArduinoSearchInWorkspaceContribution extends SearchInWorkspaceFrontendContribution {

    @inject(EditorMode)
    protected readonly editorMode: EditorMode;

    async initializeLayout(app: FrontendApplication): Promise<void> {
        if (this.editorMode.proMode) {
            return super.initializeLayout(app);
        }
    }

}
