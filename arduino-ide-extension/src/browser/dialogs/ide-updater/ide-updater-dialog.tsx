import * as React from 'react';
import { inject, injectable, postConstruct } from 'inversify';
import { DialogProps } from '@theia/core/lib/browser/dialogs';
import { AbstractDialog } from '../../theia/dialogs/dialogs';
import { Widget } from '@phosphor/widgets';
import { Message } from '@phosphor/messaging';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { Command, CommandRegistry, nls } from '@theia/core';
import { Contribution } from '../../contributions/contribution';

@injectable()
export class IDEUpdaterDialogWidget extends ReactWidget {
  protected isOpen = new Object();
  updateInfo: UpdateInfo;

  public busyCallback = (busy: boolean) => {
    return;
  };

  @postConstruct()
  init(updateInfo: UpdateInfo): void {
    this.updateInfo = updateInfo;
  }

  onCloseRequest(msg: Message): void {
    super.onCloseRequest(msg);
    this.isOpen = new Object();
  }

  protected render(): React.ReactNode {
    return <form>Version {this.updateInfo.version}</form>;
  }
}

@injectable()
export class IDEUpdaterDialogProps extends DialogProps {}

export type UpdateInfo = {
  version: string;
  changelog: any;
};

@injectable()
export class IDEUpdaterDialog extends AbstractDialog<UpdateInfo> {
  @inject(IDEUpdaterDialogWidget)
  protected readonly widget: IDEUpdaterDialogWidget;

  private busy = false;

  constructor(
    @inject(IDEUpdaterDialogProps)
    protected readonly props: IDEUpdaterDialogProps
  ) {
    super({
      title: nls.localize(
        'arduino/updater/ideUpdaterDialog',
        'Software Update'
      ),
    });
    this.contentNode.classList.add('ide-updater-dialog');
    this.acceptButton = undefined;
  }

  get value(): UpdateInfo {
    return this.widget.updateInfo;
  }

  protected onAfterAttach(msg: Message): void {
    if (this.widget.isAttached) {
      Widget.detach(this.widget);
    }
    Widget.attach(this.widget, this.contentNode);
    this.widget.busyCallback = this.busyCallback.bind(this);
    super.onAfterAttach(msg);
    this.update();
  }

  async open(
    data: UpdateInfo | undefined = undefined
  ): Promise<UpdateInfo | undefined> {
    if (data && data.version && data.changelog) {
      this.widget.init(data);
      return super.open();
    }
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

  close(): void {
    if (this.busy) {
      return;
    }
    this.widget.close();
    super.close();
  }

  busyCallback(busy: boolean): void {
    this.busy = busy;
    if (busy) {
      this.closeCrossNode.classList.add('disabled');
    } else {
      this.closeCrossNode.classList.remove('disabled');
    }
  }
}

@injectable()
export class IDEUpdater extends Contribution {
  @inject(IDEUpdaterDialog)
  protected readonly dialog: IDEUpdaterDialog;

  protected dialogOpened = false;

  registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(IDEUpdater.Commands.OPEN, {
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
}

export namespace IDEUpdater {
  export namespace Commands {
    export const OPEN: Command = {
      id: 'arduino-ide-updater-open',
      label: nls.localize(
        'arduino/updater/ideUpdaterDialogOpen',
        'Open Software Update dialog'
      ),
      category: 'Arduino',
    };
  }
}
