import {
  ApplicationConnectionStatusContribution as TheiaApplicationConnectionStatusContribution,
  ConnectionStatus,
  FrontendConnectionStatusService as TheiaFrontendConnectionStatusService,
} from '@theia/core/lib/browser/connection-status-service';
import type { FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application';
import { WebSocketConnectionProvider } from '@theia/core/lib/browser/index';
import { StatusBarAlignment } from '@theia/core/lib/browser/status-bar/status-bar';
import { Disposable } from '@theia/core/lib/common/disposable';
import { Emitter, Event } from '@theia/core/lib/common/event';
import { nls } from '@theia/core/lib/common/nls';
import {
  inject,
  injectable,
  postConstruct,
} from '@theia/core/shared/inversify';
import { NotificationManager } from '@theia/messages/lib/browser/notifications-manager';
import debounce from 'lodash.debounce';
import { ArduinoDaemon } from '../../../common/protocol';
import { assertUnreachable } from '../../../common/utils';
import { CreateFeatures } from '../../create/create-features';
import { NotificationCenter } from '../../notification-center';

@injectable()
export class IsOnline implements FrontendApplicationContribution {
  private readonly onDidChangeOnlineEmitter = new Emitter<boolean>();
  private _online = false;
  private stopped = false;

  onStart(): void {
    import('is-online').then((module) => {
      const checkOnline = async () => {
        if (!this.stopped) {
          try {
            const online = await module.default();
            this.setOnline(online);
          } finally {
            window.setTimeout(() => checkOnline(), 6_000); // 6 seconds poll interval
          }
        }
      };
      checkOnline();
    });
  }

  onStop(): void {
    this.stopped = true;
    this.onDidChangeOnlineEmitter.dispose();
  }

  get online(): boolean {
    return this._online;
  }

  get onDidChangeOnline(): Event<boolean> {
    return this.onDidChangeOnlineEmitter.event;
  }

  private setOnline(online: boolean): void {
    const oldOnline = this._online;
    this._online = online;
    if (!this.stopped && this._online !== oldOnline) {
      this.onDidChangeOnlineEmitter.fire(this._online);
    }
  }
}

@injectable()
export class DaemonPort implements FrontendApplicationContribution {
  @inject(ArduinoDaemon)
  private readonly daemon: ArduinoDaemon;
  @inject(NotificationCenter)
  private readonly notificationCenter: NotificationCenter;

  private readonly onPortDidChangeEmitter = new Emitter<number | undefined>();
  private _port: number | undefined;

  onStart(): void {
    this.daemon.tryGetPort().then(
      (port) => this.setPort(port),
      (reason) =>
        console.warn('Could not retrieve the CLI daemon port.', reason)
    );
    this.notificationCenter.onDaemonDidStart((port) => this.setPort(port));
    this.notificationCenter.onDaemonDidStop(() => this.setPort(undefined));
  }

  onStop(): void {
    this.onPortDidChangeEmitter.dispose();
  }

  get port(): number | undefined {
    return this._port;
  }

  get onDidChangePort(): Event<number | undefined> {
    return this.onPortDidChangeEmitter.event;
  }

  private setPort(port: number | undefined): void {
    const oldPort = this._port;
    this._port = port;
    if (this._port !== oldPort) {
      this.onPortDidChangeEmitter.fire(this._port);
    }
  }
}

@injectable()
export class FrontendConnectionStatusService extends TheiaFrontendConnectionStatusService {
  @inject(DaemonPort)
  private readonly daemonPort: DaemonPort;
  @inject(IsOnline)
  private readonly isOnline: IsOnline;
  @inject(WebSocketConnectionProvider)
  private readonly connectionProvider: WebSocketConnectionProvider;

  @postConstruct()
  protected override init(): void {
    this.schedulePing();
    const refresh = debounce(() => {
      this.updateStatus(Boolean(this.daemonPort.port) && this.isOnline.online);
      this.schedulePing();
    }, this.options.offlineTimeout - 10);
    this.wsConnectionProvider.onIncomingMessageActivity(() => refresh());
  }

  protected override async performPingRequest(): Promise<void> {
    if (!this.connectionProvider['socket'].connected) {
      this.updateStatus(false);
      return;
    }
    try {
      await this.pingService.ping();
      this.updateStatus(this.isOnline.online);
    } catch (e) {
      this.updateStatus(false);
      this.logger.error(e);
    }
  }
}

const connectionStatusStatusBar = 'connection-status';
const theiaOffline = 'theia-mod-offline';

export type OfflineConnectionStatus =
  /**
   * There is no websocket connection between the frontend and the backend.
   */
  | 'backend'
  /**
   * The CLI daemon port is not available. Could not establish the gRPC connection between the backend and the CLI.
   */
  | 'daemon'
  /**
   * Cloud not connect to the Internet from the browser.
   */
  | 'internet';

@injectable()
export class ApplicationConnectionStatusContribution extends TheiaApplicationConnectionStatusContribution {
  @inject(DaemonPort)
  private readonly daemonPort: DaemonPort;
  @inject(IsOnline)
  private readonly isOnline: IsOnline;
  // @inject(MessageService)
  // private readonly messageService: MessageService;
  @inject(NotificationManager)
  private readonly notificationManager: NotificationManager;
  @inject(CreateFeatures)
  private readonly createFeatures: CreateFeatures;
  @inject(WebSocketConnectionProvider)
  private readonly connectionProvider: WebSocketConnectionProvider;

  private readonly offlineStatusDidChangeEmitter = new Emitter<
    OfflineConnectionStatus | undefined
  >();
  private noInternetConnectionNotificationId: string | undefined;
  private _offlineStatus: OfflineConnectionStatus | undefined;

  get offlineStatus(): OfflineConnectionStatus | undefined {
    return this._offlineStatus;
  }

  get onOfflineStatusDidChange(): Event<OfflineConnectionStatus | undefined> {
    return this.offlineStatusDidChangeEmitter.event;
  }

  protected override onStateChange(state: ConnectionStatus): void {
    if (
      (!Boolean(this.daemonPort.port) || !this.isOnline.online) &&
      state === ConnectionStatus.ONLINE
    ) {
      return;
    }
    super.onStateChange(state);
  }

  protected override handleOffline(): void {
    const params = <OfflineMessageParams>{
      port: this.daemonPort.port,
      online: this.isOnline.online,
      backendConnected: this.connectionProvider['socket'].connected, // https://github.com/arduino/arduino-ide/issues/2081
    };
    this._offlineStatus = offlineConnectionStatusType(params);
    const { text, tooltip } = offlineMessage(params);
    this.statusBar.setElement(connectionStatusStatusBar, {
      alignment: StatusBarAlignment.LEFT,
      text,
      tooltip,
      priority: 5000,
    });
    document.body.classList.add(theiaOffline);
    this.toDisposeOnOnline.pushAll([
      Disposable.create(() =>
        this.statusBar.removeElement(connectionStatusStatusBar)
      ),
      Disposable.create(() => document.body.classList.remove(theiaOffline)),
      Disposable.create(() => {
        this._offlineStatus = undefined;
        this.fireStatusDidChange();
      }),
    ]);
    if (!this.isOnline.online) {
      // const text = nls.localize(
      //   'arduino/connectionStatus/connectionLost',
      //   "Connection lost. Cloud sketch actions and updates won't be available."
      // );
      // this.noInternetConnectionNotificationId = this.notificationManager[
      //   'getMessageId'
      // ]({ text, type: MessageType.Warning });
      // if (this.createFeatures.enabled) {
      //   this.messageService.warn(text);
      // }
      this.toDisposeOnOnline.push(
        Disposable.create(() => this.clearNoInternetConnectionNotification())
      );
    }
    this.fireStatusDidChange();
  }

  private clearNoInternetConnectionNotification(): void {
    if (this.noInternetConnectionNotificationId) {
      this.notificationManager.clear(this.noInternetConnectionNotificationId);
      this.noInternetConnectionNotificationId = undefined;
    }
  }

  private fireStatusDidChange(): void {
    if (this.createFeatures.enabled) {
      return this.offlineStatusDidChangeEmitter.fire(this._offlineStatus);
    }
  }
}

interface OfflineMessageParams {
  readonly port: string | undefined;
  readonly online: boolean;
  readonly backendConnected: boolean;
}
interface OfflineMessage {
  readonly text: string;
  readonly tooltip: string;
}

/**
 * (non-API) exported for testing
 *
 * The precedence of the offline states are the following:
 *  - No connection to the Theia backend,
 *  - CLI daemon is offline, and
 *  - There is no Internet connection.
 */
export function offlineMessage(params: OfflineMessageParams): OfflineMessage {
  const statusType = offlineConnectionStatusType(params);
  const text = getOfflineText(statusType);
  const tooltip = getOfflineTooltip(statusType);
  return { text, tooltip };
}

function offlineConnectionStatusType(
  params: OfflineMessageParams
): OfflineConnectionStatus {
  const { port, online, backendConnected } = params;
  if (!backendConnected || (port && online)) {
    return 'backend';
  }
  if (!port) {
    return 'daemon';
  }
  return 'internet';
}

export const backendOfflineText = nls.localize('theia/core/offline', 'Offline');
export const daemonOfflineText = nls.localize(
  'theia/core/daemonOffline',
  'CLI Daemon Offline'
);
export const offlineText = nls.localize('theia/core/offlineText', 'Offline');
export const backendOfflineTooltip = nls.localize(
  'theia/core/cannotConnectBackend',
  'Cannot connect to the backend.'
);
export const daemonOfflineTooltip = nls.localize(
  'theia/core/cannotConnectDaemon',
  'Cannot connect to the CLI daemon.'
);
export const offlineTooltip = offlineText;

function getOfflineText(statusType: OfflineConnectionStatus): string {
  switch (statusType) {
    case 'backend':
      return backendOfflineText;
    case 'daemon':
      return '$(bolt) ' + daemonOfflineText;
    case 'internet':
      return '$(alert) ' + offlineText;
    default:
      assertUnreachable(statusType);
  }
}

function getOfflineTooltip(statusType: OfflineConnectionStatus): string {
  switch (statusType) {
    case 'backend':
      return backendOfflineTooltip;
    case 'daemon':
      return daemonOfflineTooltip;
    case 'internet':
      return offlineTooltip;
    default:
      assertUnreachable(statusType);
  }
}
