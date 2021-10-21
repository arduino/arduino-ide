import { injectable } from 'inversify';
import { Emitter, Event } from '@theia/core/lib/common/event';
import { MonitorConnection } from '../monitor/monitor-connection';

@injectable()
export class PlotterConnection extends MonitorConnection {
  protected readonly onWebSocketChangedEmitter = new Emitter<string>();

  async handleMessage(port: string): Promise<void> {
    this.onWebSocketChangedEmitter.fire(port);
  }

  get onWebSocketChanged(): Event<string> {
    return this.onWebSocketChangedEmitter.event;
  }
}
