import { inject, injectable } from 'inversify';
import * as remote from '@theia/core/electron-shared/@electron/remote';
import { ArduinoMenus } from '../menu/arduino-menus';
import {
  SketchContribution,
  Command,
  CommandRegistry,
  MenuModelRegistry,
  URI,
} from './contribution';
import { FileDialogService } from '@theia/filesystem/lib/browser';
import { nls } from '@theia/core/lib/common';

@injectable()
export class AddFile extends SketchContribution {
  @inject(FileDialogService)
  protected readonly fileDialogService: FileDialogService;

  registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(AddFile.Commands.ADD_FILE, {
      execute: () => this.addFile(),
    });
  }

  registerMenus(registry: MenuModelRegistry): void {
    registry.registerMenuAction(ArduinoMenus.SKETCH__UTILS_GROUP, {
      commandId: AddFile.Commands.ADD_FILE.id,
      label: nls.localize('arduino/contributions/addFile', 'Add File') + '...',
      order: '2',
    });
  }

  protected async addFile(): Promise<void> {
    const sketch = await this.sketchServiceClient.currentSketch();
    if (!sketch) {
      return;
    }
    const toAddUri = await this.fileDialogService.showOpenDialog({
      title: nls.localize('arduino/contributions/addFile', 'Add File'),
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: false,
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
        title: nls.localize('arduino/contributions/replaceTitle', 'Replace'),
        buttons: [
          nls.localize('vscode/issueMainService/cancel', 'Cancel'),
          nls.localize('vscode/issueMainService/ok', 'OK'),
        ],
        message: nls.localize(
          'arduino/replaceMsg',
          'Replace the existing version of {0}?',
          filename
        ),
      });
      if (response === 0) {
        // Cancel
        return;
      }
    }
    await this.fileService.copy(toAddUri, targetUri, { overwrite: true });
    this.messageService.info(
      nls.localize(
        'arduino/contributions/fileAdded',
        'One file added to the sketch.'
      ),
      {
        timeout: 2000,
      }
    );
  }
}

export namespace AddFile {
  export namespace Commands {
    export const ADD_FILE: Command = {
      id: 'arduino-add-file',
    };
  }
}
