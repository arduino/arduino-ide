import { inject, injectable } from '@theia/core/shared/inversify';
import { MenuModelRegistry } from '@theia/core/lib/common/menu';
import {
  DebugFrontendApplicationContribution as TheiaDebugFrontendApplicationContribution,
  DebugMenus,
} from '@theia/debug/lib/browser/debug-frontend-application-contribution';
import { unregisterSubmenu } from '../../menu/arduino-menus';
import { CommandRegistry, CommandService } from '@theia/core';

@injectable()
export class DebugFrontendApplicationContribution extends TheiaDebugFrontendApplicationContribution {
  @inject(CommandService) private commandService: CommandService;

  constructor() {
    super();
    this.options.defaultWidgetOptions.rank = 5;
  }

  override registerMenus(registry: MenuModelRegistry): void {
    super.registerMenus(registry);
    unregisterSubmenu(DebugMenus.DEBUG, registry);
  }

  override registerCommands(commands: CommandRegistry): void {
    commands.registerCommand(closeDebugViewId, {
      execute: () => {
        // this.shell.leftPanelHandler.dockPanel.hide();
        // this.shell.leftPanelHandler.toolBar.hide();
        this.commandService.executeCommand('openMainAndRight:command');
      },
    });
  }
}

export const closeDebugViewId = {
  id: 'lingzhi:close-debug-view',
};
