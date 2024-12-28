wimport { nls } from '@theia/core/lib/common/nls';
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
    // 注册一个命令，命令名为OpenSettings.Commands.OPEN
    registry.registerCommand(OpenSettings.Commands.OPEN, {
      // 执行命令的方法
      execute: async () => {
        // 定义一个变量，用于存储设置
        let settings: Settings | undefined = undefined;
        try {
          // 设置打开状态为true
          this.settingsOpened = true;
          // 更新菜单管理器
          this.menuManager.update();
          // 打开设置对话框，并将返回的设置赋值给settings变量
          settings = await this.settingsDialog.open();
        } finally {
          // 设置打开状态为false
          this.settingsOpened = false;
          // 更新菜单管理器
          this.menuManager.update();
        }
        // 如果settings不为空，则更新设置并保存
        if (settings) {
          await this.settingsService.update(settings);
          await this.settingsService.save();
        } else {
          // 否则，重置设置
          await this.settingsService.reset();
        }
      },
      // 判断命令是否可用的方法
      isEnabled: () => !this.settingsOpened,
    });
  }

  override registerMenus(registry: MenuModelRegistry): void {
    registry.registerMenuAction(ArduinoMenus.FILE__PREFERENCES_GROUP, {
      commandId: OpenSettings.Commands.OPEN.id,
      label: '设置',
      order: '0',
    });
    // registry.registerSubmenu(
    //   ArduinoMenus.FILE__ADVANCED_SUBMENU,
    //   nls.localize('arduino/menu/advanced', 'Advanced')
    // );
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
      category: 'LingZhi',
    };
  }
}
