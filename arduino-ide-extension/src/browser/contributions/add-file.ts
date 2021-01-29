import { inject, injectable } from 'inversify';
import { remote } from 'electron';
import { ArduinoMenus } from '../menu/arduino-menus';
import { SketchContribution, Command, CommandRegistry, MenuModelRegistry, URI } from './contribution';
import { FileDialogService } from '@theia/filesystem/lib/browser';

@injectable()
export class AddFile extends SketchContribution {

    @inject(FileDialogService)
    protected readonly fileDialogService: FileDialogService;

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(AddFile.Commands.ADD_FILE, {
            execute: () => this.addFile()
        });
    }

    registerMenus(registry: MenuModelRegistry): void {
        registry.registerMenuAction(ArduinoMenus.SKETCH__UTILS_GROUP, {
            commandId: AddFile.Commands.ADD_FILE.id,
            label: 'Add File...',
            order: '2'
        });
    }

    protected async addFile(): Promise<void> {
        const sketch = await this.sketchServiceClient.currentSketch();
        if (!sketch) {
            return;
        }
        const toAddUri = await this.fileDialogService.showOpenDialog({
            title: 'Add File',
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false
        });
        if (!toAddUri) {
            return;
        }
        const sketchUri = new URI(sketch.uri);
        const filename = toAddUri.path.base;
        const targetUri = sketchUri.resolve('data').resolve(filename);
        const exists = await this.fileService.exists(targetUri);
        if (exists) {
            const { response } = await remote.dialog.showMessageBox({
                type: 'question',
                title: 'Replace',
                buttons: ['Cancel', 'OK'],
                message: `Replace the existing version of ${filename}?`
            });
            if (response === 0) { // Cancel
                return;
            }
        }
        await this.fileService.copy(toAddUri, targetUri, { overwrite: true });
        this.messageService.info('One file added to the sketch.', { timeout: 2000 });
    }

}

export namespace AddFile {
    export namespace Commands {
        export const ADD_FILE: Command = {
            id: 'arduino-add-file'
        };
    }
}
