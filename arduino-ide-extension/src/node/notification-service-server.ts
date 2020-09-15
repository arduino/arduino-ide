import { injectable } from 'inversify';
import { NotificationServiceServer, NotificationServiceClient, AttachedBoardsChangeEvent, BoardsPackage, LibraryPackage, Config } from '../common/protocol';

@injectable()
export class NotificationServiceServerImpl implements NotificationServiceServer {

    protected readonly clients: NotificationServiceClient[] = [];

    notifyIndexUpdated(): void {
        this.clients.forEach(client => client.notifyIndexUpdated());
    }

    notifyDaemonStarted(): void {
        this.clients.forEach(client => client.notifyDaemonStarted());
    }

    notifyDaemonStopped(): void {
        this.clients.forEach(client => client.notifyDaemonStopped());
    }

    notifyPlatformInstalled(event: { item: BoardsPackage }): void {
        this.clients.forEach(client => client.notifyPlatformInstalled(event));
    }

    notifyPlatformUninstalled(event: { item: BoardsPackage }): void {
        this.clients.forEach(client => client.notifyPlatformUninstalled(event));
    }

    notifyLibraryInstalled(event: { item: LibraryPackage }): void {
        this.clients.forEach(client => client.notifyLibraryInstalled(event));
    }

    notifyLibraryUninstalled(event: { item: LibraryPackage }): void {
        this.clients.forEach(client => client.notifyLibraryUninstalled(event));
    }

    notifyAttachedBoardsChanged(event: AttachedBoardsChangeEvent): void {
        this.clients.forEach(client => client.notifyAttachedBoardsChanged(event));
    }

    notifyConfigChanged(event: { config: Config | undefined }): void {
        this.clients.forEach(client => client.notifyConfigChanged(event));
    }

    setClient(client: NotificationServiceClient): void {
        this.clients.push(client);
    }

    disposeClient(client: NotificationServiceClient): void {
        const index = this.clients.indexOf(client);
        if (index === -1) {
            console.warn(`Could not dispose notification service client. It was not registered.`);
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
