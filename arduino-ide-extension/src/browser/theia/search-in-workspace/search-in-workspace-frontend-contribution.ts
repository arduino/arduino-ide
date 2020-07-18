import { inject, injectable } from 'inversify';
import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { SearchInWorkspaceFrontendContribution as TheiaSearchInWorkspaceFrontendContribution, SearchInWorkspaceCommands } from '@theia/search-in-workspace/lib/browser/search-in-workspace-frontend-contribution';
import { EditorMode } from '../../editor-mode';
import { MenuModelRegistry } from '@theia/core';

@injectable()
export class SearchInWorkspaceFrontendContribution extends TheiaSearchInWorkspaceFrontendContribution {

    @inject(EditorMode)
    protected readonly editorMode: EditorMode;

    async initializeLayout(app: FrontendApplication): Promise<void> {
        if (this.editorMode.proMode) {
            return super.initializeLayout(app);
        }
    }

    registerMenus(registry: MenuModelRegistry): void {
        super.registerMenus(registry);
        registry.unregisterMenuAction(SearchInWorkspaceCommands.OPEN_SIW_WIDGET);
    }

}
