import { inject, injectable } from 'inversify';
import { Widget } from '@phosphor/widgets';
import { CancellationTokenSource } from '@theia/core/lib/common/cancellation';
import {
  ConfirmDialog,
  ConfirmDialogProps,
  DialogError,
} from '@theia/core/lib/browser/dialogs';

@injectable()
export class DoNotAskAgainDialogProps extends ConfirmDialogProps {
  readonly onAccept: () => Promise<void>;
}

@injectable()
export class DoNotAskAgainConfirmDialog extends ConfirmDialog {
  protected readonly doNotAskAgainCheckbox: HTMLInputElement;

  constructor(
    @inject(DoNotAskAgainDialogProps)
    protected readonly props: DoNotAskAgainDialogProps
  ) {
    super(props);
    this.controlPanel.removeChild(this.errorMessageNode);
    const doNotAskAgainNode = document.createElement('div');
    doNotAskAgainNode.setAttribute('style', 'flex: 2');
    this.controlPanel.insertBefore(
      doNotAskAgainNode,
      this.controlPanel.firstChild
    );
    const doNotAskAgainLabel = document.createElement('label');
    doNotAskAgainLabel.classList.add('flex-line');
    doNotAskAgainNode.appendChild(doNotAskAgainLabel);
    doNotAskAgainLabel.textContent = "Don't ask again";
    this.doNotAskAgainCheckbox = document.createElement('input');
    this.doNotAskAgainCheckbox.setAttribute('align-self', 'center');
    doNotAskAgainLabel.appendChild(this.doNotAskAgainCheckbox);
    this.doNotAskAgainCheckbox.type = 'checkbox';
  }

  protected async accept(): Promise<void> {
    if (!this.resolve) {
      return;
    }
    this.acceptCancellationSource.cancel();
    this.acceptCancellationSource = new CancellationTokenSource();
    const token = this.acceptCancellationSource.token;
    const value = this.value;
    const error = await this.isValid(value, 'open');
    if (token.isCancellationRequested) {
      return;
    }
    if (!DialogError.getResult(error)) {
      this.setErrorMessage(error);
    } else {
      if (this.doNotAskAgainCheckbox.checked) {
        await this.props.onAccept();
      }
      this.resolve(value);
      Widget.detach(this);
    }
  }

  protected setErrorMessage(error: DialogError): void {
    if (this.acceptButton) {
      this.acceptButton.disabled = !DialogError.getResult(error);
    }
  }
}
