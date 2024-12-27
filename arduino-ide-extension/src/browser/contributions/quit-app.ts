import { inject, injectable } from '@theia/core/shared/inversify';
import { isOSX } from '@theia/core/lib/common/os';
import {
  Contribution,
  Command,
  MenuModelRegistry,
  KeybindingRegistry,
  CommandRegistry,
} from './contribution';
import { ArduinoMenus } from '../menu/arduino-menus';
import { AppService } from '../app-service';

@injectable()
export class QuitApp extends Contribution {
  @inject(AppService)
  private readonly appService: AppService;

  override registerCommands(registry: CommandRegistry): void {
    if (!isOSX) {
      registry.registerCommand(QuitApp.Commands.QUIT_APP, {
        execute: () => this.appService.quit(),
      });
    }
  }

  override registerMenus(registry: MenuModelRegistry): void {
    // On macOS we will get the `Quit ${YOUR_APP_NAME}` menu item natively, no need to duplicate it.
    if (!isOSX) {
      registry.registerMenuAction(ArduinoMenus.FILE__QUIT_GROUP, {
        commandId: QuitApp.Commands.QUIT_APP.id,
        label: '退出',
        order: '0',
      });
    }
  }

  override registerKeybindings(registry: KeybindingRegistry): void {
    if (!isOSX) {
      registry.registerKeybinding({
        command: QuitApp.Commands.QUIT_APP.id,
        keybinding: 'CtrlCmd+Q',
      });
    }
  }
}

export namespace QuitApp {
  export namespace Commands {
    export const QUIT_APP: Command = {
      id: 'lingzhi-quit-app',
    };
  }
}
