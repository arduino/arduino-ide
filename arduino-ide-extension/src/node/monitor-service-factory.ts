import { Board, Port } from '../common/protocol';
import { CoreClientProvider } from './core-client-provider';
import { MonitorService } from './monitor-service';

export const MonitorServiceFactory = Symbol('MonitorServiceFactory');
export interface MonitorServiceFactory {
  (options: {
    board: Board;
    port: Port;
    monitorID: string;
    coreClientProvider: CoreClientProvider;
  }): MonitorService;
}

export interface MonitorServiceFactoryOptions {
  board: Board;
  port: Port;
  monitorID: string;
  coreClientProvider: CoreClientProvider;
}
