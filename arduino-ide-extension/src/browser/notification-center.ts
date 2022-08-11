import {
  inject,
  injectable,
  postConstruct,
} from '@theia/core/shared/inversify';
import { Emitter } from '@theia/core/lib/common/event';
import { JsonRpcProxy } from '@theia/core/lib/common/messaging/proxy-factory';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application';
import {
  NotificationServiceClient,
  NotificationServiceServer,
} from '../common/protocol/notification-service';
import {
  AttachedBoardsChangeEvent,
  BoardsPackage,
  LibraryPackage,
  Config,
  Sketch,
  ProgressMessage,
} from '../common/protocol';
import {
  FrontendApplicationStateService,
  FrontendApplicationState,
} from '@theia/core/lib/browser/frontend-application-state';

@injectable()
export class NotificationCenter
  implements NotificationServiceClient, FrontendApplicationContribution
{
  @inject(NotificationServiceServer)
  protected readonly server: JsonRpcProxy<NotificationServiceServer>;

  @inject(FrontendApplicationStateService)
  private readonly appStateService: FrontendApplicationStateService;

  protected readonly indexDidUpdateEmitter = new Emitter<string>();
  protected readonly indexWillUpdateEmitter = new Emitter<string>();
  protected readonly indexUpdateDidProgressEmitter =
    new Emitter<ProgressMessage>();
  protected readonly indexUpdateDidFailEmitter = new Emitter<{
    progressId: string;
    message: string;
  }>();
  protected readonly daemonDidStartEmitter = new Emitter<string>();
  protected readonly daemonDidStopEmitter = new Emitter<void>();
  protected readonly configDidChangeEmitter = new Emitter<{
    config: Config | undefined;
  }>();
  protected readonly platformDidInstallEmitter = new Emitter<{
    item: BoardsPackage;
  }>();
  protected readonly platformDidUninstallEmitter = new Emitter<{
    item: BoardsPackage;
  }>();
  protected readonly libraryDidInstallEmitter = new Emitter<{
    item: LibraryPackage;
  }>();
  protected readonly libraryDidUninstallEmitter = new Emitter<{
    item: LibraryPackage;
  }>();
  protected readonly attachedBoardsDidChangeEmitter =
    new Emitter<AttachedBoardsChangeEvent>();
  protected readonly recentSketchesChangedEmitter = new Emitter<{
    sketches: Sketch[];
  }>();
  private readonly onAppStateDidChangeEmitter =
    new Emitter<FrontendApplicationState>();
  private readonly onUploadInProgressEmitter = new Emitter<boolean>();

  protected readonly toDispose = new DisposableCollection(
    this.indexWillUpdateEmitter,
    this.indexUpdateDidProgressEmitter,
    this.indexDidUpdateEmitter,
    this.indexUpdateDidFailEmitter,
    this.daemonDidStartEmitter,
    this.daemonDidStopEmitter,
    this.configDidChangeEmitter,
    this.platformDidInstallEmitter,
    this.platformDidUninstallEmitter,
    this.libraryDidInstallEmitter,
    this.libraryDidUninstallEmitter,
    this.attachedBoardsDidChangeEmitter,
    this.onUploadInProgressEmitter
  );

  readonly onIndexDidUpdate = this.indexDidUpdateEmitter.event;
  readonly onIndexWillUpdate = this.indexDidUpdateEmitter.event;
  readonly onIndexUpdateDidProgress = this.indexUpdateDidProgressEmitter.event;
  readonly onIndexUpdateDidFail = this.indexUpdateDidFailEmitter.event;
  readonly onDaemonDidStart = this.daemonDidStartEmitter.event;
  readonly onDaemonDidStop = this.daemonDidStopEmitter.event;
  readonly onConfigDidChange = this.configDidChangeEmitter.event;
  readonly onPlatformDidInstall = this.platformDidInstallEmitter.event;
  readonly onPlatformDidUninstall = this.platformDidUninstallEmitter.event;
  readonly onLibraryDidInstall = this.libraryDidInstallEmitter.event;
  readonly onLibraryDidUninstall = this.libraryDidUninstallEmitter.event;
  readonly onAttachedBoardsDidChange =
    this.attachedBoardsDidChangeEmitter.event;
  readonly onRecentSketchesDidChange = this.recentSketchesChangedEmitter.event;
  readonly onAppStateDidChange = this.onAppStateDidChangeEmitter.event;
  readonly onUploadInProgress = this.onUploadInProgressEmitter.event;

  @postConstruct()
  protected init(): void {
    this.server.setClient(this);
    this.toDispose.push(
      this.appStateService.onStateChanged((state) =>
        this.onAppStateDidChangeEmitter.fire(state)
      )
    );
  }

  onStop(): void {
    this.toDispose.dispose();
  }

  notifyIndexWillUpdate(progressId: string): void {
    this.indexWillUpdateEmitter.fire(progressId);
  }

  notifyIndexUpdateDidProgress(progressMessage: ProgressMessage): void {
    this.indexUpdateDidProgressEmitter.fire(progressMessage);
  }

  notifyIndexDidUpdate(progressId: string): void {
    this.indexDidUpdateEmitter.fire(progressId);
  }

  notifyIndexUpdateDidFail({
    progressId,
    message,
  }: {
    progressId: string;
    message: string;
  }): void {
    this.indexUpdateDidFailEmitter.fire({ progressId, message });
  }

  notifyDaemonDidStart(port: string): void {
    this.daemonDidStartEmitter.fire(port);
  }

  notifyDaemonDidStop(): void {
    this.daemonDidStopEmitter.fire();
  }

  notifyConfigDidChange(event: { config: Config | undefined }): void {
    this.configDidChangeEmitter.fire(event);
  }

  notifyPlatformDidInstall(event: { item: BoardsPackage }): void {
    this.platformDidInstallEmitter.fire(event);
  }

  notifyPlatformDidUninstall(event: { item: BoardsPackage }): void {
    this.platformDidUninstallEmitter.fire(event);
  }

  notifyLibraryDidInstall(event: { item: LibraryPackage }): void {
    this.libraryDidInstallEmitter.fire(event);
  }

  notifyLibraryDidUninstall(event: { item: LibraryPackage }): void {
    this.libraryDidUninstallEmitter.fire(event);
  }

  notifyAttachedBoardsDidChange(event: AttachedBoardsChangeEvent): void {
    this.attachedBoardsDidChangeEmitter.fire(event);
  }

  notifyRecentSketchesDidChange(event: { sketches: Sketch[] }): void {
    this.recentSketchesChangedEmitter.fire(event);
  }

  notifyUploadInProgress(event: boolean): void {
    this.onUploadInProgressEmitter.fire(event);
  }
}
