import { injectable } from '@theia/core/shared/inversify';
import { Emitter } from '@theia/core/lib/common/event';
import {
  SerialServiceClient,
  SerialError,
  SerialConfig,
} from '../../common/protocol/serial-service';
import { SerialModel } from './serial-model';

@injectable()
export class SerialServiceClientImpl implements SerialServiceClient {
  protected readonly onErrorEmitter = new Emitter<SerialError>();
  readonly onError = this.onErrorEmitter.event;

  protected readonly onWebSocketChangedEmitter = new Emitter<number>();
  readonly onWebSocketChanged = this.onWebSocketChangedEmitter.event;

  protected readonly onBaudRateChangedEmitter =
    new Emitter<SerialConfig.BaudRate>();
  readonly onBaudRateChanged = this.onBaudRateChangedEmitter.event;

  protected readonly onLineEndingChangedEmitter =
    new Emitter<SerialModel.EOL>();
  readonly onLineEndingChanged = this.onLineEndingChangedEmitter.event;

  protected readonly onInterpolateChangedEmitter = new Emitter<boolean>();
  readonly onInterpolateChanged = this.onInterpolateChangedEmitter.event;

  notifyError(error: SerialError): void {
    this.onErrorEmitter.fire(error);
  }

  notifyWebSocketChanged(message: number): void {
    this.onWebSocketChangedEmitter.fire(message);
  }

  notifyBaudRateChanged(message: SerialConfig.BaudRate): void {
    this.onBaudRateChangedEmitter.fire(message);
  }

  notifyLineEndingChanged(message: SerialModel.EOL): void {
    this.onLineEndingChangedEmitter.fire(message);
  }

  notifyInterpolateChanged(message: boolean): void {
    this.onInterpolateChangedEmitter.fire(message);
  }
}
