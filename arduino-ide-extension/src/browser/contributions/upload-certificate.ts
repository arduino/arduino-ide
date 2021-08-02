import { inject, injectable } from 'inversify';
import {
  Command,
  MenuModelRegistry,
  CommandRegistry,
  Contribution,
} from './contribution';
import { ArduinoMenus } from '../menu/arduino-menus';
import { UploadCertificateDialog } from '../dialogs/certificate-uploader/upload-certificate-dialog';

@injectable()
export class UploadCertificate extends Contribution {
  @inject(UploadCertificateDialog)
  protected readonly dialog: UploadCertificateDialog;

  protected dialogOpened = false;

  registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(UploadCertificate.Commands.OPEN, {
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
      commandId: UploadCertificate.Commands.OPEN.id,
      label: UploadCertificate.Commands.OPEN.label,
      order: '1',
    });
  }
}

export namespace UploadCertificate {
  export namespace Commands {
    export const OPEN: Command = {
      id: 'arduino-upload-certificate-open',
      label: 'Upload SSL Root Certificates',
      category: 'Arduino',
    };
  }
}
