import { JsonRpcServer } from '@theia/core/lib/common/messaging/proxy-factory';
import { Board, Port } from './boards-service';
import { Event } from '@theia/core/lib/common/event';
import { SerialPlotter } from '../../browser/serial/plotter/protocol';
import { SerialModel } from '../../browser/serial/serial-model';

export interface Status {}
export type OK = Status;
export interface ErrorStatus extends Status {
  readonly message: string;
}
export namespace Status {
  export function isOK(status: Status & { message?: string }): status is OK {
    return !!status && typeof status.message !== 'string';
  }
  export const OK: OK = {};
  export const NOT_CONNECTED: ErrorStatus = { message: 'Not connected.' };
  export const ALREADY_CONNECTED: ErrorStatus = {
    message: 'Already connected.',
  };
}

export const SerialServicePath = '/services/serial';
export const SerialService = Symbol('SerialService');
export interface SerialService extends JsonRpcServer<SerialServiceClient> {
  connect(config: SerialConfig): Promise<Status>;
  disconnect(): Promise<Status>;
  sendMessageToSerial(message: string): Promise<Status>;
  updateWsConfigParam(config: Partial<SerialPlotter.Config>): Promise<void>;
}

export interface SerialConfig {
  readonly board: Board;
  readonly port: Port;
  /**
   * Defaults to [`SERIAL`](MonitorConfig#ConnectionType#SERIAL).
   */
  readonly type?: SerialConfig.ConnectionType;
  /**
   * Defaults to `9600`.
   */
  readonly baudRate?: SerialConfig.BaudRate;
}
export namespace SerialConfig {
  export const BaudRates = [
    300, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200,
  ] as const;
  export type BaudRate = typeof SerialConfig.BaudRates[number];
  export namespace BaudRate {
    export const DEFAULT: BaudRate = 9600;
  }

  export enum ConnectionType {
    SERIAL = 0,
  }
}

export const SerialServiceClient = Symbol('SerialServiceClient');
export interface SerialServiceClient {
  onError: Event<SerialError>;
  onWebSocketChanged: Event<number>;
  onLineEndingChanged: Event<SerialModel.EOL>;
  onBaudRateChanged: Event<SerialConfig.BaudRate>;
  onInterpolateChanged: Event<boolean>;
  notifyError(event: SerialError): void;
  notifyWebSocketChanged(message: number): void;
  notifyLineEndingChanged(message: SerialModel.EOL): void;
  notifyBaudRateChanged(message: SerialConfig.BaudRate): void;
  notifyInterpolateChanged(message: boolean): void;
}

export interface SerialError {
  readonly message: string;
  /**
   * If no `code` is available, clients must reestablish the serial connection.
   */
  readonly code: number | undefined;
  readonly config: SerialConfig;
}
export namespace SerialError {
  export namespace ErrorCodes {
    /**
     * The frontend has refreshed the browser, for instance.
     */
    export const CLIENT_CANCEL = 1;
    /**
     * When detaching a physical device when the duplex channel is still opened.
     */
    export const DEVICE_NOT_CONFIGURED = 2;
    /**
     * Another serial connection was opened on this port. For another electron-instance, Java IDE.
     */
    export const DEVICE_BUSY = 3;
  }
}
