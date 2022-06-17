import { injectable } from '@theia/core/shared/inversify';
import * as remote from '@theia/core/electron-shared/@electron/remote';
import * as dateFormat from 'dateformat';
import URI from '@theia/core/lib/common/uri';
import { ArduinoMenus } from '../menu/arduino-menus';
import {
  SketchContribution,
  Command,
  CommandRegistry,
  MenuModelRegistry,
} from './contribution';
import { nls } from '@theia/core/lib/common';
import { CurrentSketch } from '../../common/protocol/sketches-service-client-impl';

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

  protected async archiveSketch(): Promise<void> {
    const [sketch, config] = await Promise.all([
      this.sketchServiceClient.currentSketch(),
      this.configService.getConfiguration(),
    ]);
    if (!CurrentSketch.isValid(sketch)) {
      return;
    }
    const archiveBasename = `${sketch.name}-${dateFormat(
      new Date(),
      'yymmdd'
    )}a.zip`;
    const defaultPath = await this.fileService.fsPath(
      new URI(config.sketchDirUri).resolve(archiveBasename)
    );
    const { filePath, canceled } = await remote.dialog.showSaveDialog({
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
    await this.sketchService.archive(sketch, destinationUri.toString());
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
