import { injectable } from 'inversify';
import { MenuModelRegistry } from '@theia/core/lib/common/menu';
import { DebugFrontendApplicationContribution as TheiaDebugFrontendApplicationContribution, DebugMenus } from '@theia/debug/lib/browser/debug-frontend-application-contribution';
import { unregisterSubmenu } from '../../menu/arduino-menus';

@injectable()
export class DebugFrontendApplicationContribution extends TheiaDebugFrontendApplicationContribution {

    constructor() {
        super()
        this.options.defaultWidgetOptions.rank = 4;
    }

    registerMenus(registry: MenuModelRegistry): void {
        super.registerMenus(registry);
        unregisterSubmenu(DebugMenus.DEBUG, registry);
    }

}
