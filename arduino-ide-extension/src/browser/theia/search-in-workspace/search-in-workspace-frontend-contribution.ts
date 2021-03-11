import { injectable } from 'inversify';
import { MenuModelRegistry } from '@theia/core/lib/common/menu';
import { KeybindingRegistry } from '@theia/core/lib/browser/keybinding';
import { SearchInWorkspaceFrontendContribution as TheiaSearchInWorkspaceFrontendContribution, SearchInWorkspaceCommands } from '@theia/search-in-workspace/lib/browser/search-in-workspace-frontend-contribution';

@injectable()
export class SearchInWorkspaceFrontendContribution extends TheiaSearchInWorkspaceFrontendContribution {

    constructor() {
        super();
        this.options.defaultWidgetOptions.rank = 5;
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
