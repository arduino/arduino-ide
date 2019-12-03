import { injectable } from 'inversify';
import { Emitter } from '@theia/core/lib/common/event';
import { MonitorServiceClient, MonitorReadEvent, MonitorError } from '../../common/protocol/monitor-service';

@injectable()
export class MonitorServiceClientImpl implements MonitorServiceClient {

    protected readonly onReadEmitter = new Emitter<MonitorReadEvent>();
    protected readonly onErrorEmitter = new Emitter<MonitorError>();
    readonly onRead = this.onReadEmitter.event;
    readonly onError = this.onErrorEmitter.event;

    notifyRead(event: MonitorReadEvent): void {
        this.onReadEmitter.fire(event);
        const { data } = event;
        console.debug(`Received data: ${data}`);
    }

    notifyError(error: MonitorError): void {
        this.onErrorEmitter.fire(error);
    }

}
