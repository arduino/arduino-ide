import { inject, injectable } from 'inversify';
import {
  Command,
  MenuModelRegistry,
  CommandRegistry,
  Contribution,
} from './contribution';
import { ArduinoMenus } from '../menu/arduino-menus';
import { UploadFirmwareDialog } from '../dialogs/upload-firmware-dialog';

@injectable()
export class UploadFirmware extends Contribution {
  @inject(UploadFirmwareDialog)
  protected readonly dialog: UploadFirmwareDialog;

  protected dialogOpened = false;

  registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(UploadFirmware.Commands.OPEN, {
      execute: async () => {
        try {
          this.dialogOpened = true;
          await this.dialog.open();
        } finally {
          this.dialogOpened = false;
        }
      },
      isEnabled: () => !this.dialogOpened,
    });
  }

  registerMenus(registry: MenuModelRegistry): void {
    registry.registerMenuAction(ArduinoMenus.TOOLS__FIRMWARE_UPLOADER_GROUP, {
      commandId: UploadFirmware.Commands.OPEN.id,
      label: UploadFirmware.Commands.OPEN.label,
      order: '0',
    });
  }
}

export namespace UploadFirmware {
  export namespace Commands {
    export const OPEN: Command = {
      id: 'arduino-upload-firmware-open',
      label: 'Connectivity Firmware Updater',
      category: 'Arduino',
    };
  }
}
