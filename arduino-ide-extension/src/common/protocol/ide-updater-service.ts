import { JsonRpcServer } from '@theia/core/lib/common/messaging/proxy-factory';
import { Event } from '@theia/core/lib/common/event';

export interface ProgressInfo {
  total: number;
  delta: number;
  transferred: number;
  percent: number;
  bytesPerSecond: number;
}

export interface ReleaseNoteInfo {
  readonly version: string;
  readonly note: string | null;
}

export interface BlockMapDataHolder {
  size?: number;
  blockMapSize?: number;
  readonly sha512: string;
  readonly isAdminRightsRequired?: boolean;
}

export interface UpdateFileInfo extends BlockMapDataHolder {
  url: string;
}

export type UpdateInfo = {
  readonly version: string;
  readonly files: Array<UpdateFileInfo>;
  releaseName?: string | null;
  releaseNotes?: string | Array<ReleaseNoteInfo> | null;
  releaseDate: string;
  readonly stagingPercentage?: number;
};

export interface ProgressInfo {
  total: number;
  delta: number;
  transferred: number;
  percent: number;
  bytesPerSecond: number;
}

export const IDEUpdaterServicePath = '/services/ide-updater';
export const IDEUpdaterService = Symbol('IDEUpdaterService');
export interface IDEUpdaterService
  extends JsonRpcServer<IDEUpdaterServiceClient> {
  checkForUpdates(): Promise<UpdateInfo | void>;
  downloadUpdate(): Promise<void>;
  quitAndInstall(): void;
  stopDownload(): void;
}

export const IDEUpdaterServiceClient = Symbol('IDEUpdaterServiceClient');
export interface IDEUpdaterServiceClient {
  onError: Event<Error>;
  onCheckingForUpdate: Event<void>;
  onUpdateAvailable: Event<UpdateInfo>;
  onUpdateNotAvailable: Event<UpdateInfo>;
  onDownloadProgressChanged: Event<ProgressInfo>;
  onDownloadFinished: Event<UpdateInfo>;
  notifyError(message: Error): void;
  notifyCheckingForUpdate(message: void): void;
  notifyUpdateAvailable(message: UpdateInfo): void;
  notifyUpdateNotAvailable(message: UpdateInfo): void;
  notifyDownloadProgressChanged(message: ProgressInfo): void;
  notifyDownloadFinished(message: UpdateInfo): void;
}
