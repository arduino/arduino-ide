import { injectable } from '@theia/core/shared/inversify';
import * as remote from '@theia/core/electron-shared/@electron/remote';
import { isOSX } from '@theia/core/lib/common/os';
import {
  Contribution,
  Command,
  MenuModelRegistry,
  KeybindingRegistry,
  CommandRegistry,
} from './contribution';
import { ArduinoMenus } from '../menu/arduino-menus';
import { nls } from '@theia/core/lib/common';

@injectable()
export class QuitApp extends Contribution {
  override registerCommands(registry: CommandRegistry): void {
    if (!isOSX) {
      registry.registerCommand(QuitApp.Commands.QUIT_APP, {
        execute: () => remote.app.quit(),
      });
    }
  }

  override registerMenus(registry: MenuModelRegistry): void {
    // On macOS we will get the `Quit ${YOUR_APP_NAME}` menu item natively, no need to duplicate it.
    if (!isOSX) {
      registry.registerMenuAction(ArduinoMenus.FILE__QUIT_GROUP, {
        commandId: QuitApp.Commands.QUIT_APP.id,
        label: nls.localize('vscode/bulkEditService/quit', 'Quit'),
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
      id: 'arduino-quit-app',
    };
  }
}
