import { Event } from '@theia/core/lib/common/event';
import type { AddressInfo } from '@theia/core/shared/ws';

export const WebSocketProvider = Symbol('WebSocketProvider');
export interface WebSocketProvider {
  getAddress(): AddressInfo;
  sendMessage(message: string): void;
  onMessageReceived: Event<string>;
  onClientsNumberChanged: Event<number>;
  getConnectedClientsNumber(): number;
}
