import { ApplicationError } from '@theia/core/lib/common/application-error';
import type { Event } from '@theia/core/lib/common/event';
import type { JsonRpcServer } from '@theia/core/lib/common/messaging/proxy-factory';
import { nls } from '@theia/core/lib/common/nls';
import type { BoardIdentifier, PortIdentifier } from './boards-service';

export type PluggableMonitorSettings = Record<string, PluggableMonitorSetting>;
export interface MonitorSettings {
  pluggableMonitorSettings?: PluggableMonitorSettings;
  monitorUISettings?: Partial<MonitorState>;
}

export const MonitorManagerProxyFactory = Symbol('MonitorManagerProxyFactory');
export type MonitorManagerProxyFactory = () => MonitorManagerProxy;

export const MonitorManagerProxyPath = '/services/monitor-manager-proxy';
export const MonitorManagerProxy = Symbol('MonitorManagerProxy');
export interface MonitorManagerProxy
  extends JsonRpcServer<MonitorManagerProxyClient> {
  startMonitor(
    board: BoardIdentifier,
    port: PortIdentifier,
    settings?: PluggableMonitorSettings
  ): Promise<void>;
  changeMonitorSettings(
    board: BoardIdentifier,
    port: PortIdentifier,
    settings: MonitorSettings
  ): Promise<void>;
  stopMonitor(board: BoardIdentifier, port: PortIdentifier): Promise<void>;
  getCurrentSettings(
    board: BoardIdentifier,
    port: PortIdentifier
  ): Promise<MonitorSettings>;
}

export const MonitorManagerProxyClient = Symbol('MonitorManagerProxyClient');
export interface MonitorManagerProxyClient {
  onMessagesReceived: Event<{ messages: string[] }>;
  onMonitorSettingsDidChange: Event<MonitorSettings>;
  onMonitorShouldReset: Event<void>;
  connect(addressPort: number): Promise<void>;
  disconnect(): void;
  getWebSocketPort(): number | undefined;
  isWSConnected(): Promise<boolean>;
  startMonitor(settings?: PluggableMonitorSettings): Promise<void>;
  stopLastMonitor(settings?: PluggableMonitorSettings): Promise<void>;
  getCurrentSettings(
    board: BoardIdentifier,
    port: PortIdentifier
  ): Promise<MonitorSettings>;
  send(message: string): void;
  changeSettings(settings: MonitorSettings): void;
}

export interface PluggableMonitorSetting {
  // The setting identifier
  readonly id: string;
  // A human-readable label of the setting (to be displayed on the GUI)
  readonly label: string;
  // The setting type (at the moment only "enum" is available)
  readonly type: string;
  // The values allowed on "enum" types
  readonly values: string[];
  // The selected value
  selectedValue: string;
}

export namespace Monitor {
  // Commands sent by the clients to the web socket server
  export enum ClientCommand {
    SEND_MESSAGE = 'SEND_MESSAGE',
    CHANGE_SETTINGS = 'CHANGE_SETTINGS',
  }

  // Commands sent by the backend to the clients
  export enum MiddlewareCommand {
    ON_SETTINGS_DID_CHANGE = 'ON_SETTINGS_DID_CHANGE',
  }

  export type Message = {
    command: Monitor.ClientCommand | Monitor.MiddlewareCommand;
    data: string | MonitorSettings;
  };
}

export const MonitorErrorCodes = {
  ConnectionFailed: 6001,
  NotConnected: 6002,
  AlreadyConnected: 6003,
  MissingConfiguration: 6004,
} as const;

export const ConnectionFailedError = declareMonitorError(
  MonitorErrorCodes.ConnectionFailed
);
export const NotConnectedError = declareMonitorError(
  MonitorErrorCodes.NotConnected
);
export const AlreadyConnectedError = declareMonitorError(
  MonitorErrorCodes.AlreadyConnected
);
export const MissingConfigurationError = declareMonitorError(
  MonitorErrorCodes.MissingConfiguration
);

export function createConnectionFailedError(
  port: PortIdentifier,
  details?: string
): ApplicationError<number, PortDescriptor> {
  let { protocol, address } = port;
  protocol = protocol.replace('serial', '串行');
  let message;
  if (details) {
    let detailsWithPeriod = details.endsWith('.') ? details : `${details}.`;
    detailsWithPeriod = '端口监视器错误：命令“打开”失败：串口繁忙.';
    message = nls.localize(
      'arduino/monitor/connectionFailedErrorWithDetails',
      '{0} 无法连接至 {1} {2} 端口.',
      detailsWithPeriod,
      address,
      protocol
    );
  } else {
    message = nls.localize(
      'arduino/monitor/connectionFailedError',
      '无法连至 {0} {1} 端口.',
      address,
      protocol
    );
  }
  console.log(message);
  return ConnectionFailedError({ protocol, address });
}
export function createNotConnectedError(
  port: PortIdentifier
): ApplicationError<number, PortDescriptor> {
  const { protocol, address } = port;
  // return NotConnectedError(
  //   nls.localize(
  //     'arduino/monitor/notConnectedError',
  //     '未连接到 {0} {1} 串口.',
  //     address,
  //     protocol
  //   ),
  //   { protocol, address }
  // );
  return NotConnectedError({ protocol, address });
}
export function createAlreadyConnectedError(
  port: PortIdentifier
): ApplicationError<number, PortDescriptor> {
  const { protocol, address } = port;
  // return AlreadyConnectedError(
  //   nls.localize(
  //     'arduino/monitor/alreadyConnectedError',
  //     '无法连接到 {0} {1} 串口. 已经连接.',
  //     address,
  //     protocol
  //   ),
  //   { protocol, address }
  // );
  return AlreadyConnectedError({ protocol, address });
}
export function createMissingConfigurationError(
  port: PortIdentifier
): ApplicationError<number, PortDescriptor> {
  const { protocol, address } = port;
  // return MissingConfigurationError(
  //   nls.localize(
  //     'arduino/monitor/missingConfigurationError',
  //     '无法连接到 {0} {1} 串口. 缺少监视器配置.',
  //     address,
  //     protocol
  //   ),
  //   { protocol, address }
  // );
  return MissingConfigurationError({ protocol, address });
}

/**
 * Bare minimum representation of a port. Supports neither UI labels nor properties.
 */
interface PortDescriptor {
  readonly protocol: string;
  readonly address: string;
}
function declareMonitorError(
  code: number
): ApplicationError.Constructor<number, PortDescriptor> {
  return ApplicationError.declare(
    code,
    (message: string, data: PortDescriptor) => ({ data, message })
  );
}

export interface MonitorConnectionError {
  readonly errorMessage: string;
}

export type MonitorConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'not-connected'
  | MonitorConnectionError;

export function monitorConnectionStatusEquals(
  left: MonitorConnectionStatus,
  right: MonitorConnectionStatus
): boolean {
  if (typeof left === 'object' && typeof right === 'object') {
    return left.errorMessage === right.errorMessage;
  }
  return left === right;
}

/**
 * @deprecated see `MonitorState#connected`
 */
export function isMonitorConnected(
  status: MonitorConnectionStatus
): status is 'connected' {
  return status === 'connected';
}

export function isMonitorConnectionError(
  status: MonitorConnectionStatus
): status is MonitorConnectionError {
  return typeof status === 'object';
}

export interface MonitorState {
  autoscroll: boolean;
  timestamp: boolean;
  lineEnding: MonitorEOL;
  interpolate: boolean;
  darkTheme: boolean;
  wsPort: number;
  serialPort: string;
  connectionStatus: MonitorConnectionStatus;
  /**
   * @deprecated This property is never get by IDE2 only set. This value is present to be backward compatible with the plotter app.
   * IDE2 uses `MonitorState#connectionStatus`.
   */
  connected: boolean;
}
export namespace MonitorState {
  export interface Change<K extends keyof MonitorState> {
    readonly property: K;
    readonly value: MonitorState[K];
  }
}

export type MonitorEOL = '' | '\n' | '\r' | '\r\n';
export namespace MonitorEOL {
  export const DEFAULT: MonitorEOL = '\n';
}
