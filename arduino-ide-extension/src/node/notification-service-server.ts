import { injectable } from '@theia/core/shared/inversify';
import type {
  NotificationServiceServer,
  NotificationServiceClient,
  AttachedBoardsChangeEvent,
  BoardsPackage,
  LibraryPackage,
  Config,
  Sketch,
  ProgressMessage,
} from '../common/protocol';

@injectable()
export class NotificationServiceServerImpl
  implements NotificationServiceServer
{
  private readonly clients: NotificationServiceClient[] = [];

  notifyIndexWillUpdate(progressId: string): void {
    this.clients.forEach((client) => client.notifyIndexWillUpdate(progressId));
  }

  notifyIndexUpdateDidProgress(progressMessage: ProgressMessage): void {
    this.clients.forEach((client) =>
      client.notifyIndexUpdateDidProgress(progressMessage)
    );
  }

  notifyIndexDidUpdate(progressId: string): void {
    this.clients.forEach((client) => client.notifyIndexDidUpdate(progressId));
  }

  notifyIndexUpdateDidFail({
    progressId,
    message,
  }: {
    progressId: string;
    message: string;
  }): void {
    this.clients.forEach((client) =>
      client.notifyIndexUpdateDidFail({ progressId, message })
    );
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

  notifyConfigDidChange(event: { config: Config | undefined }): void {
    this.clients.forEach((client) => client.notifyConfigDidChange(event));
  }

  notifyRecentSketchesDidChange(event: { sketches: Sketch[] }): void {
    this.clients.forEach((client) =>
      client.notifyRecentSketchesDidChange(event)
    );
  }

  notifyUploadInProgress(event: boolean): void {
    this.clients.forEach((client) => client.notifyUploadInProgress(event));
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
