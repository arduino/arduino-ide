import { DisposableCollection, Emitter, Event } from '@theia/core';
import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import { HostedPluginSupport } from './theia/plugin-ext/hosted-plugin';

/**
 * Frontend contribution to watch VS Code extension start/stop events from Theia.
 *
 * In Theia, there are no events when a VS Code extension is loaded, started, unloaded, and stopped.
 * Currently, it's possible to `@inject` the `HostedPluginSupport` service from Theia and `await`
 * for the `didStart` promise to resolve. But if the OS goes to sleep, the VS Code extensions will
 * be unloaded and loaded and started again when the OS awakes. Theia reloads the VS Code extensions
 * after the OS awake event, but the `didStart` promise was already resolved, so IDE2 cannot restart the LS.
 * This service is meant to work around the limitation of Theia and fire an event every time the VS Code extensions
 * loaded and started.
 */
@injectable()
export class HostedPluginEvents implements FrontendApplicationContribution {
  @inject(HostedPluginSupport)
  private readonly hostedPluginSupport: HostedPluginSupport;

  private firstStart = true;
  private readonly onPluginsDidStartEmitter = new Emitter<void>();
  private readonly onPluginsWillUnloadEmitter = new Emitter<void>();
  private readonly toDispose = new DisposableCollection(
    this.onPluginsDidStartEmitter,
    this.onPluginsWillUnloadEmitter
  );

  onStart(): void {
    this.hostedPluginSupport.onDidLoad(() => {
      // Fire the first event, when `didStart` resolves.
      if (!this.firstStart) {
        console.debug('HostedPluginEvents', "Received 'onDidLoad' event.");
        this.onPluginsDidStartEmitter.fire();
      } else {
        console.debug(
          'HostedPluginEvents',
          "Received 'onDidLoad' event before the first start. Skipping."
        );
      }
    });
    this.hostedPluginSupport.didStart.then(() => {
      console.debug('HostedPluginEvents', "Hosted plugins 'didStart'.");
      if (!this.firstStart) {
        throw new Error(
          'Unexpectedly received a `didStart` event after the first start.'
        );
      }
      this.firstStart = false;
      this.onPluginsDidStartEmitter.fire();
    });
    this.hostedPluginSupport.onDidCloseConnection(() => {
      console.debug('HostedPluginEvents', "Received 'onDidCloseConnection'.");
      this.onPluginsWillUnloadEmitter.fire();
    });
  }

  onStop(): void {
    this.toDispose.dispose();
  }

  get onPluginsDidStart(): Event<void> {
    return this.onPluginsDidStartEmitter.event;
  }

  get onPluginsWillUnload(): Event<void> {
    return this.onPluginsWillUnloadEmitter.event;
  }

  get didStart(): Promise<void> {
    return this.hostedPluginSupport.didStart;
  }
}
