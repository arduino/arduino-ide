import { injectable, inject } from 'inversify';
import { MenuModelRegistry, MessageService, Command, CommandRegistry } from '@theia/core';
import { KeybindingRegistry } from '@theia/core/lib/browser';
import { TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { DebugFrontendApplicationContribution, DebugCommands } from '@theia/debug/lib/browser/debug-frontend-application-contribution';
import { DebugSessionOptions } from "@theia/debug/lib/browser/debug-session-options";
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import { FileSystem } from '@theia/filesystem/lib/common';
import URI from '@theia/core/lib/common/uri';
import { EditorManager } from '@theia/editor/lib/browser';
import { EditorMode } from "arduino-ide-extension/lib/browser/editor-mode";
import { SketchesService } from 'arduino-ide-extension/lib/common/protocol/sketches-service';
import { ArduinoToolbar } from 'arduino-ide-extension/lib/browser/toolbar/arduino-toolbar';
import { ArduinoDebugConfigurationManager } from './arduino-debug-configuration-manager';

export namespace ArduinoDebugCommands {
    export const START_DEBUG: Command = {
        id: 'arduino-start-debug',
        label: 'Start Debugging'
    }
}

@injectable()
export class ArduinoDebugFrontendApplicationContribution extends DebugFrontendApplicationContribution {

    @inject(EditorMode)
    protected readonly editorMode: EditorMode;

    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    @inject(SketchesService)
    protected readonly sketchesService: SketchesService;

    @inject(FileSystem)
    protected readonly fileSystem: FileSystem;

    @inject(EditorManager)
    protected readonly editorManager: EditorManager;

    @inject(MessageService)
    protected readonly messageService: MessageService;

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
            if (current.configuration.type === 'arduino') {
                const wsStat = this.workspaceService.workspace;
                let sketchFileURI: URI | undefined;
                if (wsStat && await this.sketchesService.isSketchFolder(wsStat.resource.toString())) {
                    const wsPath = wsStat.resource.path;
                    const sketchFilePath = wsPath.join(wsPath.name + '.ino').toString();
                    sketchFileURI = new URI(sketchFilePath);
                } else if (this.editorManager.currentEditor) {
                    const editorURI = this.editorManager.currentEditor.getResourceUri();
                    if (editorURI && editorURI.path && editorURI.path.ext === '.ino') {
                        sketchFileURI = editorURI;
                    }
                }
                if (sketchFileURI) {
                    await this.editorManager.open(sketchFileURI);
                    await this.manager.start(current);
                } else {
                    this.messageService.error('Please open a sketch file to start debugging.')
                }
            } else {
                await this.manager.start(current);
            }
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
        super.registerToolbarItems(toolbar);
        toolbar.registerItem({
            id: ArduinoDebugCommands.START_DEBUG.id,
            command: ArduinoDebugCommands.START_DEBUG.id,
            tooltip: 'Start Debugging',
            priority: 3
        });
    }

    registerCommands(registry: CommandRegistry): void {
        super.registerCommands(registry);
        registry.registerCommand(ArduinoDebugCommands.START_DEBUG, {
            isVisible: widget => ArduinoToolbar.is(widget) && widget.side === 'left',
            isEnabled: widget => ArduinoToolbar.is(widget) && widget.side === 'left',
            execute: () => {
                registry.executeCommand(DebugCommands.START.id);
            }
        });
    }


}
