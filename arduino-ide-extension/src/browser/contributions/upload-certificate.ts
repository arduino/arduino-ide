import { inject, injectable } from 'inversify';
import {
  Command,
  MenuModelRegistry,
  CommandRegistry,
  Contribution,
} from './contribution';
import { ArduinoMenus } from '../menu/arduino-menus';
import { UploadCertificateDialog } from '../dialogs/certificate-uploader/certificate-uploader-dialog';
import { ContextMenuRenderer } from '@theia/core/lib/browser/context-menu-renderer';
import {
  PreferenceScope,
  PreferenceService,
} from '@theia/core/lib/browser/preferences/preference-service';
import { ArduinoPreferences } from '../arduino-preferences';
import {
  arduinoCert,
  certificateList,
} from '../dialogs/certificate-uploader/utils';
import { ArduinoFirmwareUploader } from '../../common/protocol/arduino-firmware-uploader';

@injectable()
export class UploadCertificate extends Contribution {
  @inject(UploadCertificateDialog)
  protected readonly dialog: UploadCertificateDialog;

  @inject(ContextMenuRenderer)
  protected readonly contextMenuRenderer: ContextMenuRenderer;

  @inject(PreferenceService)
  protected readonly preferenceService: PreferenceService;

  @inject(ArduinoPreferences)
  protected readonly arduinoPreferences: ArduinoPreferences;

  @inject(ArduinoFirmwareUploader)
  protected readonly arduinoFirmwareUploader: ArduinoFirmwareUploader;

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

    registry.registerCommand(UploadCertificate.Commands.REMOVE_CERT, {
      execute: async (certToRemove) => {
        const certs = this.arduinoPreferences.get('arduino.board.certificates');

        this.preferenceService.set(
          'arduino.board.certificates',
          certificateList(certs)
            .filter((c) => c !== certToRemove)
            .join(','),
          PreferenceScope.User
        );
      },
      isEnabled: (certToRemove) => certToRemove !== arduinoCert,
    });

    registry.registerCommand(UploadCertificate.Commands.UPLOAD_CERT, {
      execute: async ({ fqbn, address, urls }) => {
        return this.arduinoFirmwareUploader.uploadCertificates(
          `-b ${fqbn} -a ${address} ${urls
            .map((url: string) => `-u ${url}`)
            .join(' ')}`
        );
      },
      isEnabled: () => true,
    });

    registry.registerCommand(UploadCertificate.Commands.OPEN_CERT_CONTEXT, {
      execute: async (args: any) => {
        this.contextMenuRenderer.render({
          menuPath: ArduinoMenus.ROOT_CERTIFICATES__CONTEXT,
          anchor: {
            x: args.x,
            y: args.y,
          },
          args: [args.cert],
        });
      },
      isEnabled: () => true,
    });
  }

  registerMenus(registry: MenuModelRegistry): void {
    registry.registerMenuAction(ArduinoMenus.TOOLS__FIRMWARE_UPLOADER_GROUP, {
      commandId: UploadCertificate.Commands.OPEN.id,
      label: UploadCertificate.Commands.OPEN.label,
      order: '1',
    });

    registry.registerMenuAction(ArduinoMenus.ROOT_CERTIFICATES__CONTEXT, {
      commandId: UploadCertificate.Commands.REMOVE_CERT.id,
      label: UploadCertificate.Commands.REMOVE_CERT.label,
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

    export const OPEN_CERT_CONTEXT: Command = {
      id: 'arduino-certificate-open-context',
      label: 'Open context',
      category: 'Arduino',
    };

    export const REMOVE_CERT: Command = {
      id: 'arduino-certificate-remove',
      label: 'Remove',
      category: 'Arduino',
    };

    export const UPLOAD_CERT: Command = {
      id: 'arduino-certificate-upload',
      label: 'Upload',
      category: 'Arduino',
    };
  }
}
