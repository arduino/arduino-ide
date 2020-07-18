import { injectable } from 'inversify';
import { MenuModelRegistry } from '@theia/core/lib/common/menu';
import { CommonFrontendContribution as TheiaCommonFrontendContribution, CommonCommands } from '@theia/core/lib/browser/common-frontend-contribution';

@injectable()
export class CommonFrontendContribution extends TheiaCommonFrontendContribution {

    registerMenus(registry: MenuModelRegistry): void {
        super.registerMenus(registry);
        registry.unregisterMenuAction(CommonCommands.SAVE);
        registry.unregisterMenuAction(CommonCommands.SAVE_ALL);
    }

}
