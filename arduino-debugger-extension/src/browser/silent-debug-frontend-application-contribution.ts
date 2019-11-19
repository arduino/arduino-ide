import { injectable } from "inversify";
import { DebugFrontendApplicationContribution } from '@theia/debug/lib/browser/debug-frontend-application-contribution';
import { MenuModelRegistry, CommandRegistry } from "@theia/core";
import { KeybindingRegistry } from "@theia/core/lib/browser";
import { TabBarToolbarRegistry } from "@theia/core/lib/browser/shell/tab-bar-toolbar";

@injectable()
export class SilentDebugFrontendApplicationContribution extends DebugFrontendApplicationContribution {

    async initializeLayout(): Promise<void> {
    }

    registerMenus(menus: MenuModelRegistry): void {
    }

    registerCommands(registry: CommandRegistry): void {
    }

    registerKeybindings(keybindings: KeybindingRegistry): void {
    }

    registerToolbarItems(toolbar: TabBarToolbarRegistry): void {
    }

}