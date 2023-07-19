import { injectable } from '@theia/core/shared/inversify';
import dateFormat from 'dateformat';
import { ArduinoMenus } from '../menu/arduino-menus';
import {
  SketchContribution,
  Command,
  CommandRegistry,
  MenuModelRegistry,
} from './contribution';
import { nls } from '@theia/core/lib/common';
import { CurrentSketch } from '../sketches-service-client-impl';

@injectable()
export class ArchiveSketch extends SketchContribution {
  override registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(ArchiveSketch.Commands.ARCHIVE_SKETCH, {
      execute: () => this.archiveSketch(),
    });
  }

  override registerMenus(registry: MenuModelRegistry): void {
    registry.registerMenuAction(ArduinoMenus.TOOLS__MAIN_GROUP, {
      commandId: ArchiveSketch.Commands.ARCHIVE_SKETCH.id,
      label: nls.localize('arduino/sketch/archiveSketch', 'Archive Sketch'),
      order: '1',
    });
  }

  private async archiveSketch(): Promise<void> {
    const sketch = await this.sketchServiceClient.currentSketch();
    if (!CurrentSketch.isValid(sketch)) {
      return;
    }
    const archiveBasename = `${sketch.name}-${dateFormat(
      new Date(),
      'yymmdd'
    )}a.zip`;
    const defaultContainerUri = await this.defaultUri();
    const defaultUri = defaultContainerUri.resolve(archiveBasename);
    const defaultPath = await this.fileService.fsPath(defaultUri);
    const { filePath, canceled } = await this.dialogService.showSaveDialog({
      title: nls.localize(
        'arduino/sketch/saveSketchAs',
        'Save sketch folder as...'
      ),
      defaultPath,
    });
    if (!filePath || canceled) {
      return;
    }
    const destinationUri = await this.fileSystemExt.getUri(filePath);
    if (!destinationUri) {
      return;
    }
    await this.sketchesService.archive(sketch, destinationUri.toString());
    this.messageService.info(
      nls.localize(
        'arduino/sketch/createdArchive',
        "Created archive '{0}'.",
        archiveBasename
      ),
      {
        timeout: 2000,
      }
    );
  }
}

export namespace ArchiveSketch {
  export namespace Commands {
    export const ARCHIVE_SKETCH: Command = {
      id: 'arduino-archive-sketch',
    };
  }
}
