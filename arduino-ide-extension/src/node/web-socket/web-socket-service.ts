import * as WebSocket from 'ws';

export const WebSocketService = Symbol('WebSocketService');
export interface WebSocketService {
  getAddress(): WebSocket.AddressInfo;
  sendMessage(message: string): void;
}
