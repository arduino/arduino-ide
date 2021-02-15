import { injectable } from 'inversify';
import { Emitter } from '@theia/core/lib/common/event';
import { MonitorServiceClient, MonitorError } from '../../common/protocol/monitor-service';

@injectable()
export class MonitorServiceClientImpl implements MonitorServiceClient {

    protected readonly onErrorEmitter = new Emitter<MonitorError>();
    readonly onError = this.onErrorEmitter.event;

    notifyError(error: MonitorError): void {
        this.onErrorEmitter.fire(error);
    }

}
