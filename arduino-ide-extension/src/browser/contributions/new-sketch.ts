import { inject, injectable } from '@theia/core/shared/inversify';
import {
  SketchContribution,
  URI,
  Command,
  CommandRegistry,
  KeybindingRegistry,
  MenuModelRegistry,
} from './contribution';
import { WorkspaceService } from '../theia/workspace/workspace-service';
import { ResponseService } from '../../common/protocol';
import { ArduinoMenus } from '../menu/arduino-menus';
import { LocalStorageService } from '@theia/core/lib/browser/storage-service';
import { WorkspaceInput } from '@theia/workspace/lib/browser';

@injectable()
export class NewSketch extends SketchContribution {
  @inject(WorkspaceService)
  protected readonly workspaceService1: WorkspaceService;
  @inject(ResponseService)
  private readonly responseService: ResponseService;
  @inject(LocalStorageService)
  private readonly localStorageService: LocalStorageService;

  override registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(NewSketch.Commands.NEW_SKETCH, {
      execute: async () => {
        const today = new Date();
        localStorage.setItem(
          'arduino-new-sketch-executedB',
          today.toLocaleString()
        );
        localStorage.setItem(
          'lingzhi-open-sketch-view',
          today.toLocaleString()
        );
        const isFirstStartup = !(await this.localStorageService.getData(
          'initializedLibsAndPackages'
        ));
        if (!isFirstStartup) {
          this.newSketch();
        } else {
          this.messageService.info('请先等待零知库下载安装完成', {
            timeout: 3000,
          });
        }
      },
    });
  }

  override registerMenus(registry: MenuModelRegistry): void {
    registry.registerMenuAction(ArduinoMenus.FILE__SKETCH_GROUP, {
      commandId: NewSketch.Commands.NEW_SKETCH.id,
      label: '新建项目',
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
      const sketch = await this.sketchesService.createNewSketch();

      const preserveWindow: WorkspaceInput = { preserveWindow: false };
      this.workspaceService.open(new URI(sketch.uri), preserveWindow);
    } catch (e) {
      // await this.messageService.error(e.toString());
      const chunk = `${e.toString()}\n`;
      this.responseService.appendToOutput({ chunk });
    }
  }
}

export namespace NewSketch {
  export namespace Commands {
    export const NEW_SKETCH: Command = {
      id: 'lingzhi-new-sketch',
    };
  }
}
