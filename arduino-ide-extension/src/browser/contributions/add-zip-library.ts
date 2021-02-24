import { inject, injectable } from 'inversify';
import { remote } from 'electron';
import { ArduinoMenus } from '../menu/arduino-menus';
import { SketchContribution, Command, CommandRegistry, MenuModelRegistry } from './contribution';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import URI from '@theia/core/lib/common/uri';
import { InstallationProgressDialog } from '../widgets/progress-dialog';
import { LibraryService } from '../../common/protocol';

@injectable()
export class AddZipLibrary extends SketchContribution {

    @inject(EnvVariablesServer)
    protected readonly envVariableServer: EnvVariablesServer;

    @inject(LibraryService)
    protected readonly libraryService: LibraryService;

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(AddZipLibrary.Commands.ADD_ZIP_LIBRARY, {
            execute: () => this.addZipLibrary()
        });
    }

    registerMenus(registry: MenuModelRegistry): void {
        const includeLibMenuPath = [...ArduinoMenus.SKETCH__UTILS_GROUP, '0_include'];
        // TODO: do we need it? calling `registerSubmenu` multiple times is noop, so it does not hurt.
        registry.registerSubmenu(includeLibMenuPath, 'Include Library', { order: '1' });
        registry.registerMenuAction([...includeLibMenuPath, '1_install'], {
            commandId: AddZipLibrary.Commands.ADD_ZIP_LIBRARY.id,
            label: 'Add .ZIP Library...',
            order: '1'
        });
    }

    async addZipLibrary(): Promise<void> {
        const homeUri = await this.envVariableServer.getHomeDirUri();
        const defaultPath = await this.fileService.fsPath(new URI(homeUri));
        const { canceled, filePaths } = await remote.dialog.showOpenDialog({
            title: "Select a zip file containing the library you'd like to add",
            defaultPath,
            properties: ['openFile'],
            filters: [
                {
                    name: 'Library',
                    extensions: ['zip']
                }
            ]
        });
        if (!canceled && filePaths.length) {
            const zipUri = await this.fileSystemExt.getUri(filePaths[0]);
            const dialog = new InstallationProgressDialog('Installing library', 'zip');
            try {
                this.outputChannelManager.getChannel('Arduino').clear();
                dialog.open();
                await this.libraryService.installZip({ zipUri });
            } catch (e) {
                this.messageService.error(e.toString());
            } finally {
                dialog.close();
            }
        }
    }

}

export namespace AddZipLibrary {
    export namespace Commands {
        export const ADD_ZIP_LIBRARY: Command = {
            id: 'arduino-add-zip-library'
        };
    }
}
