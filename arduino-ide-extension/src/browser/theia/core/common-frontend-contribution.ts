import { injectable } from 'inversify';
import { MenuModelRegistry } from '@theia/core/lib/common/menu';
import { CommonFrontendContribution as TheiaCommonFrontendContribution, CommonCommands } from '@theia/core/lib/browser/common-frontend-contribution';

@injectable()
export class CommonFrontendContribution extends TheiaCommonFrontendContribution {

    registerMenus(registry: MenuModelRegistry): void {
        super.registerMenus(registry);
        for (const command of [
            CommonCommands.SAVE,
            CommonCommands.SAVE_ALL,
            CommonCommands.CUT,
            CommonCommands.COPY,
            CommonCommands.PASTE,
            CommonCommands.COPY_PATH,
            CommonCommands.FIND,
            CommonCommands.REPLACE,
            CommonCommands.AUTO_SAVE,
            CommonCommands.OPEN_PREFERENCES,
            CommonCommands.SELECT_ICON_THEME,
            CommonCommands.SELECT_COLOR_THEME,
            CommonCommands.ABOUT_COMMAND,
            CommonCommands.SAVE_WITHOUT_FORMATTING // Patched for https://github.com/eclipse-theia/theia/pull/8877
        ]) {
            registry.unregisterMenuAction(command);
        }
    }

}
