import { injectable } from 'inversify';
import { remote } from 'electron';
import * as dateFormat from 'dateformat';
import URI from '@theia/core/lib/common/uri';
import { ArduinoMenus } from '../menu/arduino-menus';
import { SketchContribution, Command, CommandRegistry, MenuModelRegistry } from './contribution';

@injectable()
export class ArchiveSketch extends SketchContribution {

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(ArchiveSketch.Commands.ARCHIVE_SKETCH, {
            execute: () => this.archiveSketch()
        });
    }

    registerMenus(registry: MenuModelRegistry): void {
        registry.registerMenuAction(ArduinoMenus.TOOLS__MAIN_GROUP, {
            commandId: ArchiveSketch.Commands.ARCHIVE_SKETCH.id,
            label: 'Archive Sketch',
            order: '1'
        });
    }

    protected async archiveSketch(): Promise<void> {
        const [sketch, config] = await Promise.all([
            this.sketchServiceClient.currentSketch(),
            this.configService.getConfiguration()
        ]);
        if (!sketch) {
            return;
        }
        const archiveBasename = `${sketch.name}-${dateFormat(new Date(), 'yymmdd')}a.zip`;
        const defaultPath = await this.fileService.fsPath(new URI(config.sketchDirUri).resolve(archiveBasename));
        const { filePath, canceled } = await remote.dialog.showSaveDialog({ title: 'Save sketch folder as...', defaultPath });
        if (!filePath || canceled) {
            return;
        }
        const destinationUri = await this.fileSystemExt.getUri(filePath);
        if (!destinationUri) {
            return;
        }
        await this.sketchService.archive(sketch, destinationUri.toString());
        this.messageService.info(`Created archive '${archiveBasename}'.`, { timeout: 2000 });
    }

}

export namespace ArchiveSketch {
    export namespace Commands {
        export const ARCHIVE_SKETCH: Command = {
            id: 'arduino-archive-sketch'
        };
    }
}
