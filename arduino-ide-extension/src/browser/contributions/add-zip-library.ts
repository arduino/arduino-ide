import { inject, injectable } from 'inversify';
import { remote } from 'electron';
import URI from '@theia/core/lib/common/uri';
import { ConfirmDialog } from '@theia/core/lib/browser/dialogs';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { ArduinoMenus } from '../menu/arduino-menus';
import { ResponseServiceImpl } from '../response-service-impl';
import { Installable, LibraryService } from '../../common/protocol';
import { SketchContribution, Command, CommandRegistry, MenuModelRegistry } from './contribution';

@injectable()
export class AddZipLibrary extends SketchContribution {

    @inject(EnvVariablesServer)
    protected readonly envVariableServer: EnvVariablesServer;

    @inject(ResponseServiceImpl)
    protected readonly responseService: ResponseServiceImpl;

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
            try {
                await this.doInstall(zipUri);
            } catch (error) {
                if (error instanceof AlreadyInstalledError) {
                    const result = await new ConfirmDialog({
                        msg: error.message,
                        title: 'Do you want to overwrite the existing library?',
                        ok: 'Yes',
                        cancel: 'No'
                    }).open();
                    if (result) {
                        await this.doInstall(zipUri, true);
                    }
                }
            }
        }
    }

    private async doInstall(zipUri: string, overwrite?: boolean): Promise<void> {
        try {
            await Installable.doWithProgress({
                messageService: this.messageService,
                progressText: `Processing ${new URI(zipUri).path.base}`,
                responseService: this.responseService,
                run: () => this.libraryService.installZip({ zipUri, overwrite })
            });
            this.messageService.info(`Successfully installed library from ${new URI(zipUri).path.base} archive`, { timeout: 3000 });
        } catch (error) {
            if (error instanceof Error) {
                const match = error.message.match(/library (.*?) already installed/);
                if (match && match.length >= 2) {
                    const name = match[1].trim();
                    if (name) {
                        throw new AlreadyInstalledError(`A library folder named ${name} already exists. Do you want to overwrite it?`, name);
                    } else {
                        throw new AlreadyInstalledError('A library already exists. Do you want to overwrite it?');
                    }
                }
            }
            this.messageService.error(error.toString());
            throw error;
        }
    }

}

class AlreadyInstalledError extends Error {

    constructor(message: string, readonly libraryName?: string) {
        super(message);
        Object.setPrototypeOf(this, AlreadyInstalledError.prototype);
    }

}

export namespace AddZipLibrary {
    export namespace Commands {
        export const ADD_ZIP_LIBRARY: Command = {
            id: 'arduino-add-zip-library'
        };
    }
}
