import * as React from '@theia/core/shared/react';
import {
  inject,
  injectable,
  postConstruct,
} from '@theia/core/shared/inversify';
import { DialogProps } from '@theia/core/lib/browser/dialogs';
import { AbstractDialog } from '../../theia/dialogs/dialogs';
import { Widget } from '@theia/core/shared/@phosphor/widgets';
import { Message } from '@theia/core/shared/@phosphor/messaging';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import {
  AvailableBoard,
  BoardsServiceProvider,
} from '../../boards/boards-service-provider';
import { CertificateUploaderComponent } from './certificate-uploader-component';
import { ArduinoPreferences } from '../../arduino-preferences';
import {
  PreferenceScope,
  PreferenceService,
} from '@theia/core/lib/browser/preferences/preference-service';
import { CommandRegistry } from '@theia/core/lib/common/command';
import { certificateList, sanifyCertString } from './utils';
import { ArduinoFirmwareUploader } from '../../../common/protocol/arduino-firmware-uploader';
import { nls } from '@theia/core/lib/common';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';

@injectable()
export class UploadCertificateDialogWidget extends ReactWidget {
  @inject(BoardsServiceProvider)
  protected readonly boardsServiceClient: BoardsServiceProvider;

  @inject(ArduinoPreferences)
  protected readonly arduinoPreferences: ArduinoPreferences;

  @inject(PreferenceService)
  protected readonly preferenceService: PreferenceService;

  @inject(CommandRegistry)
  protected readonly commandRegistry: CommandRegistry;

  @inject(ArduinoFirmwareUploader)
  protected readonly arduinoFirmwareUploader: ArduinoFirmwareUploader;

  @inject(FrontendApplicationStateService)
  private readonly appStateService: FrontendApplicationStateService;

  protected certificates: string[] = [];
  protected updatableFqbns: string[] = [];
  protected availableBoards: AvailableBoard[] = [];

  public busyCallback = (busy: boolean) => {
    return;
  };

  constructor() {
    super();
  }

  @postConstruct()
  protected init(): void {
    this.arduinoPreferences.ready.then(() => {
      this.certificates = certificateList(
        this.arduinoPreferences.get('arduino.board.certificates')
      );
    });
    this.arduinoPreferences.onPreferenceChanged((event) => {
      if (
        event.preferenceName === 'arduino.board.certificates' &&
        event.newValue !== event.oldValue
      ) {
        this.certificates = certificateList(event.newValue);
        this.update();
      }
    });

    this.appStateService.reachedState('ready').then(() =>
      this.arduinoFirmwareUploader.updatableBoards().then((fqbns) => {
        this.updatableFqbns = fqbns;
        this.update();
      })
    );

    this.boardsServiceClient.onAvailableBoardsChanged((availableBoards) => {
      this.availableBoards = availableBoards;
      this.update();
    });
  }

  private addCertificate(certificate: string) {
    const certString = sanifyCertString(certificate);

    if (certString.length > 0) {
      this.certificates.push(sanifyCertString(certificate));
    }

    this.preferenceService.set(
      'arduino.board.certificates',
      this.certificates.join(','),
      PreferenceScope.User
    );
  }

  protected openContextMenu(x: number, y: number, cert: string): void {
    this.commandRegistry.executeCommand(
      'arduino-certificate-open-context',
      Object.assign({}, { x, y, cert })
    );
  }

  protected uploadCertificates(
    fqbn: string,
    address: string,
    urls: string[]
  ): Promise<any> {
    this.busyCallback(true);
    return this.commandRegistry
      .executeCommand('arduino-certificate-upload', {
        fqbn,
        address,
        urls,
      })
      .finally(() => this.busyCallback(false));
  }

  protected render(): React.ReactNode {
    return (
      <CertificateUploaderComponent
        availableBoards={this.availableBoards}
        certificates={this.certificates}
        updatableFqbns={this.updatableFqbns}
        addCertificate={this.addCertificate.bind(this)}
        uploadCertificates={this.uploadCertificates.bind(this)}
        openContextMenu={this.openContextMenu.bind(this)}
      />
    );
  }
}

@injectable()
export class UploadCertificateDialogProps extends DialogProps {}

@injectable()
export class UploadCertificateDialog extends AbstractDialog<void> {
  @inject(UploadCertificateDialogWidget)
  protected readonly widget: UploadCertificateDialogWidget;

  private busy = false;

  constructor(
    @inject(UploadCertificateDialogProps)
    protected override readonly props: UploadCertificateDialogProps
  ) {
    super({
      title: nls.localize(
        'arduino/certificate/uploadRootCertificates',
        'Upload SSL Root Certificates'
      ),
    });
    this.node.id = 'certificate-uploader-dialog-container';
    this.contentNode.classList.add('certificate-uploader-dialog');
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
    const firstButton = this.widget.node.querySelector('button');
    firstButton?.focus();

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
