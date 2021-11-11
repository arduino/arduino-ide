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

  protected readonly onBaudRateChangedEmitter =
    new Emitter<MonitorConfig.BaudRate>();
  readonly onBaudRateChanged = this.onBaudRateChangedEmitter.event;

  protected readonly onLineEndingChangedEmitter =
    new Emitter<MonitorModel.EOL>();
  readonly onLineEndingChanged = this.onLineEndingChangedEmitter.event;

  protected readonly onInterpolateChangedEmitter = new Emitter<boolean>();
  readonly onInterpolateChanged = this.onInterpolateChangedEmitter.event;

  notifyError(error: MonitorError): void {
    this.onErrorEmitter.fire(error);
  }

  notifyWebSocketChanged(message: number): void {
    this.onWebSocketChangedEmitter.fire(message);
  }

  notifyBaudRateChanged(message: MonitorConfig.BaudRate): void {
    this.onBaudRateChangedEmitter.fire(message);
  }

  notifyLineEndingChanged(message: MonitorModel.EOL): void {
    this.onLineEndingChangedEmitter.fire(message);
  }

  notifyInterpolateChanged(message: boolean): void {
    this.onInterpolateChangedEmitter.fire(message);
  }
}
