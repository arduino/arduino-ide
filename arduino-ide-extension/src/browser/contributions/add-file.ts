import { nls } from '@theia/core/lib/common/nls';
import { inject, injectable } from '@theia/core/shared/inversify';
import { FileDialogService } from '@theia/filesystem/lib/browser';
import { ArduinoMenus } from '../menu/arduino-menus';
import { CurrentSketch } from '../sketches-service-client-impl';
import {
  Command,
  CommandRegistry,
  MenuModelRegistry,
  Sketch,
  SketchContribution,
  URI,
} from './contribution';

@injectable()
export class AddFile extends SketchContribution {
  @inject(FileDialogService)
  private readonly fileDialogService: FileDialogService; // TODO: use dialogService

  override registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(AddFile.Commands.ADD_FILE, {
      execute: () => this.addFile(),
    });
  }

  override registerMenus(registry: MenuModelRegistry): void {
    registry.registerMenuAction(ArduinoMenus.SKETCH__UTILS_GROUP, {
      commandId: AddFile.Commands.ADD_FILE.id,

      label: '添加文件...',
      order: '2',
    });
  }

  private async addFile(): Promise<void> {
    const sketch = await this.sketchServiceClient.currentSketch();
    if (!CurrentSketch.isValid(sketch)) {
      return;
    }
    const toAddUri = await this.fileDialogService.showOpenDialog({
      title: '添加文件',
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: false,
      modal: true,
    });
    if (!toAddUri) {
      return;
    }
    const { uri: targetUri, filename } = this.resolveTarget(sketch, toAddUri);
    const exists = await this.fileService.exists(targetUri);
    if (exists) {
      const { response } = await this.dialogService.showMessageBox({
        type: 'question',
        title: nls.localize('arduino/contributions/replaceTitle', '替换'),
        buttons: [
          nls.localize('vscode/issueMainService/cancel', '取消'),
          nls.localize('vscode/issueMainService/ok', '确定'),
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
        '在草图中添加了一个文件。'
      ),
      {
        timeout: 2000,
      }
    );
  }

  // https://github.com/arduino/arduino-ide/issues/284#issuecomment-1364533662
  // File the file to add has one of the following extension, it goes to the sketch folder root: .ino, .h, .cpp, .c, .S
  // Otherwise, the files goes to the `data` folder inside the sketch folder root.
  private resolveTarget(
    sketch: Sketch,
    toAddUri: URI
  ): { uri: URI; filename: string } {
    const path = toAddUri.path;
    const filename = path.base;
    let root = new URI(sketch.uri);
    if (!Sketch.Extensions.CODE_FILES.includes(path.ext)) {
      root = root.resolve('data');
    }
    return { uri: root.resolve(filename), filename: filename };
  }
}

export namespace AddFile {
  export namespace Commands {
    export const ADD_FILE: Command = {
      id: 'lingzhi-add-file',
    };
  }
}
