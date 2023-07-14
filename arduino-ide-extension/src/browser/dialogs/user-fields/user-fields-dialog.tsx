import React from '@theia/core/shared/react';
import { inject, injectable } from '@theia/core/shared/inversify';
import { DialogProps } from '@theia/core/lib/browser/dialogs';
import { Message } from '@theia/core/shared/@phosphor/messaging';
import { UploadSketch } from '../../contributions/upload-sketch';
import { UserFieldsComponent } from './user-fields-component';
import { BoardUserField } from '../../../common/protocol';
import { ReactDialog } from '../../theia/dialogs/dialogs';

@injectable()
export class UserFieldsDialogProps extends DialogProps {}

@injectable()
export class UserFieldsDialog extends ReactDialog<BoardUserField[]> {
  private _currentUserFields: BoardUserField[] = [];

  constructor(
    @inject(UserFieldsDialogProps)
    protected override readonly props: UserFieldsDialogProps
  ) {
    super({
      title: UploadSketch.Commands.UPLOAD_WITH_CONFIGURATION.label || '',
    });
    this.titleNode.classList.add('user-fields-dialog-title');
    this.contentNode.classList.add('user-fields-dialog-content');
    this.acceptButton = undefined;
  }

  get value(): BoardUserField[] {
    return this._currentUserFields;
  }

  set value(userFields: BoardUserField[]) {
    this._currentUserFields = userFields;
  }

  protected override render(): React.ReactNode {
    return (
      <div>
        <form>
          <UserFieldsComponent
            initialBoardUserFields={this.value}
            updateUserFields={this.doUpdateUserFields}
            cancel={this.doCancel}
            accept={this.doAccept}
          />
        </form>
      </div>
    );
  }

  protected override onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.update();
  }

  protected override async accept(): Promise<void> {
    // If the user presses enter and at least
    // a field is empty don't accept the input
    for (const field of this.value) {
      if (field.value.length === 0) {
        return;
      }
    }
    return super.accept();
  }

  override close(): void {
    this.resetUserFieldsValue();
    super.close();
  }

  private resetUserFieldsValue(): void {
    this.value = this.value.map((field) => {
      field.value = '';
      return field;
    });
  }

  private readonly doCancel: () => void = () => this.close();
  private readonly doAccept: () => Promise<void> = () => this.accept();
  private readonly doUpdateUserFields: (userFields: BoardUserField[]) => void =
    (userFields: BoardUserField[]) => {
      this.value = userFields;
    };
}
