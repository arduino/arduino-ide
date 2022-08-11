import { Emitter } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import { UpdateInfo, ProgressInfo } from 'electron-updater';
import { IDEUpdaterClient } from '../../common/protocol/ide-updater';

@injectable()
export class IDEUpdaterClientImpl implements IDEUpdaterClient {
  protected readonly onUpdaterDidFailEmitter = new Emitter<Error>();
  protected readonly onUpdaterDidCheckForUpdateEmitter = new Emitter<void>();
  protected readonly onUpdaterDidFindUpdateAvailableEmitter =
    new Emitter<UpdateInfo>();
  protected readonly onUpdaterDidNotFindUpdateAvailableEmitter =
    new Emitter<UpdateInfo>();
  protected readonly onDownloadProgressDidChangeEmitter =
    new Emitter<ProgressInfo>();
  protected readonly onDownloadDidFinishEmitter = new Emitter<UpdateInfo>();

  readonly onUpdaterDidFail = this.onUpdaterDidFailEmitter.event;
  readonly onUpdaterDidCheckForUpdate =
    this.onUpdaterDidCheckForUpdateEmitter.event;
  readonly onUpdaterDidFindUpdateAvailable =
    this.onUpdaterDidFindUpdateAvailableEmitter.event;
  readonly onUpdaterDidNotFindUpdateAvailable =
    this.onUpdaterDidNotFindUpdateAvailableEmitter.event;
  readonly onDownloadProgressDidChange =
    this.onDownloadProgressDidChangeEmitter.event;
  readonly onDownloadDidFinish = this.onDownloadDidFinishEmitter.event;

  notifyUpdaterFailed(message: Error): void {
    this.onUpdaterDidFailEmitter.fire(message);
  }
  notifyCheckedForUpdate(message: void): void {
    this.onUpdaterDidCheckForUpdateEmitter.fire(message);
  }
  notifyUpdateAvailableFound(message: UpdateInfo): void {
    this.onUpdaterDidFindUpdateAvailableEmitter.fire(message);
  }
  notifyUpdateAvailableNotFound(message: UpdateInfo): void {
    this.onUpdaterDidNotFindUpdateAvailableEmitter.fire(message);
  }
  notifyDownloadProgressChanged(message: ProgressInfo): void {
    this.onDownloadProgressDidChangeEmitter.fire(message);
  }
  notifyDownloadFinished(message: UpdateInfo): void {
    this.onDownloadDidFinishEmitter.fire(message);
  }
}
