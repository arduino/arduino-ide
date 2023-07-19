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
  IndexUpdateDidCompleteParams,
  IndexUpdateDidFailParams,
  IndexUpdateWillStartParams,
  NotificationServiceClient,
  NotificationServiceServer,
} from '../common/protocol/notification-service';
import {
  AttachedBoardsChangeEvent,
  BoardsPackage,
  LibraryPackage,
  ConfigState,
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
  private readonly server: JsonRpcProxy<NotificationServiceServer>;

  @inject(FrontendApplicationStateService)
  private readonly appStateService: FrontendApplicationStateService;

  private readonly didReinitializeEmitter = new Emitter<void>();
  private readonly indexUpdateDidCompleteEmitter =
    new Emitter<IndexUpdateDidCompleteParams>();
  private readonly indexUpdateWillStartEmitter =
    new Emitter<IndexUpdateWillStartParams>();
  private readonly indexUpdateDidProgressEmitter =
    new Emitter<ProgressMessage>();
  private readonly indexUpdateDidFailEmitter =
    new Emitter<IndexUpdateDidFailParams>();
  private readonly daemonDidStartEmitter = new Emitter<string>();
  private readonly daemonDidStopEmitter = new Emitter<void>();
  private readonly configDidChangeEmitter = new Emitter<ConfigState>();
  private readonly platformDidInstallEmitter = new Emitter<{
    item: BoardsPackage;
  }>();
  private readonly platformDidUninstallEmitter = new Emitter<{
    item: BoardsPackage;
  }>();
  private readonly libraryDidInstallEmitter = new Emitter<{
    item: LibraryPackage | 'zip-install';
  }>();
  private readonly libraryDidUninstallEmitter = new Emitter<{
    item: LibraryPackage;
  }>();
  private readonly attachedBoardsDidChangeEmitter =
    new Emitter<AttachedBoardsChangeEvent>();
  private readonly recentSketchesChangedEmitter = new Emitter<{
    sketches: Sketch[];
  }>();
  private readonly onAppStateDidChangeEmitter =
    new Emitter<FrontendApplicationState>();

  private readonly toDispose = new DisposableCollection(
    this.didReinitializeEmitter,
    this.indexUpdateWillStartEmitter,
    this.indexUpdateDidProgressEmitter,
    this.indexUpdateDidCompleteEmitter,
    this.indexUpdateDidFailEmitter,
    this.daemonDidStartEmitter,
    this.daemonDidStopEmitter,
    this.configDidChangeEmitter,
    this.platformDidInstallEmitter,
    this.platformDidUninstallEmitter,
    this.libraryDidInstallEmitter,
    this.libraryDidUninstallEmitter,
    this.attachedBoardsDidChangeEmitter
  );

  readonly onDidReinitialize = this.didReinitializeEmitter.event;
  readonly onIndexUpdateDidComplete = this.indexUpdateDidCompleteEmitter.event;
  readonly onIndexUpdateWillStart = this.indexUpdateWillStartEmitter.event;
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

  notifyDidReinitialize(): void {
    this.didReinitializeEmitter.fire();
  }

  notifyIndexUpdateWillStart(params: IndexUpdateWillStartParams): void {
    this.indexUpdateWillStartEmitter.fire(params);
  }

  notifyIndexUpdateDidProgress(progressMessage: ProgressMessage): void {
    this.indexUpdateDidProgressEmitter.fire(progressMessage);
  }

  notifyIndexUpdateDidComplete(params: IndexUpdateDidCompleteParams): void {
    this.indexUpdateDidCompleteEmitter.fire(params);
  }

  notifyIndexUpdateDidFail(params: IndexUpdateDidFailParams): void {
    this.indexUpdateDidFailEmitter.fire(params);
  }

  notifyDaemonDidStart(port: string): void {
    this.daemonDidStartEmitter.fire(port);
  }

  notifyDaemonDidStop(): void {
    this.daemonDidStopEmitter.fire();
  }

  notifyConfigDidChange(event: ConfigState): void {
    this.configDidChangeEmitter.fire(event);
  }

  notifyPlatformDidInstall(event: { item: BoardsPackage }): void {
    this.platformDidInstallEmitter.fire(event);
  }

  notifyPlatformDidUninstall(event: { item: BoardsPackage }): void {
    this.platformDidUninstallEmitter.fire(event);
  }

  notifyLibraryDidInstall(event: {
    item: LibraryPackage | 'zip-install';
  }): void {
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
}
