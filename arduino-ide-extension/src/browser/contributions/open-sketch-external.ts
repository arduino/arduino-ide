import { injectable } from '@theia/core/shared/inversify';
import URI from '@theia/core/lib/common/uri';
import { ArduinoMenus } from '../menu/arduino-menus';
import {
  SketchContribution,
  Command,
  CommandRegistry,
  MenuModelRegistry,
  KeybindingRegistry,
} from './contribution';
import { nls } from '@theia/core/lib/common/nls';

@injectable()
export class OpenSketchExternal extends SketchContribution {
  override registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(OpenSketchExternal.Commands.OPEN_EXTERNAL, {
      execute: () => this.openExternal(),
    });
  }

  override registerMenus(registry: MenuModelRegistry): void {
    registry.registerMenuAction(ArduinoMenus.SKETCH__UTILS_GROUP, {
      commandId: OpenSketchExternal.Commands.OPEN_EXTERNAL.id,
      label: nls.localize('arduino/sketch/showFolder', 'Show Sketch Folder'),
      order: '0',
    });
  }

  override registerKeybindings(registry: KeybindingRegistry): void {
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
          window.electronTheiaCore.showItemInFolder(fsPath);
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
