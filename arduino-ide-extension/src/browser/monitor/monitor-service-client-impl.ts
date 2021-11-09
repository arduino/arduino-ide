import { injectable } from 'inversify';
import { Emitter } from '@theia/core/lib/common/event';
import {
  MonitorServiceClient,
  MonitorError,
  MonitorConfig,
} from '../../common/protocol/monitor-service';
import { MonitorModel } from './monitor-model';

@injectable()
export class MonitorServiceClientImpl implements MonitorServiceClient {
  protected readonly onErrorEmitter = new Emitter<MonitorError>();
  readonly onError = this.onErrorEmitter.event;

  protected readonly onWebSocketChangedEmitter = new Emitter<number>();
  readonly onWebSocketChanged = this.onWebSocketChangedEmitter.event;

  protected readonly onBaudEmitter = new Emitter<MonitorConfig.BaudRate>();
  readonly onBaudRateChanged = this.onBaudEmitter.event;

  protected readonly onEolEmitter = new Emitter<MonitorModel.EOL>();
  readonly onLineEndingChanged = this.onEolEmitter.event;

  notifyError(error: MonitorError): void {
    this.onErrorEmitter.fire(error);
  }

  notifyWebSocketChanged(message: number): void {
    this.onWebSocketChangedEmitter.fire(message);
  }

  notifyBaudRateChanged(message: MonitorConfig.BaudRate): void {
    this.onBaudEmitter.fire(message);
  }

  notifyLineEndingChanged(message: MonitorModel.EOL): void {
    this.onEolEmitter.fire(message);
  }
}
