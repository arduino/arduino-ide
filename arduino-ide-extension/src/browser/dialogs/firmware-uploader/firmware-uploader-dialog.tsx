import * as React from '@theia/core/shared/react';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { DialogProps } from '@theia/core/lib/browser/dialogs';
import { AbstractDialog } from '../../theia/dialogs/dialogs';
import { Widget } from '@theia/core/shared/@phosphor/widgets';
import { Message } from '@theia/core/shared/@phosphor/messaging';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import {
  AvailableBoard,
  BoardsServiceProvider,
} from '../../boards/boards-service-provider';
import {
  ArduinoFirmwareUploader,
  FirmwareInfo,
} from '../../../common/protocol/arduino-firmware-uploader';
import { FirmwareUploaderComponent } from './firmware-uploader-component';
import { UploadFirmware } from '../../contributions/upload-firmware';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';

@injectable()
export class UploadFirmwareDialogWidget extends ReactWidget {
  @inject(BoardsServiceProvider)
  protected readonly boardsServiceClient: BoardsServiceProvider;

  @inject(ArduinoFirmwareUploader)
  protected readonly arduinoFirmwareUploader: ArduinoFirmwareUploader;

  @inject(FrontendApplicationStateService)
  private readonly appStatusService: FrontendApplicationStateService;

  protected updatableFqbns: string[] = [];
  protected availableBoards: AvailableBoard[] = [];
  protected isOpen = new Object();

  public busyCallback = (busy: boolean) => {
    return;
  };

  constructor() {
    super();
  }

  @postConstruct()
  protected init(): void {
    this.appStatusService.reachedState('ready').then(async () => {
      const fqbns = await this.arduinoFirmwareUploader.updatableBoards();
      this.updatableFqbns = fqbns;
      this.update();
    });

    this.boardsServiceClient.onAvailableBoardsChanged((availableBoards) => {
      this.availableBoards = availableBoards;
      this.update();
    });
  }

  protected flashFirmware(firmware: FirmwareInfo, port: string): Promise<any> {
    this.busyCallback(true);
    return this.arduinoFirmwareUploader
      .flash(firmware, port)
      .finally(() => this.busyCallback(false));
  }

  protected override onCloseRequest(msg: Message): void {
    super.onCloseRequest(msg);
    this.isOpen = new Object();
  }

  protected render(): React.ReactNode {
    return (
      <form>
        <FirmwareUploaderComponent
          availableBoards={this.availableBoards}
          firmwareUploader={this.arduinoFirmwareUploader}
          flashFirmware={this.flashFirmware.bind(this)}
          updatableFqbns={this.updatableFqbns}
          isOpen={this.isOpen}
        />
      </form>
    );
  }
}

@injectable()
export class UploadFirmwareDialogProps extends DialogProps {}

@injectable()
export class UploadFirmwareDialog extends AbstractDialog<void> {
  @inject(UploadFirmwareDialogWidget)
  protected readonly widget: UploadFirmwareDialogWidget;

  private busy = false;

  constructor(
    @inject(UploadFirmwareDialogProps)
    protected override readonly props: UploadFirmwareDialogProps
  ) {
    super({ title: UploadFirmware.Commands.OPEN.label || '' });
    this.contentNode.classList.add('firmware-uploader-dialog');
    this.acceptButton = undefined;
  }

  get value(): void {
    return;
  }

  protected override onAfterAttach(msg: Message): void {
    if (this.widget.isAttached) {
      Widget.detach(this.widget);
    }
    Widget.attach(this.widget, this.contentNode);
    this.widget.busyCallback = this.busyCallback.bind(this);
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

  protected override handleEnter(event: KeyboardEvent): boolean | void {
    return false;
  }

  override close(): void {
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
