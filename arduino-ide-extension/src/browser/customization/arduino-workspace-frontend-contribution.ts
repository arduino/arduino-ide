import { injectable } from 'inversify';
import { isOSX } from '@theia/core/lib/common/os';
import { environment } from '@theia/application-package/lib/environment';
import { CommonMenus } from '@theia/core/lib/browser';
import { CommandRegistry } from '@theia/core/lib/common/command';
import { MenuModelRegistry } from '@theia/core/lib/common/menu';
import { WorkspaceCommands } from '@theia/workspace/lib/browser/workspace-commands';
import { WorkspaceFrontendContribution } from '@theia/workspace/lib/browser/workspace-frontend-contribution';

// TODO: https://github.com/eclipse-theia/theia/issues/8175
@injectable()
export class ArduinoWorkspaceFrontendContribution extends WorkspaceFrontendContribution {

    registerCommands(registry: CommandRegistry): void {
        super.registerCommands(registry);
        registry.unregisterCommand(WorkspaceCommands.SAVE_AS);
        registry.unregisterCommand(WorkspaceCommands.OPEN_FOLDER);
    }

    registerMenus(registry: MenuModelRegistry): void {
        if (isOSX || !environment.electron.is()) {
            registry.registerMenuAction(CommonMenus.FILE_OPEN, {
                commandId: WorkspaceCommands.OPEN.id,
                order: 'a00'
            });
        }
        if (!isOSX && environment.electron.is()) {
            registry.registerMenuAction(CommonMenus.FILE_OPEN, {
                commandId: WorkspaceCommands.OPEN_FILE.id,
                label: `${WorkspaceCommands.OPEN_FILE.dialogLabel}...`,
                order: 'a01'
            });
            registry.registerMenuAction(CommonMenus.FILE_OPEN, {
                commandId: WorkspaceCommands.OPEN_FOLDER.id,
                label: `${WorkspaceCommands.OPEN_FOLDER.dialogLabel}...`,
                order: 'a02'
            });
        }
        registry.registerMenuAction(CommonMenus.FILE_OPEN, {
            commandId: WorkspaceCommands.OPEN_WORKSPACE.id,
            order: 'a10'
        });
        registry.registerMenuAction(CommonMenus.FILE_OPEN, {
            commandId: WorkspaceCommands.OPEN_RECENT_WORKSPACE.id,
            order: 'a20'
        });
        registry.registerMenuAction(CommonMenus.FILE_OPEN, {
            commandId: WorkspaceCommands.SAVE_WORKSPACE_AS.id,
            order: 'a30'
        });

        registry.registerMenuAction(CommonMenus.FILE_CLOSE, {
            commandId: WorkspaceCommands.CLOSE.id
        });

        // `Save As`
        // menus.registerMenuAction(CommonMenus.FILE_SAVE, {
        //     commandId: WorkspaceCommands.SAVE_AS.id,
        // });
    }

}
