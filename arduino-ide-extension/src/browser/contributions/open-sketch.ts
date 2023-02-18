import * as remote from '@theia/core/electron-shared/@electron/remote';
import { nls } from '@theia/core/lib/common/nls';
import { injectable } from '@theia/core/shared/inversify';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { LabelProvider } from '@theia/core/lib/browser/label-provider';
import {
  SketchesError,
  SketchesService,
  SketchRef,
} from '../../common/protocol';
import { ArduinoMenus } from '../menu/arduino-menus';
import {
  Command,
  CommandRegistry,
  KeybindingRegistry,
  MenuModelRegistry,
  Sketch,
  SketchContribution,
  URI,
} from './contribution';

export type SketchLocation = string | URI | SketchRef;
export namespace SketchLocation {
  export function toUri(location: SketchLocation): URI {
    if (typeof location === 'string') {
      return new URI(location);
    } else if (SketchRef.is(location)) {
      return toUri(location.uri);
    } else {
      return location;
    }
  }
  export function is(arg: unknown): arg is SketchLocation {
    return typeof arg === 'string' || arg instanceof URI || SketchRef.is(arg);
  }
}

@injectable()
export class OpenSketch extends SketchContribution {
  override registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(OpenSketch.Commands.OPEN_SKETCH, {
      execute: async (arg) => {
        const toOpen = !SketchLocation.is(arg)
          ? await this.selectSketch()
          : arg;
        if (toOpen) {
          return this.openSketch(toOpen);
        }
      },
    });
  }

  override registerMenus(registry: MenuModelRegistry): void {
    registry.registerMenuAction(ArduinoMenus.FILE__SKETCH_GROUP, {
      commandId: OpenSketch.Commands.OPEN_SKETCH.id,
      label: nls.localize('vscode/workspaceActions/openFileFolder', 'Open...'),
      order: '2',
    });
  }

  override registerKeybindings(registry: KeybindingRegistry): void {
    registry.registerKeybinding({
      command: OpenSketch.Commands.OPEN_SKETCH.id,
      keybinding: 'CtrlCmd+O',
    });
  }

  private async openSketch(toOpen: SketchLocation | undefined): Promise<void> {
    if (!toOpen) {
      return;
    }
    const uri = SketchLocation.toUri(toOpen);
    try {
      await this.sketchesService.loadSketch(uri.toString());
    } catch (err) {
      if (SketchesError.NotFound.is(err)) {
        this.messageService.error(err.message);
      }
      throw err;
    }
    this.workspaceService.open(uri);
  }

  private async selectSketch(): Promise<Sketch | undefined> {
    const defaultPath = await this.defaultPath();
    const { filePaths } = await remote.dialog.showOpenDialog(
      remote.getCurrentWindow(),
      {
        defaultPath,
        properties: ['createDirectory', 'openFile'],
        filters: [
          {
            name: nls.localize('arduino/sketch/sketch', 'Sketch'),
            extensions: ['ino', 'pde'],
          },
        ],
      }
    );
    if (!filePaths.length) {
      return undefined;
    }
    if (filePaths.length > 1) {
      this.logger.warn(
        `Multiple sketches were selected: ${filePaths}. Using the first one.`
      );
    }
    const sketchFilePath = filePaths[0];
    const sketchFileUri = await this.fileSystemExt.getUri(sketchFilePath);
    const sketch = await this.sketchesService.getSketchFolder(sketchFileUri);
    if (sketch) {
      return sketch;
    }
    if (Sketch.isSketchFile(sketchFileUri)) {
      return promptMoveSketch(sketchFileUri, {
        fileService: this.fileService,
        sketchesService: this.sketchesService,
        labelProvider: this.labelProvider,
      });
    }
  }
}

export namespace OpenSketch {
  export namespace Commands {
    export const OPEN_SKETCH: Command = {
      id: 'arduino-open-sketch',
    };
  }
}

export async function promptMoveSketch(
  sketchFileUri: string | URI,
  options: {
    fileService: FileService;
    sketchesService: SketchesService;
    labelProvider: LabelProvider;
  }
): Promise<Sketch | undefined> {
  const { fileService, sketchesService, labelProvider } = options;
  const uri =
    sketchFileUri instanceof URI ? sketchFileUri : new URI(sketchFileUri);
  const name = uri.path.name;
  const nameWithExt = labelProvider.getName(uri);
  const { response } = await remote.dialog.showMessageBox({
    title: nls.localize('arduino/sketch/moving', 'Moving'),
    type: 'question',
    buttons: [
      nls.localize('vscode/issueMainService/cancel', 'Cancel'),
      nls.localize('vscode/issueMainService/ok', 'OK'),
    ],
    message: nls.localize(
      'arduino/sketch/movingMsg',
      'The file "{0}" needs to be inside a sketch folder named "{1}".\nCreate this folder, move the file, and continue?',
      nameWithExt,
      name
    ),
  });
  if (response === 1) {
    // OK
    const newSketchUri = uri.parent.resolve(name);
    const exists = await fileService.exists(newSketchUri);
    if (exists) {
      await remote.dialog.showMessageBox({
        type: 'error',
        title: nls.localize('vscode/dialog/dialogErrorMessage', 'Error'),
        message: nls.localize(
          'arduino/sketch/cantOpen',
          'A folder named "{0}" already exists. Can\'t open sketch.',
          name
        ),
      });
      return undefined;
    }
    await fileService.createFolder(newSketchUri);
    await fileService.move(
      uri,
      new URI(newSketchUri.resolve(nameWithExt).toString())
    );
    return sketchesService.getSketchFolder(newSketchUri.toString());
  }
}
