import { injectable, inject } from 'inversify';
import { MenuModelRegistry } from '@theia/core';
import { KeybindingRegistry } from '@theia/core/lib/browser';
import { TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { DebugFrontendApplicationContribution, DebugCommands } from '@theia/debug/lib/browser/debug-frontend-application-contribution';
import { DebugSessionOptions } from "@theia/debug/lib/browser/debug-session-options";
import { EditorMode } from "arduino-ide-extension/lib/browser/editor-mode";
import { ArduinoDebugConfigurationManager } from './arduino-debug-configuration-manager';

@injectable()
export class ArduinoDebugFrontendApplicationContribution extends DebugFrontendApplicationContribution {

    @inject(EditorMode)
    protected readonly editorMode: EditorMode;

    async start(noDebug?: boolean, debugSessionOptions?: DebugSessionOptions): Promise<void> {
        const configurations = this.configurations as ArduinoDebugConfigurationManager;
        let current = debugSessionOptions ? debugSessionOptions : configurations.current;
        // If no configurations are currently present, create them
        if (!current) {
            await configurations.createDefaultConfiguration();
            current = configurations.current;
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
        if (this.editorMode.proMode) {
            return super.initializeLayout();
        }
        return Promise.resolve();
    }

    registerMenus(menus: MenuModelRegistry): void {
        if (this.editorMode.proMode) {
            super.registerMenus(menus);
            menus.unregisterMenuAction(DebugCommands.START_NO_DEBUG);
        }
    }

    registerKeybindings(keybindings: KeybindingRegistry): void {
        if (this.editorMode.proMode) {
            super.registerKeybindings(keybindings);
            keybindings.unregisterKeybinding({
                command: DebugCommands.START_NO_DEBUG.id,
                keybinding: 'ctrl+f5'
            });
        }
    }

    registerToolbarItems(toolbar: TabBarToolbarRegistry): void {
        if (this.editorMode.proMode) {
            super.registerToolbarItems(toolbar);
        }
    }

}
