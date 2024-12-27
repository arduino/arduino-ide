import { injectable } from '@theia/core/shared/inversify';
import {
  UpdateInfo,
  CancellationToken,
  autoUpdater,
  UpdateFileInfo,
} from 'electron-updater';
import fetch, { Response } from 'node-fetch';
import { UpdateChannel } from '../../browser/arduino-preferences';
import {
  IDEUpdater,
  IDEUpdaterClient,
  ReleaseNoteInfo,
} from '../../common/protocol/ide-updater';

const CHANGELOG_BASE_URL = 'https://www.zxjian.com/api/databook';

@injectable()
export class IDEUpdaterImpl implements IDEUpdater {
  private isAlreadyChecked = false;
  private updater = autoUpdater;
  private cancellationToken?: CancellationToken;
  protected theiaFEClient?: IDEUpdaterClient;
  protected clients: Array<IDEUpdaterClient> = [];

  constructor() {
    this.updater.on('checking-for-update', (e) => {
      this.clients.forEach((c) => c.notifyCheckedForUpdate(e));
    });
    this.updater.on('update-available', (e) => {
      this.clients.forEach((c) => c.notifyUpdateAvailableFound(e));
    });
    this.updater.on('update-not-available', (e) => {
      this.clients.forEach((c) => c.notifyUpdateAvailableNotFound(e));
    });
    this.updater.on('download-progress', (e) => {
      this.clients.forEach((c) => c.notifyDownloadProgressChanged(e));
    });
    this.updater.on('update-downloaded', (e) => {
      this.clients.forEach((c) => c.notifyDownloadFinished(e));
    });
    this.updater.on('error', (e) => {
      this.clients.forEach((c) => c.notifyUpdaterFailed(e));
    });
  }

  // 异步初始化函数，接收两个参数：更新通道和基础URL
  async init(channel: UpdateChannel, baseUrl: string): Promise<void> {
    // 设置自动下载为false
    this.updater.autoDownload = false;
    // 设置更新通道
    this.updater.channel = channel;
    // 设置更新源URL
    this.updater.setFeedURL({
      // 提供商为通用
      provider: 'generic',
      // URL为baseUrl加上更新通道对应的字符串
      url: `${baseUrl}/${channel === UpdateChannel.Nightly ? 'nightly' : ''}`,
      // 更新通道
      channel,
    });
  }

  setClient(client: IDEUpdaterClient | undefined): void {
    if (client) this.clients.push(client);
  }

  // 检查是否有更新
  async checkForUpdates(initialCheck?: boolean): Promise<UpdateInfo | void> {
    // 如果是初始检查
    // 如果initialCheck为真
    if (initialCheck) {
      // 如果isAlreadyChecked为真，则返回一个已解决的Promise
      if (this.isAlreadyChecked) return Promise.resolve();
      // 否则，将isAlreadyChecked设置为真
      this.isAlreadyChecked = true;
    }

    // 获取更新信息和取消令牌
    let { updateInfo, cancellationToken } =
      await this.updater.checkForUpdates();

    // 将取消令牌赋值给实例变量
    this.cancellationToken = cancellationToken;
    // 如果当前版本小于更新版本
    if (this.updater.currentVersion.compare(updateInfo.version) === -1) {
      /*
        ` latest.txt `指向CI生成的最新更改日志，
        因此我们需要发出第一个GET请求来获取更改日志的文件名，
        第二个请求来获取实际的更改日志文件
      */
      try {
        // let response: Response | null = await fetch(
        //   `${CHANGELOG_BASE_URL}/latest.txt`
        // );
        // const latestChangelogFileName = response.ok
        //   ? await response.text()
        //   : null;
        // response = latestChangelogFileName
        //   ? await fetch(`${CHANGELOG_BASE_URL}/${latestChangelogFileName}`)
        //   : null;
        // // 获取response的ok属性，如果为true，则将response的text属性赋值给changelog，否则将changelog赋值为null
        // const changelog = response?.ok ? await response?.text() : null;
        // // 定义当前版本标题
        // const currentVersionHeader = `\n\n---\n\n## ${this.updater.currentVersion}\n\n`;
        // // 在changelog中查找当前版本标题的索引
        // const currentVersionIndex = changelog?.indexOf(currentVersionHeader);
        // const newChangelog =
        //   currentVersionIndex && currentVersionIndex > 0
        //     ? changelog?.slice(0, currentVersionIndex)
        //     : changelog;
        let response: Response | null = await fetch(
          `${CHANGELOG_BASE_URL}/updateNotes.txt`
        );
        const updateNotes = response.ok ? await response.text() : null;
        updateInfo.releaseNotes = updateNotes;
      } catch {
        /*
          如果更新日志的请求失败，我们会避免把它显示给用户，但仍然会显示更新信息
        */
      }
      return updateInfo;
    }
  }

  // 异步下载更新
  async downloadUpdate(): Promise<void> {
    try {
      // 调用updater的downloadUpdate方法，传入取消令牌
      await this.updater.downloadUpdate(this.cancellationToken);
    } catch (e) {
      // 捕获异常
      if (e.message === 'cancelled') return;
      // 遍历clients，调用notifyUpdaterFailed方法，传入异常
      this.clients.forEach((c) => c.notifyUpdaterFailed(e));
    }
  }

  stopDownload(): void {
    this.cancellationToken?.cancel();
  }

  quitAndInstall(): void {
    this.updater.quitAndInstall();
  }

  disconnectClient(client: IDEUpdaterClient): void {
    const index = this.clients.indexOf(client);
    if (index !== -1) {
      this.clients.splice(index, 1);
    }
  }

  dispose(): void {
    this.clients.forEach(this.disconnectClient.bind(this));
  }
}

export class MyUpdateInfo implements UpdateInfo {
  /**
   * The version.
   */
  version: string;
  files: Array<UpdateFileInfo>;
  /** @deprecated */
  path: string;
  /** @deprecated */
  sha512: string;
  /**
   * The release name.
   */
  releaseName?: string | null;
  /**
   * The release notes. List if `updater.fullChangelog` is set to `true`, `string` otherwise.
   */
  releaseNotes?: string | Array<ReleaseNoteInfo> | null;
  /**
   * The release date.
   */
  releaseDate: string;
  /**
   * The [staged rollout](/auto-update#staged-rollouts) percentage, 0-100.
   */
  readonly stagingPercentage?: number;
}
