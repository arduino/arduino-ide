import * as React from '@theia/core/shared/react';
import { inject, injectable } from '@theia/core/shared/inversify';
import {
  AbstractDialog,
  DialogProps,
  ReactWidget,
} from '@theia/core/lib/browser';
import { Widget } from '@theia/core/shared/@phosphor/widgets';
import { Message } from '@theia/core/shared/@phosphor/messaging';
import { UploadSketch } from '../../contributions/upload-sketch';
import { UserFieldsComponent } from './user-fields-component';
import { BoardUserField } from '../../../common/protocol';

@injectable()
export class UserFieldsDialogWidget extends ReactWidget {
  protected _currentUserFields: BoardUserField[] = [];

  constructor(private cancel: () => void, private accept: () => Promise<void>) {
    super();
  }

  set currentUserFields(userFields: BoardUserField[]) {
    this.setUserFields(userFields);
  }

  get currentUserFields(): BoardUserField[] {
    return this._currentUserFields;
  }

  resetUserFieldsValue(): void {
    this._currentUserFields = this._currentUserFields.map((field) => {
      field.value = '';
      return field;
    });
  }

  protected setUserFields(userFields: BoardUserField[]): void {
    this._currentUserFields = userFields;
  }

  protected render(): React.ReactNode {
    return (
      <form>
        <UserFieldsComponent
          initialBoardUserFields={this._currentUserFields}
          updateUserFields={this.setUserFields.bind(this)}
          cancel={this.cancel}
          accept={this.accept}
        />
      </form>
    );
  }
}

@injectable()
export class UserFieldsDialogProps extends DialogProps {}

@injectable()
export class UserFieldsDialog extends AbstractDialog<BoardUserField[]> {
  protected readonly widget: UserFieldsDialogWidget;

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
    this.widget = new UserFieldsDialogWidget(
      this.close.bind(this),
      this.accept.bind(this)
    );
  }

  set value(userFields: BoardUserField[]) {
    this.widget.currentUserFields = userFields;
  }

  get value(): BoardUserField[] {
    return this.widget.currentUserFields;
  }

  protected override onAfterAttach(msg: Message): void {
    if (this.widget.isAttached) {
      Widget.detach(this.widget);
    }
    Widget.attach(this.widget, this.contentNode);
    super.onAfterAttach(msg);
    this.update();
  }

  protected override onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg);
    this.widget.update();
  }

  protected override onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg);
    this.widget.activate();
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
    this.widget.resetUserFieldsValue();
    this.widget.close();
    super.close();
  }
}
