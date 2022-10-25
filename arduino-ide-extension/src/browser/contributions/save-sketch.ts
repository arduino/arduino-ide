import { injectable } from '@theia/core/shared/inversify';
import { CommonCommands } from '@theia/core/lib/browser/common-frontend-contribution';
import { ArduinoMenus } from '../menu/arduino-menus';
import { SaveAsSketch } from './save-as-sketch';
import {
  SketchContribution,
  Command,
  CommandRegistry,
  MenuModelRegistry,
  KeybindingRegistry,
} from './contribution';
import { nls } from '@theia/core/lib/common';
import { CurrentSketch } from '../../common/protocol/sketches-service-client-impl';

@injectable()
export class SaveSketch extends SketchContribution {
  override registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(SaveSketch.Commands.SAVE_SKETCH, {
      execute: () => this.saveSketch(),
    });
  }

  override registerMenus(registry: MenuModelRegistry): void {
    registry.registerMenuAction(ArduinoMenus.FILE__SKETCH_GROUP, {
      commandId: SaveSketch.Commands.SAVE_SKETCH.id,
      label: nls.localize('vscode/fileCommands/save', 'Save'),
      order: '7',
    });
  }

  override registerKeybindings(registry: KeybindingRegistry): void {
    registry.registerKeybinding({
      command: SaveSketch.Commands.SAVE_SKETCH.id,
      keybinding: 'CtrlCmd+S',
    });
  }

  async saveSketch(): Promise<void> {
    const sketch = await this.sketchServiceClient.currentSketch();
    if (!CurrentSketch.isValid(sketch)) {
      return;
    }
    const isTemp = await this.sketchService.isTemp(sketch);
    if (isTemp) {
      return this.commandService.executeCommand(
        SaveAsSketch.Commands.SAVE_AS_SKETCH.id,
        {
          execOnlyIfTemp: false,
          openAfterMove: true,
          wipeOriginal: true,
        }
      );
    }

    return this.commandService.executeCommand(CommonCommands.SAVE_ALL.id);
  }
}

export namespace SaveSketch {
  export namespace Commands {
    export const SAVE_SKETCH: Command = {
      id: 'arduino-save-sketch',
    };
  }
}
