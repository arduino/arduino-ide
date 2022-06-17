import { inject } from '@theia/core/shared/inversify';
import { MaybePromise } from '@theia/core/lib/common/types';
import { LabelProvider } from '@theia/core/lib/browser/label-provider';
import { DialogError, DialogMode } from '@theia/core/lib/browser/dialogs';
import {
  WorkspaceInputDialog as TheiaWorkspaceInputDialog,
  WorkspaceInputDialogProps,
} from '@theia/workspace/lib/browser/workspace-input-dialog';
import { nls } from '@theia/core/lib/common';

export class WorkspaceInputDialog extends TheiaWorkspaceInputDialog {
  protected wasTouched = false;

  constructor(
    @inject(WorkspaceInputDialogProps)
    protected override readonly props: WorkspaceInputDialogProps,
    @inject(LabelProvider) protected override readonly labelProvider: LabelProvider
  ) {
    super(props, labelProvider);
    this.appendCloseButton(
      nls.localize('vscode/issueMainService/cancel', 'Cancel')
    );
  }

  protected override appendParentPath(): void {
    // NOOP
  }

  override isValid(value: string, mode: DialogMode): MaybePromise<DialogError> {
    if (value !== '') {
      this.wasTouched = true;
    }
    return super.isValid(value, mode);
  }

  protected override setErrorMessage(error: DialogError): void {
    if (this.acceptButton) {
      this.acceptButton.disabled = !DialogError.getResult(error);
    }
    if (this.wasTouched) {
      this.errorMessageNode.innerText = DialogError.getMessage(error);
    }
  }
}
