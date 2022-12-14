import { injectable } from '@theia/core/shared/inversify';
import type {
  NotificationServiceServer,
  NotificationServiceClient,
  AttachedBoardsChangeEvent,
  BoardsPackage,
  LibraryPackage,
  ConfigState,
  Sketch,
  ProgressMessage,
  IndexUpdateWillStartParams,
  IndexUpdateDidCompleteParams,
  IndexUpdateDidFailParams,
} from '../common/protocol';

@injectable()
export class NotificationServiceServerImpl
  implements NotificationServiceServer
{
  private readonly clients: NotificationServiceClient[] = [];

  notifyDidReinitialize(): void {
    this.clients.forEach((client) => client.notifyDidReinitialize());
  }

  notifyIndexUpdateWillStart(params: IndexUpdateWillStartParams): void {
    this.clients.forEach((client) => client.notifyIndexUpdateWillStart(params));
  }

  notifyIndexUpdateDidProgress(progressMessage: ProgressMessage): void {
    this.clients.forEach((client) =>
      client.notifyIndexUpdateDidProgress(progressMessage)
    );
  }

  notifyIndexUpdateDidComplete(params: IndexUpdateDidCompleteParams): void {
    this.clients.forEach((client) =>
      client.notifyIndexUpdateDidComplete(params)
    );
  }

  notifyIndexUpdateDidFail(params: IndexUpdateDidFailParams): void {
    this.clients.forEach((client) => client.notifyIndexUpdateDidFail(params));
  }

  notifyDaemonDidStart(port: string): void {
    this.clients.forEach((client) => client.notifyDaemonDidStart(port));
  }

  notifyDaemonDidStop(): void {
    this.clients.forEach((client) => client.notifyDaemonDidStop());
  }

  notifyPlatformDidInstall(event: { item: BoardsPackage }): void {
    this.clients.forEach((client) => client.notifyPlatformDidInstall(event));
  }

  notifyPlatformDidUninstall(event: { item: BoardsPackage }): void {
    this.clients.forEach((client) => client.notifyPlatformDidUninstall(event));
  }

  notifyLibraryDidInstall(event: { item: LibraryPackage }): void {
    this.clients.forEach((client) => client.notifyLibraryDidInstall(event));
  }

  notifyLibraryDidUninstall(event: { item: LibraryPackage }): void {
    this.clients.forEach((client) => client.notifyLibraryDidUninstall(event));
  }

  notifyAttachedBoardsDidChange(event: AttachedBoardsChangeEvent): void {
    this.clients.forEach((client) =>
      client.notifyAttachedBoardsDidChange(event)
    );
  }

  notifyConfigDidChange(event: ConfigState): void {
    this.clients.forEach((client) => client.notifyConfigDidChange(event));
  }

  notifyRecentSketchesDidChange(event: { sketches: Sketch[] }): void {
    this.clients.forEach((client) =>
      client.notifyRecentSketchesDidChange(event)
    );
  }

  setClient(client: NotificationServiceClient): void {
    this.clients.push(client);
  }

  disposeClient(client: NotificationServiceClient): void {
    const index = this.clients.indexOf(client);
    if (index === -1) {
      console.warn(
        'Could not dispose notification service client. It was not registered.'
      );
      return;
    }
    this.clients.splice(index, 1);
  }

  dispose(): void {
    for (const client of this.clients) {
      this.disposeClient(client);
    }
    this.clients.length = 0;
  }
}
