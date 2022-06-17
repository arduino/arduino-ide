import { Emitter, Event, JsonRpcProxy } from '@theia/core';
import { injectable, interfaces } from '@theia/core/shared/inversify';
import { HostedPluginServer } from '@theia/plugin-ext/lib/common/plugin-protocol';
import { HostedPluginSupport as TheiaHostedPluginSupport } from '@theia/plugin-ext/lib/hosted/browser/hosted-plugin';
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
}
