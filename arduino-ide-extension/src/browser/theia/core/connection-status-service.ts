import { inject, injectable, postConstruct } from 'inversify';
import { Disposable } from '@theia/core/lib/common/disposable';
import { StatusBarAlignment } from '@theia/core/lib/browser/status-bar/status-bar';
import {
    FrontendConnectionStatusService as TheiaFrontendConnectionStatusService,
    ApplicationConnectionStatusContribution as TheiaApplicationConnectionStatusContribution,
    ConnectionStatus
} from '@theia/core/lib/browser/connection-status-service';
import { ArduinoDaemon } from '../../../common/protocol';
import { NotificationCenter } from '../../notification-center';

@injectable()
export class FrontendConnectionStatusService extends TheiaFrontendConnectionStatusService {

    @inject(ArduinoDaemon)
    protected readonly daemon: ArduinoDaemon;

    @inject(NotificationCenter)
    protected readonly notificationCenter: NotificationCenter;

    protected isRunning = false;

    @postConstruct()
    protected async init(): Promise<void> {
        this.schedulePing();
        try {
            this.isRunning = await this.daemon.isRunning();
        } catch { }
        this.notificationCenter.onDaemonStarted(() => this.isRunning = true);
        this.notificationCenter.onDaemonStopped(() => this.isRunning = false);
        this.wsConnectionProvider.onIncomingMessageActivity(() => {
            this.updateStatus(this.isRunning);
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

    protected isRunning = false;

    @postConstruct()
    protected async init(): Promise<void> {
        try {
            this.isRunning = await this.daemon.isRunning();
        } catch { }
        this.notificationCenter.onDaemonStarted(() => this.isRunning = true);
        this.notificationCenter.onDaemonStopped(() => this.isRunning = false);
    }

    protected onStateChange(state: ConnectionStatus): void {
        if (!this.isRunning && state === ConnectionStatus.ONLINE) {
            return;
        }
        super.onStateChange(state);
    }

    protected handleOffline(): void {
        this.statusBar.setElement('connection-status', {
            alignment: StatusBarAlignment.LEFT,
            text: this.isRunning ? 'Offline' : '$(bolt) CLI Daemon Offline',
            tooltip: this.isRunning ? 'Cannot connect to the backend.' : 'Cannot connect to the CLI daemon.',
            priority: 5000
        });
        this.toDisposeOnOnline.push(Disposable.create(() => this.statusBar.removeElement('connection-status')));
        document.body.classList.add('theia-mod-offline');
        this.toDisposeOnOnline.push(Disposable.create(() => document.body.classList.remove('theia-mod-offline')));
    }

}
