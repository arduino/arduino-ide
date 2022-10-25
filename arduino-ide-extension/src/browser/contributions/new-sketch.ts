import { nls } from '@theia/core/lib/common';
import { injectable } from '@theia/core/shared/inversify';
import { ArduinoMenus } from '../menu/arduino-menus';
import {
  SketchContribution,
  URI,
  Command,
  CommandRegistry,
  MenuModelRegistry,
  KeybindingRegistry,
} from './contribution';

@injectable()
export class NewSketch extends SketchContribution {
  override registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(NewSketch.Commands.NEW_SKETCH, {
      execute: () => this.newSketch(),
    });
  }

  override registerMenus(registry: MenuModelRegistry): void {
    registry.registerMenuAction(ArduinoMenus.FILE__SKETCH_GROUP, {
      commandId: NewSketch.Commands.NEW_SKETCH.id,
      label: nls.localize('arduino/sketch/new', 'New Sketch'),
      order: '0',
    });
  }

  override registerKeybindings(registry: KeybindingRegistry): void {
    registry.registerKeybinding({
      command: NewSketch.Commands.NEW_SKETCH.id,
      keybinding: 'CtrlCmd+N',
    });
  }

  async newSketch(): Promise<void> {
    try {
      const sketch = await this.sketchService.createNewSketch();
      this.workspaceService.open(new URI(sketch.uri));
    } catch (e) {
      await this.messageService.error(e.toString());
    }
  }
}

export namespace NewSketch {
  export namespace Commands {
    export const NEW_SKETCH: Command = {
      id: 'arduino-new-sketch',
    };
  }
}
