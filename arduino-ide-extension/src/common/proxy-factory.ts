/* eslint-disable @typescript-eslint/no-explicit-any */
import { MessageConnection, ResponseError } from 'vscode-ws-jsonrpc';
import { JsonRpcProxyFactory as TheiaJsonRpcProxyFactory } from '@theia/core/lib/common/messaging/proxy-factory';

export class JsonRpcProxyFactory<
  // eslint-disable-next-line @typescript-eslint/ban-types
  T extends object
> extends TheiaJsonRpcProxyFactory<T> {
  protected async onRequest(method: string, ...args: any[]): Promise<any> {
    try {
      if (this.target) {
        return this.request(method, args);
      } else {
        throw new Error(`no target was set to handle ${method}`);
      }
    } catch (error) {
      const e = this.serializeError(error);
      if (e instanceof ResponseError) {
        throw e;
      }
      const reason = e.message || '';
      const stack = e.stack || '';
      console.error(`Request ${method} failed with error: ${reason}`, stack);
      throw e;
    }
  }

  private async request(method: string, args: any[]): Promise<any> {
    // const start = performance.now();
    const result = await this.target[method](...args);
    // const end = performance.now();
    // const duration = (end - start).toFixed(3);
    // console.log('request ' + method + ' took ' + duration);
    return result;
  }

  get(target: T, p: PropertyKey, receiver: any): any {
    if (p === 'setClient') {
      return (client: any) => {
        this.target = client;
      };
    }
    if (p === 'getClient') {
      return () => this.target;
    }
    if (p === 'onDidOpenConnection') {
      return this.onDidOpenConnectionEmitter.event;
    }
    if (p === 'onDidCloseConnection') {
      return this.onDidCloseConnectionEmitter.event;
    }
    const isNotify = this.isNotification(p);
    return (...args: any[]) => {
      const method = p.toString();
      const capturedError = new Error(`Request '${method}' failed`);
      return this.connectionPromise.then(
        (connection) =>
          new Promise(async (resolve, reject) => {
            try {
              if (isNotify) {
                connection.sendNotification(method, ...args);
                resolve(undefined);
              } else {
                try {
                  const result: any = await this.sendRequest(
                    connection,
                    method,
                    args
                  );
                  resolve(result);
                } catch (err) {
                  reject(this.deserializeError(capturedError, err));
                }
              }
            } catch (err) {
              reject(err);
            }
          })
      );
    };
  }

  private async sendRequest(
    connection: MessageConnection,
    method: string,
    args: any[]
  ): Promise<any> {
    // const start = performance.now();
    const result = await connection.sendRequest(method, ...args);
    // const end = performance.now();
    // const duration = (end - start).toFixed(3);
    // console.log('sendRequest ' + method + ' took ' + duration);
    return result;
  }
}
