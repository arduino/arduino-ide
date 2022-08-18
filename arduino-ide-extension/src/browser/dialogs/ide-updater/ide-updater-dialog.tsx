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
import { nls } from '@theia/core';
import { IDEUpdaterComponent, UpdateProgress } from './ide-updater-component';
import {
  IDEUpdater,
  IDEUpdaterClient,
  SKIP_IDE_VERSION,
  UpdateInfo,
} from '../../../common/protocol/ide-updater';
import { LocalStorageService } from '@theia/core/lib/browser';
import { WindowService } from '@theia/core/lib/browser/window/window-service';

const DOWNLOAD_PAGE_URL =
  'https://www.arduino.cc/en/software#experimental-software';

@injectable()
export class IDEUpdaterDialogWidget extends ReactWidget {
  private _updateInfo: UpdateInfo;
  private _updateProgress: UpdateProgress = {};

  setUpdateInfo(updateInfo: UpdateInfo): void {
    this._updateInfo = updateInfo;
    this.update();
  }

  mergeUpdateProgress(updateProgress: UpdateProgress): void {
    this._updateProgress = { ...this._updateProgress, ...updateProgress };
    this.update();
  }

  get updateInfo(): UpdateInfo {
    return this._updateInfo;
  }

  get updateProgress(): UpdateProgress {
    return this._updateProgress;
  }

  protected render(): React.ReactNode {
    return !!this._updateInfo ? (
      <IDEUpdaterComponent
        updateInfo={this._updateInfo}
        updateProgress={this._updateProgress}
      />
    ) : null;
  }
}

@injectable()
export class IDEUpdaterDialogProps extends DialogProps {}

@injectable()
export class IDEUpdaterDialog extends AbstractDialog<UpdateInfo> {
  @inject(IDEUpdaterDialogWidget)
  private readonly widget: IDEUpdaterDialogWidget;

  @inject(IDEUpdater)
  private readonly updater: IDEUpdater;

  @inject(IDEUpdaterClient)
  private readonly updaterClient: IDEUpdaterClient;

  @inject(LocalStorageService)
  private readonly localStorageService: LocalStorageService;

  @inject(WindowService)
  private readonly windowService: WindowService;

  constructor(
    @inject(IDEUpdaterDialogProps)
    protected override readonly props: IDEUpdaterDialogProps
  ) {
    super({
      title: nls.localize(
        'arduino/ide-updater/ideUpdaterDialog',
        'Software Update'
      ),
    });
    this.node.id = 'ide-updater-dialog-container';
    this.contentNode.classList.add('ide-updater-dialog');
    this.acceptButton = undefined;
  }

  @postConstruct()
  protected init(): void {
    this.updaterClient.onUpdaterDidFail((error) => {
      this.appendErrorButtons();
      this.widget.mergeUpdateProgress({ error });
    });
    this.updaterClient.onDownloadProgressDidChange((progressInfo) => {
      this.widget.mergeUpdateProgress({ progressInfo });
    });
    this.updaterClient.onDownloadDidFinish(() => {
      this.appendInstallButtons();
      this.widget.mergeUpdateProgress({ downloadFinished: true });
    });
  }

  get value(): UpdateInfo {
    return this.widget.updateInfo;
  }

  protected override onAfterAttach(msg: Message): void {
    if (this.widget.isAttached) {
      Widget.detach(this.widget);
    }
    Widget.attach(this.widget, this.contentNode);
    this.appendInitialButtons();
    super.onAfterAttach(msg);
  }

  private clearButtons(): void {
    while (this.controlPanel.firstChild) {
      this.controlPanel.removeChild(this.controlPanel.firstChild);
    }
    this.closeButton = undefined;
  }

  private appendNotNowButton(): void {
    this.appendCloseButton(
      nls.localize('arduino/ide-updater/notNowButton', 'Not now')
    );
    if (this.closeButton) {
      this.addCloseAction(this.closeButton, 'click');
    }
  }

  private appendInitialButtons(): void {
    this.clearButtons();

    const skipVersionButton = this.createButton(
      nls.localize('arduino/ide-updater/skipVersionButton', 'Skip Version')
    );
    skipVersionButton.classList.add('secondary');
    skipVersionButton.classList.add('skip-version-button');
    this.addAction(skipVersionButton, this.skipVersion.bind(this), 'click');
    this.controlPanel.appendChild(skipVersionButton);

    this.appendNotNowButton();

    const downloadButton = this.createButton(
      nls.localize('arduino/ide-updater/downloadButton', 'Download')
    );
    this.addAction(downloadButton, this.startDownload.bind(this), 'click');
    this.controlPanel.appendChild(downloadButton);
    downloadButton.focus();
  }

  private appendInstallButtons(): void {
    this.clearButtons();
    this.appendNotNowButton();

    const closeAndInstallButton = this.createButton(
      nls.localize(
        'arduino/ide-updater/closeAndInstallButton',
        'Close and Install'
      )
    );
    this.addAction(
      closeAndInstallButton,
      this.closeAndInstall.bind(this),
      'click'
    );
    this.controlPanel.appendChild(closeAndInstallButton);
    closeAndInstallButton.focus();
  }

  private appendErrorButtons(): void {
    this.clearButtons();
    this.appendNotNowButton();

    const goToDownloadPageButton = this.createButton(
      nls.localize('arduino/ide-updater/goToDownloadButton', 'Go To Download')
    );
    this.addAction(
      goToDownloadPageButton,
      this.openDownloadPage.bind(this),
      'click'
    );
    this.controlPanel.appendChild(goToDownloadPageButton);
    goToDownloadPageButton.focus();
  }

  private openDownloadPage(): void {
    this.windowService.openNewWindow(DOWNLOAD_PAGE_URL, { external: true });
    this.close();
  }

  private skipVersion(): void {
    this.localStorageService.setData<string>(
      SKIP_IDE_VERSION,
      this.widget.updateInfo.version
    );
    this.close();
  }

  private startDownload(): void {
    this.widget.mergeUpdateProgress({
      downloadStarted: true,
    });
    this.clearButtons();
    this.updater.downloadUpdate();
  }

  private closeAndInstall() {
    this.updater.quitAndInstall();
    this.close();
  }

  override async open(
    data: UpdateInfo | undefined = undefined
  ): Promise<UpdateInfo | undefined> {
    if (data && data.version) {
      this.widget.mergeUpdateProgress({
        progressInfo: undefined,
        downloadStarted: false,
        downloadFinished: false,
        error: undefined,
      });
      this.widget.setUpdateInfo(data);
      return super.open();
    }
  }

  protected override onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg);
    this.widget.activate();
  }

  override close(): void {
    this.widget.dispose();
    if (
      this.widget.updateProgress?.downloadStarted &&
      !this.widget.updateProgress?.downloadFinished
    ) {
      this.updater.stopDownload();
    }
    super.close();
  }
}
