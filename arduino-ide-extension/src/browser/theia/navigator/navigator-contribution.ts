import { injectable } from 'inversify';
import { WorkspaceCommands } from '@theia/workspace/lib/browser/workspace-commands';
import { KeybindingRegistry } from '@theia/core/lib/browser/keybinding';
import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { FileNavigatorContribution as TheiaFileNavigatorContribution } from '@theia/navigator/lib/browser/navigator-contribution';

@injectable()
export class FileNavigatorContribution extends TheiaFileNavigatorContribution {

    async initializeLayout(app: FrontendApplication): Promise<void> {
        // NOOP
    }

    registerKeybindings(registry: KeybindingRegistry): void {
        super.registerKeybindings(registry);
        [
            WorkspaceCommands.FILE_RENAME,
            WorkspaceCommands.FILE_DELETE
        ].forEach(registry.unregisterKeybinding.bind(registry));
    }

}
