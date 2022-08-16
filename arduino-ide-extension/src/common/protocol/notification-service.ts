import type { JsonRpcServer } from '@theia/core/lib/common/messaging/proxy-factory';
import type {
  AttachedBoardsChangeEvent,
  BoardsPackage,
  Config,
  ProgressMessage,
  Sketch,
} from '../protocol';
import type { LibraryPackage } from './library-service';

export interface NotificationServiceClient {
  notifyIndexWillUpdate(progressId: string): void;
  notifyIndexUpdateDidProgress(progressMessage: ProgressMessage): void;
  notifyIndexDidUpdate(progressId: string): void;
  notifyIndexUpdateDidFail({
    progressId,
    message,
  }: {
    progressId: string;
    message: string;
  }): void;
  notifyDaemonDidStart(port: string): void;
  notifyDaemonDidStop(): void;
  notifyConfigDidChange(event: { config: Config | undefined }): void;
  notifyPlatformDidInstall(event: { item: BoardsPackage }): void;
  notifyPlatformDidUninstall(event: { item: BoardsPackage }): void;
  notifyLibraryDidInstall(event: { item: LibraryPackage }): void;
  notifyLibraryDidUninstall(event: { item: LibraryPackage }): void;
  notifyAttachedBoardsDidChange(event: AttachedBoardsChangeEvent): void;
  notifyRecentSketchesDidChange(event: { sketches: Sketch[] }): void;
  notifyUploadAttemptInProgress(event: boolean): void;
}

export const NotificationServicePath = '/services/notification-service';
export const NotificationServiceServer = Symbol('NotificationServiceServer');
export interface NotificationServiceServer
  extends Required<NotificationServiceClient>,
    JsonRpcServer<NotificationServiceClient> {
  disposeClient(client: NotificationServiceClient): void;
}
