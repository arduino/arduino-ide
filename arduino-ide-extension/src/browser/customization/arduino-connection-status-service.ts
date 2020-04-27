import { inject, injectable, postConstruct } from 'inversify';
import { Disposable } from '@theia/core/lib/common/disposable';
import { StatusBarAlignment } from '@theia/core/lib/browser/status-bar/status-bar';
import { FrontendConnectionStatusService, ApplicationConnectionStatusContribution, ConnectionStatus } from '@theia/core/lib/browser/connection-status-service';
import { ArduinoDaemonClientImpl } from '../arduino-daemon-client-impl';

@injectable()
export class ArduinoFrontendConnectionStatusService extends FrontendConnectionStatusService {

    @inject(ArduinoDaemonClientImpl)
    protected readonly daemonClient: ArduinoDaemonClientImpl;

    @postConstruct()
    protected init(): void {
        this.schedulePing();
        this.wsConnectionProvider.onIncomingMessageActivity(() => {
            // natural activity
            this.updateStatus(this.daemonClient.isRunning);
            this.schedulePing();
        });
    }

}

@injectable()
export class ArduinoApplicationConnectionStatusContribution extends ApplicationConnectionStatusContribution {

    @inject(ArduinoDaemonClientImpl)
    protected readonly daemonClient: ArduinoDaemonClientImpl;

    protected onStateChange(state: ConnectionStatus): void {
        if (!this.daemonClient.isRunning && state === ConnectionStatus.ONLINE) {
            return;
        }
        super.onStateChange(state);
    }

    protected handleOffline(): void {
        const { isRunning } = this.daemonClient;
        this.statusBar.setElement('connection-status', {
            alignment: StatusBarAlignment.LEFT,
            text: isRunning ? 'Offline' : '$(bolt) CLI Daemon Offline',
            tooltip: isRunning ? 'Cannot connect to the backend.' : 'Cannot connect to the CLI daemon.',
            priority: 5000
        });
        this.toDisposeOnOnline.push(Disposable.create(() => this.statusBar.removeElement('connection-status')));
        document.body.classList.add('theia-mod-offline');
        this.toDisposeOnOnline.push(Disposable.create(() => document.body.classList.remove('theia-mod-offline')));
    }

}
