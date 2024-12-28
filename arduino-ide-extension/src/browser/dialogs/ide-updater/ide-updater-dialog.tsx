import React from '@theia/core/shared/react';
import {
  inject,
  injectable,
  postConstruct,
} from '@theia/core/shared/inversify';
import { DialogProps } from '@theia/core/lib/browser/dialogs';
import { Message } from '@theia/core/shared/@phosphor/messaging';
import { ReactDialog } from '../../theia/dialogs/dialogs';
import { IDEUpdaterComponent, UpdateProgress } from './ide-updater-component';
import {
  IDEUpdater,
  IDEUpdaterClient,
  SKIP_IDE_VERSION,
  UpdateInfo,
} from '../../../common/protocol/ide-updater';
import { LocalStorageService } from '@theia/core/lib/browser';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { sanitize } from 'dompurify';
import { nls } from '@theia/core';

@injectable()
export class IDEUpdaterDialogProps extends DialogProps { }

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
      title: '软件更新',
    });
    this.node.id = 'ide-updater-dialog-container';
    this.contentNode.classList.add('ide-updater-dialog');
    this.acceptButton = undefined;

    this.contentNode.style.width = '300px';
    this.contentNode.style.height = '200px';
    this.contentNode.style.borderBottom = '1px solid #f0f0f0';
    this.contentNode.style.padding = '5px 28px 0';
    this.contentNode.style.backgroundColor = '#ffffff';
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
    return (
      this.updateInfo && (
        <IDEUpdaterComponent
          updateInfo={this.updateInfo}
          updateProgress={this.updateProgress}
          contentNode={this.contentNode}
        />
      )
    );
  }

  // 定义一个私有只读的openExternal方法，用于打开一个新的窗口
  private readonly openExternal = (url: string) =>
    // 调用windowService的openNewWindow方法，传入url和{ external: true }参数
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
    // 添加关闭按钮
    this.appendCloseButton('下次再说');
    if (this.closeButton) {
      this.addCloseAction(this.closeButton, 'click');
    }
  }

  private appendInitialButtons(): void {
    this.clearButtons();

    const skipVersionButton = this.createButton('忽略更新');
    skipVersionButton.classList.add('secondary');
    skipVersionButton.classList.add('skip-version-button');
    this.addAction(skipVersionButton, this.skipVersion.bind(this), 'click');
    this.controlPanel.appendChild(skipVersionButton);

    this.appendNotNowButton();

    // 创建一个下载按钮
    const downloadButton = this.createButton('下载');
    // 为下载按钮添加点击事件，点击时调用startDownload方法
    this.addAction(downloadButton, this.startDownload.bind(this), 'click');
    // 将下载按钮添加到控制面板中
    this.controlPanel.appendChild(downloadButton);
    // 将下载按钮设置为焦点
    downloadButton.focus();
  }

  private appendInstallButtons(): void {
    this.clearButtons();
    this.appendNotNowButton();

    const closeAndInstallButton = this.createButton('关闭并安装');
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

    const goToDownloadPageButton = this.createButton('去下载');
    this.addAction(
      goToDownloadPageButton,
      this.openDownloadPage.bind(this),
      'click'
    );
    this.controlPanel.appendChild(goToDownloadPageButton);
    goToDownloadPageButton.focus();
  }

  private appendDonateFooter() {
    const footer = document.createElement('div');
    footer.classList.add('ide-updater-dialog--footer');
    const footerContent = document.createElement('div');
    footerContent.classList.add('ide-updater-dialog--footer-content');
    footer.appendChild(footerContent);

    const footerLink = document.createElement('a');
    footerLink.innerText = sanitize(
      nls.localize('arduino/ide-updater/donateLinkText', 'donate to support us')
    );
    footerLink.classList.add('ide-updater-dialog--footer-link');
    footerLink.onclick = () =>
      this.openExternal('https://www.arduino.cc/en/donate');

    const footerLinkIcon = document.createElement('span');
    footerLinkIcon.title = nls.localize(
      'arduino/ide-updater/donateLinkIconTitle',
      'open donation page'
    );
    footerLinkIcon.classList.add('ide-updater-dialog--footer-link-icon');
    footerLink.appendChild(footerLinkIcon);

    const placeholderKey = '%%link%%';
    const footerText = sanitize(
      nls.localize(
        'arduino/ide-updater/donateText',
        'Open source is love, {0}',
        placeholderKey
      )
    );
    const placeholder = footerText.indexOf(placeholderKey);
    if (placeholder !== -1) {
      const parts = footerText.split(placeholderKey);
      footerContent.appendChild(document.createTextNode(parts[0]));
      footerContent.appendChild(footerLink);
      footerContent.appendChild(document.createTextNode(parts[1]));
    } else {
      footerContent.appendChild(document.createTextNode(footerText));
      footerContent.appendChild(footerLink);
    }

    this.controlPanel.insertAdjacentElement('afterend', footer);
  }

  private openDownloadPage(): void {
    this.openExternal('https://www.lingzhilab.com/download.html');
    this.close();
  }

  // 跳过版本更新
  private skipVersion(): void {
    // 如果没有更新信息，则打印警告信息并返回
    if (!this.updateInfo) {
      console.warn(`没有什么可以忽略的。没有更新信息可用`);
      return;
    }
    // 将跳过的版本号存储到localStorage中
    this.localStorageService.setData<string>(
      SKIP_IDE_VERSION,
      this.updateInfo.version
    );
    // 关闭更新窗口
    this.close();
  }

  // 开始下载
  private startDownload(): void {
    // 设置下载开始标志
    this.mergeUpdateProgress({
      downloadStarted: true,
    });
    // 清除按钮
    this.clearButtons();
    this.appendDonateFooter();
    // 开始下载更新
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

  // 合并更新进度
  private mergeUpdateProgress(updateProgress: UpdateProgress): void {
    // 将_updateProgress和updateProgress合并
    this._updateProgress = { ...this._updateProgress, ...updateProgress };
    // 更新
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
