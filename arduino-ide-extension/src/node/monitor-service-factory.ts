import { Board, Port } from '../common/protocol';
import { MonitorService } from './monitor-service';

export const MonitorServiceFactory = Symbol('MonitorServiceFactory');
export interface MonitorServiceFactory {
  (options: { board: Board; port: Port; monitorID: string }): MonitorService;
}

export interface MonitorServiceFactoryOptions {
  board: Board;
  port: Port;
  monitorID: string;
}
