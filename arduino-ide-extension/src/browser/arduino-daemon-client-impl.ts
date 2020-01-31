import { injectable, inject } from 'inversify';
import { ILogger } from '@theia/core/lib/common/logger';
import { Event, Emitter } from '@theia/core/lib/common/event';
import { MessageService } from '@theia/core/lib/common/message-service';
import { ArduinoDaemonClient } from '../common/protocol/arduino-daemon';

@injectable()
export class ArduinoDaemonClientImpl implements ArduinoDaemonClient {

    @inject(ILogger)
    protected readonly logger: ILogger;

    @inject(MessageService)
    protected readonly messageService: MessageService;

    protected readonly onStartedEmitter = new Emitter<void>();
    protected readonly onStoppedEmitter = new Emitter<void>();
    protected _isRunning = false;

    notifyStopped(): void {
        if (this._isRunning) {
            this._isRunning = false;
            this.onStoppedEmitter.fire();
            this.info('The CLI daemon process has stopped.');
        }
    }

    notifyStarted(): void {
        if (!this._isRunning) {
            this._isRunning = true;
            this.onStartedEmitter.fire();
            this.info('The CLI daemon process has started.');
        }
    }

    get onDaemonStarted(): Event<void> {
        return this.onStartedEmitter.event;
    }

    get onDaemonStopped(): Event<void> {
        return this.onStoppedEmitter.event;
    }

    get isRunning(): boolean {
        return this._isRunning;
    }

    protected info(message: string): void {
        this.messageService.info(message, { timeout: 3000 });
        this.logger.info(message);
    }

}
