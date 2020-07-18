import { injectable } from 'inversify';
import { CommandRegistry } from '@theia/core/lib/common/command';
import { MenuModelRegistry } from '@theia/core/lib/common/menu';
import { WorkspaceCommands, FileMenuContribution } from '@theia/workspace/lib/browser/workspace-commands';
import { WorkspaceFrontendContribution as TheiaWorkspaceFrontendContribution } from '@theia/workspace/lib/browser/workspace-frontend-contribution';

@injectable()
export class WorkspaceFrontendContribution extends TheiaWorkspaceFrontendContribution {

    registerCommands(registry: CommandRegistry): void {
        super.registerCommands(registry);
        // TODO: instead of blacklisting commands to remove, it would be more robust to whitelist the ones we want to keep
        const commands = new Set(registry.commands);
        [
            WorkspaceCommands.OPEN,
            WorkspaceCommands.OPEN_FILE,
            WorkspaceCommands.OPEN_FOLDER,
            WorkspaceCommands.OPEN_WORKSPACE,
            WorkspaceCommands.OPEN_RECENT_WORKSPACE,
            WorkspaceCommands.SAVE_WORKSPACE_AS,
            WorkspaceCommands.SAVE_AS
        ].filter(commands.has.bind(commands)).forEach(registry.unregisterCommand.bind(registry));
    }

    registerMenus(_: MenuModelRegistry): void {
        // NOOP
    }

    protected async closeWorkspace(): Promise<void> {
        // Do not ask to close the workspace, just close it. The dirty/temp state of the sketch is handled somewhere else.
        await this.workspaceService.close();
    }

}

@injectable()
export class ArduinoFileMenuContribution extends FileMenuContribution {

    registerMenus(_: MenuModelRegistry): void {
        // NOOP
    }

}
