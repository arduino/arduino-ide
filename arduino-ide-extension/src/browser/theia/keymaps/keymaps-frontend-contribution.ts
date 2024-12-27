import { inject, injectable } from '@theia/core/shared/inversify';
import {
  CommandRegistry,
  CommandService,
  MenuModelRegistry,
} from '@theia/core';
import { KeymapsFrontendContribution as TheiaKeymapsFrontendContribution } from '@theia/keymaps/lib/browser/keymaps-frontend-contribution';
import { DialogService } from '../../dialog-service';
import { ArduinoMenus } from '../../menu/arduino-menus';
import { KEYMAPS_OPEN } from '../../dialogs/Keymaps/open-keymaps';

@injectable()
export class KeymapsFrontendContribution extends TheiaKeymapsFrontendContribution {
  @inject(DialogService)
  protected readonly dialogService: DialogService;
  @inject(CommandService) private commandService: CommandService;

  override registerMenus(menus: MenuModelRegistry): void {
    menus.registerMenuAction(ArduinoMenus.FILE__ADVANCED_SUBMENU, {
      commandId: 'lingzhi:keymaps:open',
      label: '键盘快捷方式参考',
      order: '1',
    });
  }

  // override registerMenus(menus: MenuModelRegistry): void {
  //   menus.registerMenuAction(ArduinoMenus.FILE__ADVANCED_SUBMENU, {
  //     commandId: 'lingzhi:keymaps:open',
  //     label: '键盘快捷方式参考',
  //     order: '1',
  //   });
  // }

  override registerCommands(commands: CommandRegistry): void {
    super.registerCommands(commands);

    commands.registerCommand(
      { id: 'lingzhi:keymaps:open' },
      {
        isEnabled: () => true,
        execute: () => {
          this.commandService.executeCommand(KEYMAPS_OPEN.id);
        },
      }
    );
  }
}
