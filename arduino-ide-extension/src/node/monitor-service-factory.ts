import type { Board, Port } from '../common/protocol';
import type { MonitorService } from './monitor-service';

export const MonitorServiceFactory = Symbol('MonitorServiceFactory');
export interface MonitorServiceFactory {
  (options: MonitorServiceFactoryOptions): MonitorService;
}

export const MonitorServiceFactoryOptions = Symbol(
  'MonitorServiceFactoryOptions'
);
export interface MonitorServiceFactoryOptions {
  board: Board;
  port: Port;
  monitorID: string;
}
