import { JsonRpcServer } from '@theia/core/lib/common/messaging/proxy-factory';
import { Event } from '@theia/core/lib/common/event';
import { UpdateChannel } from '../../browser/arduino-preferences';

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

export const IDEUpdaterPath = '/services/ide-updater';
export const IDEUpdater = Symbol('IDEUpdater');
export interface IDEUpdater extends JsonRpcServer<IDEUpdaterClient> {
  init(channel: UpdateChannel, baseUrl: string): Promise<void>;
  checkForUpdates(initialCheck?: boolean): Promise<UpdateInfo | void>;
  downloadUpdate(): Promise<void>;
  quitAndInstall(): void;
  stopDownload(): void;
  disconnectClient(client: IDEUpdaterClient): void;
}

export const IDEUpdaterClient = Symbol('IDEUpdaterClient');
export interface IDEUpdaterClient {
  onUpdaterDidFail: Event<Error>;
  onUpdaterDidCheckForUpdate: Event<void>;
  onUpdaterDidFindUpdateAvailable: Event<UpdateInfo>;
  onUpdaterDidNotFindUpdateAvailable: Event<UpdateInfo>;
  onDownloadProgressDidChange: Event<ProgressInfo>;
  onDownloadDidFinish: Event<UpdateInfo>;
  notifyUpdaterFailed(message: Error): void;
  notifyCheckedForUpdate(message: void): void;
  notifyUpdateAvailableFound(message: UpdateInfo): void;
  notifyUpdateAvailableNotFound(message: UpdateInfo): void;
  notifyDownloadProgressChanged(message: ProgressInfo): void;
  notifyDownloadFinished(message: UpdateInfo): void;
}

export const SKIP_IDE_VERSION = 'skipIDEVersion';
export const LAST_USED_IDE_VERSION = 'lastUsedIDEVersion';
