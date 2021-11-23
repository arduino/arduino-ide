import { SerialConfig } from '../../../common/protocol/serial-service';
import { aBoard, anotherBoard, anotherPort, aPort } from './boards';

export const aSerialConfig: SerialConfig = {
  board: aBoard,
  port: aPort,
  baudRate: 9600,
};

export const anotherSerialConfig: SerialConfig = {
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
