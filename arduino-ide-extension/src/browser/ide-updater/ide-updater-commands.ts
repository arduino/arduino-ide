import {
  Command,
  CommandContribution,
  CommandRegistry,
} from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import { UpdateInfo } from '../../common/protocol/ide-updater';

@injectable()
export class IDEUpdaterCommands implements CommandContribution {
  constructor() {}

  registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(IDEUpdaterCommands.CHECK_FOR_UPDATES, {
      execute: this.checkForUpdates.bind(this),
    });
  }

  async checkForUpdates(initialCheck?: boolean): Promise<UpdateInfo | void> {
    // Update checking is disabled for CognifyEV
    // Silently return without checking for updates
    return;
  }
}
export namespace IDEUpdaterCommands {
  export const CHECK_FOR_UPDATES: Command = Command.toLocalizedCommand(
    {
      id: 'arduino-check-for-ide-updates',
      label: 'Check for Cognify IDE Updates',
      category: 'Arduino',
    },
    'arduino/ide-updater/checkForUpdates'
  );
}
