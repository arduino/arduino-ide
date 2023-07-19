import { inject, injectable } from '@theia/core/shared/inversify';
import { Widget } from '@theia/core/shared/@phosphor/widgets';
import { CancellationTokenSource } from '@theia/core/lib/common/cancellation';
import {
  ConfirmDialog,
  ConfirmDialogProps,
  DialogError,
} from '@theia/core/lib/browser/dialogs';
import { nls } from '@theia/core/lib/common';

@injectable()
export class DoNotAskAgainDialogProps extends ConfirmDialogProps {
  readonly onAccept: () => Promise<void>;
}

@injectable()
export class DoNotAskAgainConfirmDialog extends ConfirmDialog {
  protected readonly doNotAskAgainCheckbox: HTMLInputElement;

  constructor(
    @inject(DoNotAskAgainDialogProps)
    protected override readonly props: DoNotAskAgainDialogProps
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
    doNotAskAgainLabel.textContent = nls.localize(
      'arduino/dialog/dontAskAgain',
      "Don't ask again"
    );
    this.doNotAskAgainCheckbox = document.createElement('input');
    this.doNotAskAgainCheckbox.setAttribute('align-self', 'center');
    doNotAskAgainLabel.appendChild(this.doNotAskAgainCheckbox);
    this.doNotAskAgainCheckbox.type = 'checkbox';
  }

  protected override async accept(): Promise<void> {
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

  protected override setErrorMessage(error: DialogError): void {
    if (this.acceptButton) {
      this.acceptButton.disabled = !DialogError.getResult(error);
    }
  }
}
