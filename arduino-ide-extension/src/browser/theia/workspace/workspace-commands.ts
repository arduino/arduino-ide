import { injectable } from 'inversify';
import URI from '@theia/core/lib/common/uri';
import { open } from '@theia/core/lib/browser/opener-service';
import { FileStat } from '@theia/filesystem/lib/common';
import { CommandRegistry } from '@theia/core/lib/common/command';
import { WorkspaceCommandContribution as TheiaWorkspaceCommandContribution, WorkspaceCommands } from '@theia/workspace/lib/browser/workspace-commands';
import { Extensions } from '../../../common/protocol';
import { WorkspaceInputDialog } from './workspace-input-dialog';

@injectable()
export class WorkspaceCommandContribution extends TheiaWorkspaceCommandContribution {

    registerCommands(registry: CommandRegistry): void {
        super.registerCommands(registry);
        registry.unregisterCommand(WorkspaceCommands.NEW_FILE);
        registry.registerCommand(WorkspaceCommands.NEW_FILE, this.newWorkspaceRootUriAwareCommandHandler({
            execute: uri => this.newFile(uri)
        }));
    }

    protected async newFile(uri: URI | undefined): Promise<void> {
        if (!uri) {
            return;
        }
        const parent = await this.getDirectory(uri);
        if (!parent) {
            return;
        }

        const parentUri = new URI(parent.uri);
        const dialog = new WorkspaceInputDialog({
            title: 'Name for new file',
            parentUri,
            validate: name => this.validateFileName(name, parent, true)
        }, this.labelProvider);

        const name = await dialog.open();
        const nameWithExt = this.appendInoExtensionMaybe(name);
        if (nameWithExt) {
            const fileUri = parentUri.resolve(nameWithExt);
            await this.fileSystem.createFile(fileUri.toString());
            this.fireCreateNewFile({ parent: parentUri, uri: fileUri });
            open(this.openerService, fileUri);
        }
    }

    protected async validateFileName(name: string, parent: FileStat, recursive: boolean = false): Promise<string> {
        // In the Java IDE the followings are the rules:
        //  - `name` without an extension should default to `name.ino`.
        //  - `name` with a single trailing `.` also defaults to `name.ino`.
        const nameWithExt = this.appendInoExtensionMaybe(name);
        const errorMessage = await super.validateFileName(nameWithExt, parent, recursive);
        if (errorMessage) {
            return errorMessage;
        }

        const extension = nameWithExt.split('.').pop();
        if (!extension) {
            return 'Invalid file extension.';
        }
        if (Extensions.ALL.indexOf(`.${extension}`) === -1) {
            return `.${extension} is not a valid extension.`;
        }
        return '';
    }

    protected appendInoExtensionMaybe(name: string | undefined): string {
        if (!name) {
            return '';
        }
        if (name.trim().length) {
            if (name.indexOf('.') === -1) {
                return `${name}.ino`
            }
            if (name.indexOf('.') === name.length - 1) {
                return `${name.slice(0, -1)}.ino`
            }
        }
        return name;
    }
}
