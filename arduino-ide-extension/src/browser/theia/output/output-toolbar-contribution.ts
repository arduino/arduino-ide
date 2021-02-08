import { injectable } from 'inversify';
import { ReactTabBarToolbarItem, TabBarToolbarItem, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { OutputToolbarContribution as TheiaOutputToolbarContribution } from '@theia/output/lib/browser/output-toolbar-contribution';

@injectable()
export class OutputToolbarContribution extends TheiaOutputToolbarContribution {

    async registerToolbarItems(registry: TabBarToolbarRegistry): Promise<void> {
        await super.registerToolbarItems(registry); // Why is it async?
        // It's a hack. Currently, it's not possible to unregister a toolbar contribution via API.
        ((registry as any).items as Map<string, TabBarToolbarItem | ReactTabBarToolbarItem>).delete('channels');
        (registry as any).fireOnDidChange();
    }

}
