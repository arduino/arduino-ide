import { inject, injectable, postConstruct } from 'inversify';
import { Emitter } from '@theia/core/lib/common/event';
import { JsonRpcProxy } from '@theia/core/lib/common/messaging/proxy-factory';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application';
import { NotificationServiceClient, NotificationServiceServer } from '../common/protocol/notification-service';
import { AttachedBoardsChangeEvent, BoardsPackage, LibraryPackage, Config } from '../common/protocol';

@injectable()
export class NotificationCenter implements NotificationServiceClient, FrontendApplicationContribution {

    @inject(NotificationServiceServer)
    protected readonly server: JsonRpcProxy<NotificationServiceServer>;

    protected readonly indexUpdatedEmitter = new Emitter<void>();
    protected readonly daemonStartedEmitter = new Emitter<void>();
    protected readonly daemonStoppedEmitter = new Emitter<void>();
    protected readonly configChangedEmitter = new Emitter<{ config: Config | undefined }>();
    protected readonly platformInstalledEmitter = new Emitter<{ item: BoardsPackage }>();
    protected readonly platformUninstalledEmitter = new Emitter<{ item: BoardsPackage }>();
    protected readonly libraryInstalledEmitter = new Emitter<{ item: LibraryPackage }>();
    protected readonly libraryUninstalledEmitter = new Emitter<{ item: LibraryPackage }>();
    protected readonly attachedBoardsChangedEmitter = new Emitter<AttachedBoardsChangeEvent>();

    protected readonly toDispose = new DisposableCollection(
        this.indexUpdatedEmitter,
        this.daemonStartedEmitter,
        this.daemonStoppedEmitter,
        this.configChangedEmitter,
        this.platformInstalledEmitter,
        this.platformUninstalledEmitter,
        this.libraryInstalledEmitter,
        this.libraryUninstalledEmitter,
        this.attachedBoardsChangedEmitter
    );

    readonly onIndexUpdated = this.indexUpdatedEmitter.event;
    readonly onDaemonStarted = this.daemonStartedEmitter.event;
    readonly onDaemonStopped = this.daemonStoppedEmitter.event;
    readonly onConfigChanged = this.configChangedEmitter.event;
    readonly onPlatformInstalled = this.platformInstalledEmitter.event;
    readonly onPlatformUninstalled = this.platformUninstalledEmitter.event;
    readonly onLibraryInstalled = this.libraryInstalledEmitter.event;
    readonly onLibraryUninstalled = this.libraryUninstalledEmitter.event;
    readonly onAttachedBoardsChanged = this.attachedBoardsChangedEmitter.event;

    @postConstruct()
    protected init(): void {
        this.server.setClient(this);
    }

    onStop(): void {
        this.toDispose.dispose();
    }

    notifyIndexUpdated(): void {
        this.indexUpdatedEmitter.fire();
    }

    notifyDaemonStarted(): void {
        this.daemonStartedEmitter.fire();
    }

    notifyDaemonStopped(): void {
        this.daemonStoppedEmitter.fire();
    }

    notifyConfigChanged(event: { config: Config | undefined }): void {
        this.configChangedEmitter.fire(event);
    }

    notifyPlatformInstalled(event: { item: BoardsPackage }): void {
        this.platformInstalledEmitter.fire(event);
    }

    notifyPlatformUninstalled(event: { item: BoardsPackage }): void {
        this.platformUninstalledEmitter.fire(event);
    }

    notifyLibraryInstalled(event: { item: LibraryPackage }): void {
        this.libraryInstalledEmitter.fire(event);
    }

    notifyLibraryUninstalled(event: { item: LibraryPackage }): void {
        this.libraryUninstalledEmitter.fire(event);
    }

    notifyAttachedBoardsChanged(event: AttachedBoardsChangeEvent): void {
        this.attachedBoardsChangedEmitter.fire(event);
    }

}
