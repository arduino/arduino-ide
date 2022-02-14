import { Emitter } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import { UpdateInfo, ProgressInfo } from 'electron-updater';
import { IDEUpdaterClient } from '../../common/protocol/ide-updater-service';

@injectable()
export class IDEUpdaterClientImpl implements IDEUpdaterClient {
  protected readonly onErrorEmitter = new Emitter<Error>();
  protected readonly onCheckingForUpdateEmitter = new Emitter<void>();
  protected readonly onUpdateAvailableEmitter = new Emitter<UpdateInfo>();
  protected readonly onUpdateNotAvailableEmitter = new Emitter<UpdateInfo>();
  protected readonly onDownloadProgressEmitter = new Emitter<ProgressInfo>();
  protected readonly onDownloadFinishedEmitter = new Emitter<UpdateInfo>();

  readonly onError = this.onErrorEmitter.event;
  readonly onCheckingForUpdate = this.onCheckingForUpdateEmitter.event;
  readonly onUpdateAvailable = this.onUpdateAvailableEmitter.event;
  readonly onUpdateNotAvailable = this.onUpdateNotAvailableEmitter.event;
  readonly onDownloadProgressChanged = this.onDownloadProgressEmitter.event;
  readonly onDownloadFinished = this.onDownloadFinishedEmitter.event;

  notifyError(message: Error): void {
    this.onErrorEmitter.fire(message);
  }
  notifyCheckingForUpdate(message: void): void {
    this.onCheckingForUpdateEmitter.fire(message);
  }
  notifyUpdateAvailable(message: UpdateInfo): void {
    this.onUpdateAvailableEmitter.fire(message);
  }
  notifyUpdateNotAvailable(message: UpdateInfo): void {
    this.onUpdateNotAvailableEmitter.fire(message);
  }
  notifyDownloadProgressChanged(message: ProgressInfo): void {
    this.onDownloadProgressEmitter.fire(message);
  }
  notifyDownloadFinished(message: UpdateInfo): void {
    this.onDownloadFinishedEmitter.fire(message);
  }
}
