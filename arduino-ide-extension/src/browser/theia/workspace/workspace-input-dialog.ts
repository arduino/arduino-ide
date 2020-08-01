import { inject } from 'inversify';
import { MaybePromise } from '@theia/core/lib/common/types';
import { LabelProvider } from '@theia/core/lib/browser/label-provider';
import { DialogError, DialogMode } from '@theia/core/lib/browser/dialogs';
import { WorkspaceInputDialog as TheiaWorkspaceInputDialog, WorkspaceInputDialogProps } from '@theia/workspace/lib/browser/workspace-input-dialog';

export class WorkspaceInputDialog extends TheiaWorkspaceInputDialog {

    protected wasTouched = false;

    constructor(
        @inject(WorkspaceInputDialogProps) protected readonly props: WorkspaceInputDialogProps,
        @inject(LabelProvider) protected readonly labelProvider: LabelProvider,
    ) {
        super(props, labelProvider);
        this.appendCloseButton('Cancel');
    }

    protected appendParentPath(): void {
        // NOOP
    }

    isValid(value: string, mode: DialogMode): MaybePromise<DialogError> {
        if (value !== '') {
            this.wasTouched = true;
        }
        return super.isValid(value, mode);
    }

    protected setErrorMessage(error: DialogError): void {
        if (this.acceptButton) {
            this.acceptButton.disabled = !DialogError.getResult(error);
        }
        if (this.wasTouched) {
            this.errorMessageNode.innerText = DialogError.getMessage(error);
        }
    }

}
