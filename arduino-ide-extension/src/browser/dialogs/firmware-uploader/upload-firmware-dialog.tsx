import * as React from 'react';
import { inject, injectable } from 'inversify';
import { AbstractDialog, DialogProps } from '@theia/core/lib/browser/dialogs';
import { Widget } from '@phosphor/widgets';
import { Message } from '@phosphor/messaging';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { BoardsServiceProvider } from '../../boards/boards-service-provider';
import { FirmwareUploaderComponent } from './firmware-uploader-component';

@injectable()
export class UploadFirmwareDialogWidget extends ReactWidget {
  @inject(BoardsServiceProvider)
  protected readonly boardsServiceClient: BoardsServiceProvider;

  constructor() {
    super();
  }

  protected render(): React.ReactNode {
    return (
      <FirmwareUploaderComponent
        boardsServiceClient={this.boardsServiceClient}
      />
    );
  }
}

@injectable()
export class UploadFirmwareDialogProps extends DialogProps {}

@injectable()
export class UploadFirmwareDialog extends AbstractDialog<void> {
  @inject(UploadFirmwareDialogWidget)
  protected readonly widget: UploadFirmwareDialogWidget;

  constructor(
    @inject(UploadFirmwareDialogProps)
    protected readonly props: UploadFirmwareDialogProps
  ) {
    super({ title: 'Wireless Module Firmware Updater' });
    this.contentNode.classList.add('firmware-uploader-dialog');
    this.acceptButton = undefined;
  }

  get value(): void {
    return;
  }

  protected onAfterAttach(msg: Message): void {
    if (this.widget.isAttached) {
      Widget.detach(this.widget);
    }
    Widget.attach(this.widget, this.contentNode);
    super.onAfterAttach(msg);
    this.update();
  }

  protected onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg);
    this.widget.update();
  }

  protected onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg);
    this.widget.activate();
  }

  protected handleEnter(event: KeyboardEvent): boolean | void {
    return false;
  }
}
