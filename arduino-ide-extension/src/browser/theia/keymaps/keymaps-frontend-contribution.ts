import { injectable } from 'inversify';
import { MenuModelRegistry } from '@theia/core';
import {
  KeymapsFrontendContribution as TheiaKeymapsFrontendContribution,
  KeymapsCommands,
} from '@theia/keymaps/lib/browser/keymaps-frontend-contribution';
import { ArduinoMenus } from '../../menu/arduino-menus';

@injectable()
export class KeymapsFrontendContribution extends TheiaKeymapsFrontendContribution {
  registerMenus(menus: MenuModelRegistry): void {
    menus.registerMenuAction(ArduinoMenus.FILE__ADVANCED_SUBMENU, {
      commandId: KeymapsCommands.OPEN_KEYMAPS.id,
      label: 'Keyboard Shortcuts',
      order: '1',
    });
  }
}
