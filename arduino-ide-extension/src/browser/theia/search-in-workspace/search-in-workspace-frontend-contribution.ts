import { injectable } from 'inversify';
import { MenuModelRegistry } from '@theia/core/lib/common/menu';
import { KeybindingRegistry } from '@theia/core/lib/browser/keybinding';
import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { SearchInWorkspaceFrontendContribution as TheiaSearchInWorkspaceFrontendContribution, SearchInWorkspaceCommands } from '@theia/search-in-workspace/lib/browser/search-in-workspace-frontend-contribution';

@injectable()
export class SearchInWorkspaceFrontendContribution extends TheiaSearchInWorkspaceFrontendContribution {

    async initializeLayout(app: FrontendApplication): Promise<void> {
        // NOOP
    }

    registerMenus(registry: MenuModelRegistry): void {
        super.registerMenus(registry);
        registry.unregisterMenuAction(SearchInWorkspaceCommands.OPEN_SIW_WIDGET);
    }

    registerKeybindings(keybindings: KeybindingRegistry): void {
        super.registerKeybindings(keybindings);
        keybindings.unregisterKeybinding(SearchInWorkspaceCommands.OPEN_SIW_WIDGET);
    }

}
