import { injectable } from '@theia/core/shared/inversify';
import type {
  PluginContribution,
  PluginPackage,
} from '@theia/plugin-ext/lib/common/plugin-protocol';
import { HostedPluginReader as TheiaHostedPluginReader } from '@theia/plugin-ext/lib/hosted/node/plugin-reader';

@injectable()
export class HostedPluginReader extends TheiaHostedPluginReader {
  override async readContribution(
    plugin: PluginPackage
  ): Promise<PluginContribution | undefined> {
    const scanner = this.scanner.getScanner(plugin);
    const contributions = await scanner.getContribution(plugin);
    return this.mapContribution(plugin.name, contributions);
  }

  private mapContribution(
    pluginName: string,
    contributions: PluginContribution | undefined
  ): PluginContribution | undefined {
    if (!contributions) {
      return contributions;
    }
    const mapper = pluginMappers.get(pluginName);
    return mapper ? mapper(contributions) : contributions;
  }
}

type PluginContributionMapper = (
  contribution: PluginContribution
) => PluginContribution | undefined;
const cortexDebugMapper: PluginContributionMapper = (
  contribution: PluginContribution
) => {
  if (contribution.viewsContainers) {
    for (const location of Object.keys(contribution.viewsContainers)) {
      const viewContainers = contribution.viewsContainers[location];
      for (let i = 0; i < viewContainers.length; i++) {
        const viewContainer = viewContainers[i];
        if (
          viewContainer.id === 'cortex-debug' &&
          viewContainer.title === 'RTOS'
        ) {
          viewContainers.splice(i, 1);
        }
      }
    }
  }
  if (contribution.views) {
    for (const location of Object.keys(contribution.views)) {
      if (location === 'cortex-debug') {
        const views = contribution.views[location];
        for (let i = 0; i < views.length; i++) {
          const view = views[i];
          if (view.id === 'cortex-debug.rtos') {
            views.splice(i, 1);
          }
        }
      }
    }
  }
  if (contribution.menus) {
    for (const location of Object.keys(contribution.menus)) {
      if (location === 'commandPalette') {
        const menus = contribution.menus[location];
        for (let i = 0; i < menus.length; i++) {
          const menu = menus[i];
          if (menu.command === 'cortex-debug.rtos.toggleRTOSPanel') {
            menu.when = 'false';
          }
        }
      }
    }
  }
  if (contribution.commands) {
    for (const command of contribution.commands) {
      if (command.command === 'cortex-debug.resetDevice') {
        // TODO: fix loading of original SVG icon in Theia
        delete command.iconUrl;
      }
    }
  }
  for (const _debugger of contribution.debuggers ?? []) {
    if (_debugger.type === 'cortex-debug') {
      for (const attributes of Object.values(
        _debugger.configurationAttributes ?? {}
      )) {
        if (attributes.properties) {
          // Patch the cortex-debug debug config schema to allow the in-house `configId`.
          attributes.properties['configId'] = {
            type: 'string',
            description:
              'Arduino debug configuration identifier consisting of the Fully Qualified Board Name (FQBN) and the programmer identifier (for example, `esptool`)',
          };
        }
      }
    }
  }

  return contribution;
};

const pluginMappers = new Map<string, PluginContributionMapper>([
  ['cortex-debug', cortexDebugMapper],
]);
