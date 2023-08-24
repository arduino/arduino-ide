import { inject, injectable } from '@theia/core/shared/inversify';
import {
  Command,
  MenuModelRegistry,
  CommandRegistry,
  Contribution,
} from './contribution';
import { ArduinoMenus } from '../menu/arduino-menus';
import { UploadFirmwareDialog } from '../dialogs/firmware-uploader/firmware-uploader-dialog';
import { nls } from '@theia/core/lib/common';

@injectable()
export class UploadFirmware extends Contribution {
  @inject(UploadFirmwareDialog)
  protected readonly dialog: UploadFirmwareDialog;

  protected dialogOpened = false;

  override registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(UploadFirmware.Commands.OPEN, {
      execute: async () => {
        try {
          this.dialogOpened = true;
          this.menuManager.update();
          await this.dialog.open();
        } finally {
          this.dialogOpened = false;
          this.menuManager.update();
        }
      },
      isEnabled: () => !this.dialogOpened,
    });
  }

  override registerMenus(registry: MenuModelRegistry): void {
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
      label: nls.localize('arduino/firmware/updater', 'Firmware Updater'),
      category: 'Arduino',
    };
  }
}
