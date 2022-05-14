import { JsonRpcProxy } from '@theia/core';
import { WebSocketConnectionProvider as TheiaWebSocketConnectionProvider } from '@theia/core/lib/browser/messaging/ws-connection-provider';
import { injectable } from '@theia/core/shared/inversify';
import { JsonRpcProxyFactory } from '../../../common/proxy-factory';

@injectable()
export class WebSocketConnectionProvider extends TheiaWebSocketConnectionProvider {
  // eslint-disable-next-line @typescript-eslint/ban-types
  createProxy<T extends object>(path: string, arg?: object): JsonRpcProxy<T> {
    const factory =
      arg instanceof JsonRpcProxyFactory
        ? arg
        : new JsonRpcProxyFactory<T>(arg);
    this.listen({
      path,
      onConnection: (c) => factory.listen(c),
    });
    return factory.createProxy();
  }
}
