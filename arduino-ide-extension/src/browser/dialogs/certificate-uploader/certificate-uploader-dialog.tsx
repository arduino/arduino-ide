import { DialogProps } from '@theia/core/lib/browser/dialogs';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import {
  PreferenceScope,
  PreferenceService,
} from '@theia/core/lib/browser/preferences/preference-service';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { CommandRegistry } from '@theia/core/lib/common/command';
import { nls } from '@theia/core/lib/common/nls';
import type { Message } from '@theia/core/shared/@phosphor/messaging';
import { Widget } from '@theia/core/shared/@phosphor/widgets';
import {
  inject,
  injectable,
  postConstruct,
} from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { ArduinoFirmwareUploader } from '../../../common/protocol/arduino-firmware-uploader';
import { createBoardList } from '../../../common/protocol/board-list';
import { ArduinoPreferences } from '../../arduino-preferences';
import { BoardsServiceProvider } from '../../boards/boards-service-provider';
import { AbstractDialog } from '../../theia/dialogs/dialogs';
import { CertificateUploaderComponent } from './certificate-uploader-component';
import { certificateList, sanifyCertString } from './utils';

@injectable()
export class UploadCertificateDialogWidget extends ReactWidget {
  @inject(BoardsServiceProvider)
  private readonly boardsServiceProvider: BoardsServiceProvider;
  @inject(ArduinoPreferences)
  private readonly arduinoPreferences: ArduinoPreferences;
  @inject(PreferenceService)
  private readonly preferenceService: PreferenceService;
  @inject(CommandRegistry)
  private readonly commandRegistry: CommandRegistry;
  @inject(ArduinoFirmwareUploader)
  private readonly arduinoFirmwareUploader: ArduinoFirmwareUploader;
  @inject(FrontendApplicationStateService)
  private readonly appStateService: FrontendApplicationStateService;

  private certificates: string[] = [];
  private updatableFqbns: string[] = [];
  private boardList = createBoardList({});

  busyCallback = (busy: boolean) => {
    return;
  };

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

    this.boardsServiceProvider.onBoardListDidChange((boardList) => {
      this.boardList = boardList;
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
        boardList={this.boardList}
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
  private readonly widget: UploadCertificateDialogWidget;

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
