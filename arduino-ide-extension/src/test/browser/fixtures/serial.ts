import { MonitorConfig } from '../../../common/protocol/monitor-service';
import { aBoard, anotherBoard, anotherPort, aPort } from './boards';

export const aSerialConfig: MonitorConfig = {
  board: aBoard,
  port: aPort,
  baudRate: 9600,
};

export const anotherSerialConfig: MonitorConfig = {
  board: anotherBoard,
  port: anotherPort,
  baudRate: 9600,
};

export class WebSocketMock {
  readonly url: string;
  constructor(url: string) {
    this.url = url;
  }
  close() {}
}
