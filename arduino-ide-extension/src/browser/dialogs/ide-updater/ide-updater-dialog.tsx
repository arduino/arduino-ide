import React from '@theia/core/shared/react';
import {
  inject,
  injectable,
  postConstruct,
} from '@theia/core/shared/inversify';
import { DialogProps } from '@theia/core/lib/browser/dialogs';
import { Message } from '@theia/core/shared/@phosphor/messaging';
import { ReactDialog } from '../../theia/dialogs/dialogs';
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

@injectable()
export class IDEUpdaterDialogProps extends DialogProps {}

@injectable()
export class IDEUpdaterDialog extends ReactDialog<UpdateInfo | undefined> {
  @inject(IDEUpdater)
  private readonly updater: IDEUpdater;

  @inject(IDEUpdaterClient)
  private readonly updaterClient: IDEUpdaterClient;

  @inject(LocalStorageService)
  private readonly localStorageService: LocalStorageService;

  @inject(WindowService)
  private readonly windowService: WindowService;

  private _updateInfo: UpdateInfo | undefined;
  private _updateProgress: UpdateProgress = {};

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
      this.mergeUpdateProgress({ error });
    });
    this.updaterClient.onDownloadProgressDidChange((progressInfo) => {
      this.mergeUpdateProgress({ progressInfo });
    });
    this.updaterClient.onDownloadDidFinish(() => {
      this.appendInstallButtons();
      this.mergeUpdateProgress({ downloadFinished: true });
    });
  }

  protected render(): React.ReactNode {
    const hasControls = !!this.controlPanel.firstChild;
    const controlPanel = this.controlPanel;

    return (
      this.updateInfo && (
        <IDEUpdaterComponent
          updateInfo={this.updateInfo}
          updateProgress={this.updateProgress}
          openExternal={this.openExternal}
          hasControls={hasControls}
          controlPanel={controlPanel}
        />
      )
    );
  }

  private readonly openExternal = (url: string) =>
    this.windowService.openNewWindow(url, { external: true });

  get value(): UpdateInfo | undefined {
    return this.updateInfo;
  }

  protected override onAfterAttach(msg: Message): void {
    this.update();
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
    this.openExternal('https://www.arduino.cc/en/software');
    this.close();
  }

  private skipVersion(): void {
    if (!this.updateInfo) {
      console.warn(`Nothing to skip. No update info is available`);
      return;
    }
    this.localStorageService.setData<string>(
      SKIP_IDE_VERSION,
      this.updateInfo.version
    );
    this.close();
  }

  private startDownload(): void {
    this.mergeUpdateProgress({
      downloadStarted: true,
    });
    this.clearButtons();
    this.updater.downloadUpdate();
  }

  private closeAndInstall() {
    this.updater.quitAndInstall();
    this.close();
  }

  private set updateInfo(updateInfo: UpdateInfo | undefined) {
    this._updateInfo = updateInfo;
    this.update();
  }

  private get updateInfo(): UpdateInfo | undefined {
    return this._updateInfo;
  }

  private get updateProgress(): UpdateProgress {
    return this._updateProgress;
  }

  private mergeUpdateProgress(updateProgress: UpdateProgress): void {
    this._updateProgress = { ...this._updateProgress, ...updateProgress };
    this.update();
  }

  override async open(
    data: UpdateInfo | undefined = undefined
  ): Promise<UpdateInfo | undefined> {
    if (data && data.version) {
      this.mergeUpdateProgress({
        progressInfo: undefined,
        downloadStarted: false,
        downloadFinished: false,
        error: undefined,
      });
      this.updateInfo = data;
      return super.open();
    }
  }

  protected override onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg);
    this.update();
  }

  override close(): void {
    if (
      this.updateProgress?.downloadStarted &&
      !this.updateProgress?.downloadFinished
    ) {
      this.updater.stopDownload();
    }
    super.close();
  }
}
