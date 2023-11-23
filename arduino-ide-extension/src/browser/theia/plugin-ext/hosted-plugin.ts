import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { Emitter, Event } from '@theia/core/lib/common/event';
import { injectable, interfaces } from '@theia/core/shared/inversify';
import {
  PluginContributions,
  HostedPluginSupport as TheiaHostedPluginSupport,
} from '@theia/plugin-ext/lib/hosted/browser/hosted-plugin';
import { HostedPluginSupport } from '../../hosted/hosted-plugin-support';

@injectable()
export class HostedPluginSupportImpl
  extends TheiaHostedPluginSupport
  implements HostedPluginSupport
{
  private readonly onDidLoadEmitter = new Emitter<void>();
  private readonly onDidCloseConnectionEmitter = new Emitter<void>();

  override onStart(container: interfaces.Container): void {
    super.onStart(container);
    this['server'].onDidCloseConnection(() =>
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

  protected override startPlugins(
    contributionsByHost: Map<string, PluginContributions[]>,
    toDisconnect: DisposableCollection
  ): Promise<void> {
    reorderPlugins(contributionsByHost);
    return super.startPlugins(contributionsByHost, toDisconnect);
  }
}

/**
 * Force the `vscode-arduino-ide` API to activate before any Arduino IDE tool VSIX.
 *
 * Arduino IDE tool VISXs are not forced to declare the `vscode-arduino-api` as a `extensionDependencies`,
 * but the API must activate before any tools. This in place sorting helps to bypass Theia's plugin resolution
 * without forcing tools developers to add `vscode-arduino-api` to the `extensionDependencies`.
 */
function reorderPlugins(
  contributionsByHost: Map<string, PluginContributions[]>
): void {
  for (const [, contributions] of contributionsByHost) {
    const apiPluginIndex = contributions.findIndex(isArduinoAPI);
    if (apiPluginIndex >= 0) {
      const apiPlugin = contributions[apiPluginIndex];
      contributions.splice(apiPluginIndex, 1);
      contributions.unshift(apiPlugin);
    }
  }
}

function isArduinoAPI(pluginContribution: PluginContributions): boolean {
  return (
    pluginContribution.plugin.metadata.model.id ===
    'dankeboy36.vscode-arduino-api'
  );
}
