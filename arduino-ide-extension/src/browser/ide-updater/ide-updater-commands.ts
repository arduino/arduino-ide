import {
  Command,
  CommandContribution,
  CommandRegistry,
  MessageService,
  nls,
} from '@theia/core';
import { injectable, inject } from '@theia/core/shared/inversify';
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
          nls.localize(
            'arduino/ide-updater/noUpdatesAvailable',
            'There are no recent updates available for the Arduino IDE'
          )
        );
      }
      return updateInfo;
    } catch (e) {
      this.messageService.error(
        nls.localize(
          'arduino/ide-updater/errorCheckingForUpdates',
          'Error while checking for Arduino IDE updates.\n{0}',
          e.message
        )
      );
    }
  }
}
export namespace IDEUpdaterCommands {
  export const CHECK_FOR_UPDATES: Command = Command.toLocalizedCommand(
    {
      id: 'arduino-check-for-ide-updates',
      label: 'Check for Arduino IDE Updates',
      category: 'Arduino',
    },
    'arduino/ide-updater/checkForUpdates'
  );
}
