import {
  CommonCommands,
  CommonFrontendContribution as TheiaCommonFrontendContribution,
} from '@theia/core/lib/browser/common-frontend-contribution';
import type { OnWillStopAction } from '@theia/core/lib/browser/frontend-application';
import type { KeybindingRegistry } from '@theia/core/lib/browser/keybinding';
import type { CommandRegistry } from '@theia/core/lib/common/command';
import type { MenuModelRegistry } from '@theia/core/lib/common/menu';
import { isOSX } from '@theia/core/lib/common/os';
import { injectable } from '@theia/core/shared/inversify';

@injectable()
export class CommonFrontendContribution extends TheiaCommonFrontendContribution {
  override registerCommands(commandRegistry: CommandRegistry): void {
    super.registerCommands(commandRegistry);

    for (const command of [
      CommonCommands.CONFIGURE_DISPLAY_LANGUAGE,
      CommonCommands.CLOSE_TAB,
      CommonCommands.CLOSE_SAVED_TABS,
      CommonCommands.CLOSE_OTHER_TABS,
      CommonCommands.CLOSE_ALL_TABS,
      CommonCommands.COLLAPSE_PANEL,
      CommonCommands.TOGGLE_MAXIMIZED,
      CommonCommands.PIN_TAB,
      CommonCommands.UNPIN_TAB,
      CommonCommands.NEW_UNTITLED_FILE,
      CommonCommands.NEW_UNTITLED_TEXT_FILE,
    ]) {
      commandRegistry.unregisterCommand(command);
    }
  }

  override registerMenus(registry: MenuModelRegistry): void {
    super.registerMenus(registry);
    for (const command of [
      CommonCommands.SAVE,
      CommonCommands.SAVE_ALL,
      CommonCommands.CUT,
      CommonCommands.COPY,
      CommonCommands.PASTE,
      CommonCommands.COPY_PATH,
      CommonCommands.FIND,
      CommonCommands.REPLACE,
      CommonCommands.AUTO_SAVE,
      CommonCommands.OPEN_PREFERENCES,
      CommonCommands.SELECT_ICON_THEME,
      CommonCommands.SELECT_COLOR_THEME,
      CommonCommands.ABOUT_COMMAND,
      CommonCommands.SAVE_WITHOUT_FORMATTING, // Patched for https://github.com/eclipse-theia/theia/pull/8877,
      CommonCommands.NEW_UNTITLED_FILE,
      CommonCommands.NEW_UNTITLED_TEXT_FILE,
    ]) {
      registry.unregisterMenuAction(command);
    }
  }

  override registerKeybindings(registry: KeybindingRegistry): void {
    super.registerKeybindings(registry);
    // Workaround for https://github.com/eclipse-theia/theia/issues/11875
    if (isOSX) {
      registry.unregisterKeybinding('ctrlcmd+tab');
      registry.unregisterKeybinding('ctrlcmd+alt+d');
      registry.unregisterKeybinding('ctrlcmd+shift+tab');
      registry.unregisterKeybinding('ctrlcmd+alt+a');

      registry.registerKeybindings(
        {
          command: CommonCommands.NEXT_TAB.id,
          keybinding: 'ctrl+tab',
        },
        {
          command: CommonCommands.NEXT_TAB.id,
          keybinding: 'ctrl+alt+d',
        },
        {
          command: CommonCommands.PREVIOUS_TAB.id,
          keybinding: 'ctrl+shift+tab',
        },
        {
          command: CommonCommands.PREVIOUS_TAB.id,
          keybinding: 'ctrl+alt+a',
        }
      );
    }
  }

  override onWillStop(): OnWillStopAction | undefined {
    // This is NOOP here. All window close and app quit requests are handled in the `Close` contribution.
    return undefined;
  }
}
