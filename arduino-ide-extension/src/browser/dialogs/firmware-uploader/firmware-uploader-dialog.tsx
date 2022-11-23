import * as React from '@theia/core/shared/react';
import {
  inject,
  injectable,
  postConstruct,
} from '@theia/core/shared/inversify';
import { DialogProps } from '@theia/core/lib/browser/dialogs';
import { ReactDialog } from '../../theia/dialogs/dialogs';
import { Message } from '@theia/core/shared/@phosphor/messaging';
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
import { Port } from '../../../common/protocol';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';

@injectable()
export class UploadFirmwareDialogProps extends DialogProps {}

@injectable()
export class UploadFirmwareDialog extends ReactDialog<void> {
  @inject(BoardsServiceProvider)
  private readonly boardsServiceClient: BoardsServiceProvider;
  @inject(ArduinoFirmwareUploader)
  private readonly arduinoFirmwareUploader: ArduinoFirmwareUploader;
  @inject(FrontendApplicationStateService)
  private readonly appStatusService: FrontendApplicationStateService;

  private updatableFqbns: string[] = [];
  private availableBoards: AvailableBoard[] = [];
  private isOpen = new Object();
  private busy = false;

  constructor(
    @inject(UploadFirmwareDialogProps)
    protected override readonly props: UploadFirmwareDialogProps
  ) {
    super({ title: UploadFirmware.Commands.OPEN.label || '' });
    this.node.id = 'firmware-uploader-dialog-container';
    this.contentNode.classList.add('firmware-uploader-dialog');
    this.acceptButton = undefined;
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

  get value(): void {
    return;
  }

  protected override render(): React.ReactNode {
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

  protected override onAfterAttach(msg: Message): void {
    const firstButton = this.node.querySelector('button');
    firstButton?.focus();
    super.onAfterAttach(msg);
    this.update();
  }

  protected override onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg);
    this.update();
  }

  // eslint-disable-next-line unused-imports/no-unused-vars, @typescript-eslint/no-unused-vars
  protected override handleEnter(event: KeyboardEvent): boolean | void {
    return false;
  }

  override close(): void {
    if (this.busy) {
      return;
    }
    super.close();
    this.isOpen = new Object();
  }

  private busyCallback(busy: boolean): void {
    this.busy = busy;
    if (busy) {
      this.closeCrossNode.classList.add('disabled');
    } else {
      this.closeCrossNode.classList.remove('disabled');
    }
  }

  private flashFirmware(firmware: FirmwareInfo, port: Port): Promise<any> {
    this.busyCallback(true);
    return this.arduinoFirmwareUploader
      .flash(firmware, port)
      .finally(() => this.busyCallback(false));
  }
}
