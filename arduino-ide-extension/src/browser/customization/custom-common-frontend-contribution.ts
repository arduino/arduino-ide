import { injectable } from "inversify";
import { CommonFrontendContribution, CommonMenus, CommonCommands } from "@theia/core/lib/browser";
import { MenuModelRegistry } from "@theia/core";
import { ArduinoAdvancedMode } from "../arduino-frontend-contribution";

@injectable()
export class CustomCommonFrontendContribution extends CommonFrontendContribution {
    registerMenus(registry: MenuModelRegistry): void {
        if (!ArduinoAdvancedMode.TOGGLED) {
            registry.registerSubmenu(CommonMenus.FILE, 'File');
            registry.registerSubmenu(CommonMenus.EDIT, 'Edit');

            registry.registerSubmenu(CommonMenus.FILE_SETTINGS_SUBMENU, 'Settings');

            registry.registerMenuAction(CommonMenus.EDIT_UNDO, {
                commandId: CommonCommands.UNDO.id,
                order: '0'
            });
            registry.registerMenuAction(CommonMenus.EDIT_UNDO, {
                commandId: CommonCommands.REDO.id,
                order: '1'
            });

            registry.registerMenuAction(CommonMenus.EDIT_FIND, {
                commandId: CommonCommands.FIND.id,
                order: '0'
            });
            registry.registerMenuAction(CommonMenus.EDIT_FIND, {
                commandId: CommonCommands.REPLACE.id,
                order: '1'
            });

            registry.registerMenuAction(CommonMenus.EDIT_CLIPBOARD, {
                commandId: CommonCommands.CUT.id,
                order: '0'
            });
            registry.registerMenuAction(CommonMenus.EDIT_CLIPBOARD, {
                commandId: CommonCommands.COPY.id,
                order: '1'
            });
            registry.registerMenuAction(CommonMenus.EDIT_CLIPBOARD, {
                commandId: CommonCommands.PASTE.id,
                order: '2'
            });
        } else {
            super.registerMenus(registry);
        }
    }
}