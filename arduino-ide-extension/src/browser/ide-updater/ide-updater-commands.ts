import {
  Command,
  CommandContribution,
  CommandRegistry,
  MessageService,
} from '@theia/core';
import { injectable, inject } from 'inversify';
import { IDEUpdater, UpdateInfo } from '../../common/protocol/ide-updater';
import { IDEUpdaterDialog } from '../dialogs/ide-updater/ide-updater-dialog';

@injectable()
export class IDEUpdaterCommands implements CommandContribution {
  constructor(
    @inject(IDEUpdater)
    private readonly updater: IDEUpdater,
    @inject(MessageService)
    protected readonly messageService: MessageService,
    @inject(IDEUpdaterDialog)
    protected readonly updaterDialog: IDEUpdaterDialog
  ) {}

  registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(IDEUpdaterCommands.CHECK_FOR_UPDATES, {
      execute: this.checkForUpdates.bind(this),
    });
  }

  async checkForUpdates(initialCheck?: boolean): Promise<UpdateInfo | void> {
    try {
      const updateInfo = await this.updater.checkForUpdates(initialCheck);
      if (!!updateInfo) {
        this.updaterDialog.open(updateInfo);
      } else {
        this.messageService.info(
          `There are no recent updates available the Arduino IDE`
        );
      }
      return updateInfo;
    } catch (e) {
      this.messageService.error(
        `Error while checking for Arduino IDE updates. ${e}`
      );
    }
  }
}
export namespace IDEUpdaterCommands {
  export const CHECK_FOR_UPDATES: Command = {
    id: 'arduino-ide-check-for-updates',
    category: 'Arduino',
    label: 'Check for Arduino IDE updates',
  };
}
