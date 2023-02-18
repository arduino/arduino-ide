import type { JsonRpcServer } from '@theia/core/lib/common/messaging/proxy-factory';
import type {
  AttachedBoardsChangeEvent,
  BoardsPackage,
  ConfigState,
  ProgressMessage,
  Sketch,
  IndexType,
} from '../protocol';
import type { LibraryPackage } from './library-service';

/**
 * Values are [ISO 8601](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString)
 * strings representing the date-time when the update of the index has been completed.
 */
export type IndexUpdateSummary = {
  [T in IndexType]: string;
} & { message?: string };
export interface IndexUpdateParams {
  /**
   * Application unique ID of the progress.
   */
  readonly progressId: string;
  /**
   * The type of the index is which is being updated.
   */
  readonly types: IndexType[];
}
export type IndexUpdateWillStartParams = IndexUpdateParams;
export interface IndexUpdateDidCompleteParams
  extends Omit<IndexUpdateParams, 'types'> {
  readonly summary: IndexUpdateSummary;
}
export interface IndexUpdateDidFailParams extends IndexUpdateParams {
  /**
   * Describes the reason of the index update failure.
   */
  readonly message: string;
}

export interface NotificationServiceClient {
  // The cached state of the core client. Libraries, examples, etc. has been updated.
  // This can happen without an index update. For example, changing the `directories.user` location.
  // An index update always implicitly involves a re-initialization without notifying via this method.
  notifyDidReinitialize(): void;

  // Index
  notifyIndexUpdateWillStart(params: IndexUpdateWillStartParams): void;
  notifyIndexUpdateDidProgress(progressMessage: ProgressMessage): void;
  notifyIndexUpdateDidComplete(params: IndexUpdateDidCompleteParams): void;
  notifyIndexUpdateDidFail(params: IndexUpdateDidFailParams): void;

  // Daemon
  notifyDaemonDidStart(port: string): void;
  notifyDaemonDidStop(): void;

  // CLI config
  notifyConfigDidChange(event: ConfigState): void;

  // Platforms
  notifyPlatformDidInstall(event: { item: BoardsPackage }): void;
  notifyPlatformDidUninstall(event: { item: BoardsPackage }): void;

  // Libraries
  notifyLibraryDidInstall(event: {
    item: LibraryPackage | 'zip-install';
  }): void;
  notifyLibraryDidUninstall(event: { item: LibraryPackage }): void;

  // Boards discovery
  notifyAttachedBoardsDidChange(event: AttachedBoardsChangeEvent): void;
  notifyRecentSketchesDidChange(event: { sketches: Sketch[] }): void;
}

export const NotificationServicePath = '/services/notification-service';
export const NotificationServiceServer = Symbol('NotificationServiceServer');
export interface NotificationServiceServer
  extends Required<NotificationServiceClient>,
    JsonRpcServer<NotificationServiceClient> {
  disposeClient(client: NotificationServiceClient): void;
}
