import { injectable } from 'inversify';
import * as remote from '@theia/core/electron-shared/@electron/remote';
import URI from '@theia/core/lib/common/uri';
import { ArduinoMenus } from '../menu/arduino-menus';
import {
  SketchContribution,
  Command,
  CommandRegistry,
  MenuModelRegistry,
  KeybindingRegistry,
} from './contribution';
import { nls } from '@theia/core/lib/common';

@injectable()
export class OpenSketchExternal extends SketchContribution {
  registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(OpenSketchExternal.Commands.OPEN_EXTERNAL, {
      execute: () => this.openExternal(),
    });
  }

  registerMenus(registry: MenuModelRegistry): void {
    registry.registerMenuAction(ArduinoMenus.SKETCH__UTILS_GROUP, {
      commandId: OpenSketchExternal.Commands.OPEN_EXTERNAL.id,
      label: nls.localize('arduino/sketch/showFolder', 'Show Sketch Folder'),
      order: '0',
    });
  }

  registerKeybindings(registry: KeybindingRegistry): void {
    registry.registerKeybinding({
      command: OpenSketchExternal.Commands.OPEN_EXTERNAL.id,
      keybinding: 'CtrlCmd+Alt+K',
    });
  }

  protected async openExternal(): Promise<void> {
    const uri = await this.sketchServiceClient.currentSketchFile();
    if (uri) {
      const exists = await this.fileService.exists(new URI(uri));
      if (exists) {
        const fsPath = await this.fileService.fsPath(new URI(uri));
        if (fsPath) {
          remote.shell.showItemInFolder(fsPath);
        }
      }
    }
  }
}

export namespace OpenSketchExternal {
  export namespace Commands {
    export const OPEN_EXTERNAL: Command = {
      id: 'arduino-open-sketch-external',
    };
  }
}
