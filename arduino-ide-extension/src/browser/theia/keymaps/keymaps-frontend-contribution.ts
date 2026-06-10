import { CommandRegistry } from '@theia/core/lib/common/command';
import { MenuModelRegistry } from '@theia/core/lib/common/menu/menu-model-registry';
import { nls } from '@theia/core/lib/common/nls';
import { injectable } from '@theia/core/shared/inversify';
import {
  KeymapsCommands,
  KeymapsFrontendContribution as TheiaKeymapsFrontendContribution,
} from '@theia/keymaps/lib/browser/keymaps-frontend-contribution';
import { ArduinoMenus } from '../../menu/arduino-menus';

@injectable()
export class KeymapsFrontendContribution extends TheiaKeymapsFrontendContribution {
  override registerCommands(registry: CommandRegistry): void {
    super.registerCommands(registry);
    registry.unregisterCommand(KeymapsCommands.OPEN_KEYMAPS_JSON_TOOLBAR.id);
  }

  override registerMenus(menus: MenuModelRegistry): void {
    menus.registerMenuAction(ArduinoMenus.FILE__ADVANCED_SUBMENU, {
      commandId: KeymapsCommands.OPEN_KEYMAPS.id,
      label: nls.localize(
        'vscode/helpActions/miKeyboardShortcuts',
        'Keyboard Shortcuts'
      ),
      order: '1',
    });
  }
}
