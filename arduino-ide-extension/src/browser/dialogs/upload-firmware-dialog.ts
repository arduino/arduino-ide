import { inject, injectable } from 'inversify';
import {
  AbstractDialog,
  DialogError,
  DialogProps,
} from '@theia/core/lib/browser/dialogs';

@injectable()
export class UploadFirmwareDialogProps extends DialogProps {}

@injectable()
export class UploadFirmwareDialog extends AbstractDialog<Promise<void>> {
  constructor(
    @inject(UploadFirmwareDialogProps)
    protected readonly props: UploadFirmwareDialogProps
  ) {
    super(props);
  }

  protected setErrorMessage(error: DialogError): void {
    if (this.acceptButton) {
      this.acceptButton.disabled = !DialogError.getResult(error);
    }
  }
  get value(): Promise<void> {
    console.log('lol');
    return Promise.resolve();
  }
}
