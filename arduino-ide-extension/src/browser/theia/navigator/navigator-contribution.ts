import { inject, injectable } from 'inversify';
import { WorkspaceCommands } from '@theia/workspace/lib/browser/workspace-commands';
import { KeybindingRegistry } from '@theia/core/lib/browser/keybinding';
import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { FileNavigatorContribution as TheiaFileNavigatorContribution } from '@theia/navigator/lib/browser/navigator-contribution';
import { FileNavigatorPreferences } from '@theia/navigator/lib/browser/navigator-preferences';
import { OpenerService } from '@theia/core/lib/browser/opener-service';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import { FileNavigatorFilter } from '@theia/navigator/lib/browser/navigator-filter';
import { WorkspacePreferences } from '@theia/workspace/lib/browser/workspace-preferences';

@injectable()
export class FileNavigatorContribution extends TheiaFileNavigatorContribution {

    constructor(
        @inject(FileNavigatorPreferences) protected readonly fileNavigatorPreferences: FileNavigatorPreferences,
        @inject(OpenerService) protected readonly openerService: OpenerService,
        @inject(FileNavigatorFilter) protected readonly fileNavigatorFilter: FileNavigatorFilter,
        @inject(WorkspaceService) protected readonly workspaceService: WorkspaceService,
        @inject(WorkspacePreferences) protected readonly workspacePreferences: WorkspacePreferences
    ) {
        super(fileNavigatorPreferences, openerService, fileNavigatorFilter, workspaceService, workspacePreferences);
        this.options.defaultWidgetOptions.rank = 1;
    }

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
