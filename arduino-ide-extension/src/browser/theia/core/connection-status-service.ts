import {
  inject,
  injectable,
  postConstruct,
} from '@theia/core/shared/inversify';
import { Disposable } from '@theia/core/lib/common/disposable';
import { StatusBarAlignment } from '@theia/core/lib/browser/status-bar/status-bar';
import {
  FrontendConnectionStatusService as TheiaFrontendConnectionStatusService,
  ApplicationConnectionStatusContribution as TheiaApplicationConnectionStatusContribution,
  ConnectionStatus,
} from '@theia/core/lib/browser/connection-status-service';
import { ArduinoDaemon } from '../../../common/protocol';
import { NotificationCenter } from '../../notification-center';
import { nls } from '@theia/core/lib/common';

@injectable()
export class FrontendConnectionStatusService extends TheiaFrontendConnectionStatusService {
  @inject(ArduinoDaemon)
  protected readonly daemon: ArduinoDaemon;

  @inject(NotificationCenter)
  protected readonly notificationCenter: NotificationCenter;

  protected connectedPort: string | undefined;

  @postConstruct()
  protected override async init(): Promise<void> {
    this.schedulePing();
    try {
      this.connectedPort = await this.daemon.tryGetPort();
    } catch {}
    this.notificationCenter.onDaemonStarted(
      (port) => (this.connectedPort = port)
    );
    this.notificationCenter.onDaemonStopped(
      () => (this.connectedPort = undefined)
    );
    this.wsConnectionProvider.onIncomingMessageActivity(() => {
      this.updateStatus(!!this.connectedPort);
      this.schedulePing();
    });
  }
}

@injectable()
export class ApplicationConnectionStatusContribution extends TheiaApplicationConnectionStatusContribution {
  @inject(ArduinoDaemon)
  protected readonly daemon: ArduinoDaemon;

  @inject(NotificationCenter)
  protected readonly notificationCenter: NotificationCenter;

  protected connectedPort: string | undefined;

  @postConstruct()
  protected async init(): Promise<void> {
    try {
      this.connectedPort = await this.daemon.tryGetPort();
    } catch {}
    this.notificationCenter.onDaemonStarted(
      (port) => (this.connectedPort = port)
    );
    this.notificationCenter.onDaemonStopped(
      () => (this.connectedPort = undefined)
    );
  }

  protected override onStateChange(state: ConnectionStatus): void {
    if (!this.connectedPort && state === ConnectionStatus.ONLINE) {
      return;
    }
    super.onStateChange(state);
  }

  protected override handleOffline(): void {
    this.statusBar.setElement('connection-status', {
      alignment: StatusBarAlignment.LEFT,
      text: this.connectedPort
        ? nls.localize('theia/core/offline', 'Offline')
        : '$(bolt) ' +
          nls.localize('theia/core/daemonOffline', 'CLI Daemon Offline'),
      tooltip: this.connectedPort
        ? nls.localize(
            'theia/core/cannotConnectBackend',
            'Cannot connect to the backend.'
          )
        : nls.localize(
            'theia/core/cannotConnectDaemon',
            'Cannot connect to the CLI daemon.'
          ),
      priority: 5000,
    });
    this.toDisposeOnOnline.push(
      Disposable.create(() => this.statusBar.removeElement('connection-status'))
    );
    document.body.classList.add('theia-mod-offline');
    this.toDisposeOnOnline.push(
      Disposable.create(() =>
        document.body.classList.remove('theia-mod-offline')
      )
    );
  }
}
