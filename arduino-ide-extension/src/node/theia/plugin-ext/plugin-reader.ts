import { injectable } from '@theia/core/shared/inversify';
import type {
  PluginContribution,
  PluginPackage,
} from '@theia/plugin-ext/lib/common/plugin-protocol';
import { HostedPluginReader as TheiaHostedPluginReader } from '@theia/plugin-ext/lib/hosted/node/plugin-reader';

@injectable()
export class HostedPluginReader extends TheiaHostedPluginReader {
  override readContribution(
    plugin: PluginPackage
  ): PluginContribution | undefined {
    const scanner = this.scanner.getScanner(plugin);
    const contributions = scanner.getContribution(plugin);
    return this.filterContribution(plugin.name, contributions);
  }
  private filterContribution(
    pluginName: string,
    contributions: PluginContribution | undefined
  ): PluginContribution | undefined {
    if (!contributions) {
      return contributions;
    }
    const filter = pluginFilters.get(pluginName);
    return filter ? filter(contributions) : contributions;
  }
}

type PluginContributionFilter = (
  contribution: PluginContribution
) => PluginContribution | undefined;
const cortexDebugFilter: PluginContributionFilter = (
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
  return contribution;
};

const pluginFilters = new Map<string, PluginContributionFilter>([
  ['cortex-debug', cortexDebugFilter],
]);
