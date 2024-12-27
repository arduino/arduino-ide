import { CommonCommands } from '@theia/core/lib/browser/common-frontend-contribution';
import { nls } from '@theia/core/lib/common/nls';
import { inject, injectable } from '@theia/core/shared/inversify';
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
import { ResponseService } from '../../common/protocol';

@injectable()
export class SaveSketch extends SketchContribution {
  @inject(ResponseService)
  private readonly responseService: ResponseService;

  override registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(SaveSketch.Commands.SAVE_SKETCH, {
      execute: () => this.saveSketch(),
    });
  }

  override registerMenus(registry: MenuModelRegistry): void {
    registry.registerMenuAction(ArduinoMenus.FILE__SKETCH_GROUP, {
      commandId: SaveSketch.Commands.SAVE_SKETCH.id,
      label: nls.localize('vscode/fileCommands/save', '保存'),
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
      responseService: this.responseService,
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
      id: 'lingzhi-save-sketch',
    };
  }
}

// https://github.com/arduino/arduino-ide/issues/2081
export function assertConnectedToBackend(param: {
  connectionStatusService: ApplicationConnectionStatusContribution;
  responseService: ResponseService;
}): void {
  if (param.connectionStatusService.offlineStatus === 'backend') {
    const message = nls.localize(
      'theia/core/couldNotSave',
      '无法保存草图。请将未保存的工作复制到您最喜欢的文本编辑器中,然后重新启动IDE。'
    );
    const chunk = `${message}\n`;
    param.responseService.appendToOutput({ chunk });
    throw new Error(message);
  }
}
