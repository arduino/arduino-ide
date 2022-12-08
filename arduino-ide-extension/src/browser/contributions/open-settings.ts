import { nls } from '@theia/core/lib/common/nls';
import { inject, injectable } from '@theia/core/shared/inversify';
import type { Settings } from '../dialogs/settings/settings';
import { SettingsDialog } from '../dialogs/settings/settings-dialog';
import { ArduinoMenus } from '../menu/arduino-menus';
import {
  Command,
  CommandRegistry,
  KeybindingRegistry,
  MenuModelRegistry,
  SketchContribution,
} from './contribution';

@injectable()
export class OpenSettings extends SketchContribution {
  @inject(SettingsDialog)
  private readonly settingsDialog: SettingsDialog;

  private settingsOpened = false;

  override registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(OpenSettings.Commands.OPEN, {
      execute: async () => {
        let settings: Settings | undefined = undefined;
        try {
          this.settingsOpened = true;
          this.menuManager.update();
          settings = await this.settingsDialog.open();
        } finally {
          this.settingsOpened = false;
          this.menuManager.update();
        }
        if (settings) {
          await this.settingsService.update(settings);
          await this.settingsService.save();
        } else {
          await this.settingsService.reset();
        }
      },
      isEnabled: () => !this.settingsOpened,
    });
  }

  override registerMenus(registry: MenuModelRegistry): void {
    registry.registerMenuAction(ArduinoMenus.FILE__PREFERENCES_GROUP, {
      commandId: OpenSettings.Commands.OPEN.id,
      label:
        nls.localize(
          'vscode/preferences.contribution/preferences',
          'Preferences'
        ) + '...',
      order: '0',
    });
    registry.registerSubmenu(
      ArduinoMenus.FILE__ADVANCED_SUBMENU,
      nls.localize('arduino/menu/advanced', 'Advanced')
    );
  }

  override registerKeybindings(registry: KeybindingRegistry): void {
    registry.registerKeybinding({
      command: OpenSettings.Commands.OPEN.id,
      keybinding: 'CtrlCmd+,',
    });
  }
}

export namespace OpenSettings {
  export namespace Commands {
    export const OPEN: Command = {
      id: 'arduino-settings-open',
      label:
        nls.localize(
          'vscode/preferences.contribution/openSettings2',
          'Open Preferences'
        ) + '...',
      category: 'Arduino',
    };
  }
}
