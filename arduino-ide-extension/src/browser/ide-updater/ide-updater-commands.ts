import {
  Command,
  CommandContribution,
  CommandRegistry,
  MessageService,
} from '@theia/core';
import { injectable, inject } from 'inversify';
import {
  IDEUpdater,
  UpdateInfo,
} from '../../common/protocol/ide-updater-service';

@injectable()
export class IDEUpdaterCommands implements CommandContribution {
  constructor(
    @inject(IDEUpdater)
    private readonly updater: IDEUpdater,
    @inject(MessageService)
    protected readonly messageService: MessageService
  ) {}

  registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(IDEUpdaterCommands.CHECK_FOR_UPDATES, {
      execute: this.checkForUpdates.bind(this),
    });
    registry.registerCommand(IDEUpdaterCommands.DOWNLOAD_UPDATE, {
      execute: this.downloadUpdate.bind(this),
    });
    registry.registerCommand(IDEUpdaterCommands.STOP_DOWNLOAD, {
      execute: this.stopDownload.bind(this),
    });
    registry.registerCommand(IDEUpdaterCommands.INSTALL_UPDATE, {
      execute: this.quitAndInstall.bind(this),
    });
  }

  async checkForUpdates(): Promise<UpdateInfo | void> {
    return await this.updater.checkForUpdates();
  }

  async downloadUpdate(): Promise<void> {
    await this.updater.downloadUpdate();
  }

  async stopDownload(): Promise<void> {
    await this.updater.stopDownload();
  }

  quitAndInstall(): void {
    this.updater.quitAndInstall();
  }
}
export namespace IDEUpdaterCommands {
  export const CHECK_FOR_UPDATES: Command = {
    id: 'arduino-ide-check-for-updates',
    category: 'Arduino',
    label: 'Check for Arduino IDE updates',
  };
  export const DOWNLOAD_UPDATE: Command = {
    id: 'arduino-ide-download-update',
    category: 'Arduino',
    label: 'Download Arduino IDE updates',
  };
  export const STOP_DOWNLOAD: Command = {
    id: 'arduino-ide-stop-download',
    category: 'Arduino',
    label: 'Stop download of Arduino IDE updates',
  };
  export const INSTALL_UPDATE: Command = {
    id: 'arduino-ide-install-update',
    category: 'Arduino',
    label: 'Install Arduino IDE updates',
  };
}
