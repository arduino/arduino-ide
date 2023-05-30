import { CommonCommands } from '@theia/core/lib/browser/common-frontend-contribution';
import { MessageService } from '@theia/core/lib/common/message-service';
import { nls } from '@theia/core/lib/common/nls';
import { injectable } from '@theia/core/shared/inversify';
import { ArduinoMenus } from '../menu/arduino-menus';
import { CurrentSketch } from '../sketches-service-client-impl';
import { ApplicationConnectionStatusContribution } from '../theia/core/connection-status-service';
import {
  Command,
  CommandRegistry,
  KeybindingRegistry,
  MenuModelRegistry,
  SketchContribution,
} from './contribution';
import { SaveAsSketch } from './save-as-sketch';

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
    assertConnectedToBackend({
      connectionStatusService: this.connectionStatusService,
      messageService: this.messageService,
    });
    const sketch = await this.sketchServiceClient.currentSketch();
    if (!CurrentSketch.isValid(sketch)) {
      return;
    }
    const isTemp = await this.sketchesService.isTemp(sketch);
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

// https://github.com/arduino/arduino-ide/issues/2081
export function assertConnectedToBackend(param: {
  connectionStatusService: ApplicationConnectionStatusContribution;
  messageService: MessageService;
}): void {
  if (param.connectionStatusService.offlineStatus === 'backend') {
    const message = nls.localize(
      'theia/core/couldNotSave',
      'Could not save the sketch. Please copy your unsaved work into your favorite text editor, and restart the IDE.'
    );
    param.messageService.error(message);
    throw new Error(message);
  }
}
