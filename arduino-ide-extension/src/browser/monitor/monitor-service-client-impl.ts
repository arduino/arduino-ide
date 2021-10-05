import { injectable } from 'inversify';
import { Emitter } from '@theia/core/lib/common/event';
import {
  MonitorServiceClient,
  MonitorError,
} from '../../common/protocol/monitor-service';

@injectable()
export class MonitorServiceClientImpl implements MonitorServiceClient {
  protected readonly onErrorEmitter = new Emitter<MonitorError>();
  readonly onError = this.onErrorEmitter.event;

  protected readonly onMessageEmitter = new Emitter<string>();
  readonly onMessage = this.onMessageEmitter.event;

  notifyError(error: MonitorError): void {
    this.onErrorEmitter.fire(error);
  }

  notifyMessage(message: string): void {
    this.onMessageEmitter.fire(message);
  }
}
