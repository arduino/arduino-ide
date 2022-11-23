import { Emitter, Event, JsonRpcProxy } from '@theia/core';
import { injectable, interfaces } from '@theia/core/shared/inversify';
import { HostedPluginServer } from '@theia/plugin-ext/lib/common/plugin-protocol';
import { RPCProtocol } from '@theia/plugin-ext/lib/common/rpc-protocol';
import {
  HostedPluginSupport as TheiaHostedPluginSupport,
  PluginHost,
} from '@theia/plugin-ext/lib/hosted/browser/hosted-plugin';
import { PluginWorker } from '@theia/plugin-ext/lib/hosted/browser/plugin-worker';
import { setUpPluginApi } from '@theia/plugin-ext/lib/main/browser/main-context';
import { PLUGIN_RPC_CONTEXT } from '@theia/plugin-ext/lib/common/plugin-api-rpc';
import { DebugMainImpl } from './debug-main';
import { ConnectionImpl } from '@theia/plugin-ext/lib/common/connection';

@injectable()
export class HostedPluginSupport extends TheiaHostedPluginSupport {
  private readonly onDidLoadEmitter = new Emitter<void>();
  private readonly onDidCloseConnectionEmitter = new Emitter<void>();

  override onStart(container: interfaces.Container): void {
    super.onStart(container);
    this.hostedPluginServer.onDidCloseConnection(() =>
      this.onDidCloseConnectionEmitter.fire()
    );
  }

  protected override async doLoad(): Promise<void> {
    await super.doLoad();
    this.onDidLoadEmitter.fire(); // Unlike Theia, IDE2 fires an event after loading the VS Code extensions.
  }

  get onDidLoad(): Event<void> {
    return this.onDidLoadEmitter.event;
  }

  get onDidCloseConnection(): Event<void> {
    return this.onDidCloseConnectionEmitter.event;
  }

  private get hostedPluginServer(): JsonRpcProxy<HostedPluginServer> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this as any).server;
  }

  // to patch the VS Code extension based debugger
  // eslint-disable-next-line unused-imports/no-unused-vars, @typescript-eslint/no-unused-vars
  protected override initRpc(host: PluginHost, pluginId: string): RPCProtocol {
    const rpc =
      host === 'frontend' ? new PluginWorker().rpc : this.createServerRpc(host);
    setUpPluginApi(rpc, this.container);
    this.patchDebugMain(rpc);
    this.mainPluginApiProviders
      .getContributions()
      .forEach((p) => p.initialize(rpc, this.container));
    return rpc;
  }

  private patchDebugMain(rpc: RPCProtocol): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const connectionMain = (rpc as any).locals.get(
      PLUGIN_RPC_CONTEXT.CONNECTION_MAIN.id
    ) as ConnectionImpl;
    const debugMain = new DebugMainImpl(rpc, connectionMain, this.container);
    rpc.set(PLUGIN_RPC_CONTEXT.DEBUG_MAIN, debugMain);
  }
}
