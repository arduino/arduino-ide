import { injectable, inject } from 'inversify';
import { MenuModelRegistry } from '@theia/core';
import { KeybindingRegistry } from '@theia/core/lib/browser';
import { TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { DebugFrontendApplicationContribution } from '@theia/debug/lib/browser/debug-frontend-application-contribution';
import { DebugSessionOptions } from "@theia/debug/lib/browser/debug-session-options";
import { EditorMode } from "arduino-ide-extension/lib/browser/editor-mode";

@injectable()
export class ArduinoDebugFrontendApplicationContribution extends DebugFrontendApplicationContribution {

    @inject(EditorMode)
    protected readonly editorMode: EditorMode;

    async start(noDebug?: boolean, debugSessionOptions?: DebugSessionOptions): Promise<void> {
        let current = debugSessionOptions ? debugSessionOptions : this.configurations.current;
        // If no configurations are currently present, create the `launch.json` and prompt users to select the config.
        if (!current) {
            await this.configurations.addConfiguration();
            await this.configurations.load()
            current = this.configurations.current;
        }
        if (current) {
            if (noDebug !== undefined) {
                current = {
                    ...current,
                    configuration: {
                        ...current.configuration,
                        noDebug
                    }
                };
            }
            await this.manager.start(current);
        }
    }

    initializeLayout(): Promise<void> {
        if (this.editorMode.proMode)
            return super.initializeLayout();
        return Promise.resolve();
    }

    registerMenus(menus: MenuModelRegistry): void {
        if (this.editorMode.proMode)
            super.registerMenus(menus);
    }

    registerKeybindings(keybindings: KeybindingRegistry): void {
        if (this.editorMode.proMode)
            super.registerKeybindings(keybindings);
    }

    registerToolbarItems(toolbar: TabBarToolbarRegistry): void {
        if (this.editorMode.proMode)
            super.registerToolbarItems(toolbar);
    }

}
