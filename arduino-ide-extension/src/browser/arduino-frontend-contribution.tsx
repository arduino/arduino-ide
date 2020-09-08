import { MAIN_MENU_BAR, MenuContribution, MenuModelRegistry, SelectionService, ILogger } from '@theia/core';
import {
    ContextMenuRenderer,
    FrontendApplication, FrontendApplicationContribution,
    OpenerService, StatusBar, StatusBarAlignment
} from '@theia/core/lib/browser';
import { ColorContribution } from '@theia/core/lib/browser/color-application-contribution';
import { ColorRegistry } from '@theia/core/lib/browser/color-registry';
import { CommonMenus } from '@theia/core/lib/browser/common-frontend-contribution';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { CommandContribution, CommandRegistry } from '@theia/core/lib/common/command';
import { MessageService } from '@theia/core/lib/common/message-service';
import URI from '@theia/core/lib/common/uri';
import { EditorMainMenu, EditorManager } from '@theia/editor/lib/browser';
import { FileDialogService } from '@theia/filesystem/lib/browser/file-dialog';
import { ProblemContribution } from '@theia/markers/lib/browser/problem/problem-contribution';
import { MonacoMenus } from '@theia/monaco/lib/browser/monaco-menu';
import { FileNavigatorContribution } from '@theia/navigator/lib/browser/navigator-contribution';
import { OutlineViewContribution } from '@theia/outline-view/lib/browser/outline-view-contribution';
import { OutputContribution } from '@theia/output/lib/browser/output-contribution';
import { ScmContribution } from '@theia/scm/lib/browser/scm-contribution';
import { SearchInWorkspaceFrontendContribution } from '@theia/search-in-workspace/lib/browser/search-in-workspace-frontend-contribution';
import { TerminalMenus } from '@theia/terminal/lib/browser/terminal-frontend-contribution';
import { inject, injectable, postConstruct } from 'inversify';
import * as React from 'react';
import { MainMenuManager } from '../common/main-menu-manager';
import { BoardsService, BoardsServiceClient, CoreService, Port, SketchesService, ToolOutputServiceClient, ExecutableService } from '../common/protocol';
import { ArduinoDaemon } from '../common/protocol/arduino-daemon';
import { ConfigService } from '../common/protocol/config-service';
import { FileSystemExt } from '../common/protocol/filesystem-ext';
import { ArduinoCommands } from './arduino-commands';
import { BoardsConfig } from './boards/boards-config';
import { BoardsConfigDialog } from './boards/boards-config-dialog';
import { BoardsDataStore } from './boards/boards-data-store';
import { BoardsServiceClientImpl } from './boards/boards-service-client-impl';
import { BoardsToolBarItem } from './boards/boards-toolbar-item';
import { EditorMode } from './editor-mode';
import { ArduinoMenus } from './menu/arduino-menus';
import { MonitorConnection } from './monitor/monitor-connection';
import { MonitorViewContribution } from './monitor/monitor-view-contribution';
import { WorkspaceService } from './theia/workspace/workspace-service';
import { ArduinoToolbar } from './toolbar/arduino-toolbar';
import { HostedPluginSupport } from '@theia/plugin-ext/lib/hosted/browser/hosted-plugin';
import { FileService } from '@theia/filesystem/lib/browser/file-service';

const debounce = require('lodash.debounce');

@injectable()
export class ArduinoFrontendContribution implements FrontendApplicationContribution,
    TabBarToolbarContribution, CommandContribution, MenuContribution, ColorContribution {

    @inject(ILogger)
    protected logger: ILogger;

    @inject(MessageService)
    protected readonly messageService: MessageService;

    @inject(BoardsService)
    protected readonly boardsService: BoardsService;

    @inject(CoreService)
    protected readonly coreService: CoreService;

    @inject(ToolOutputServiceClient)
    protected readonly toolOutputServiceClient: ToolOutputServiceClient;

    @inject(BoardsServiceClientImpl)
    protected readonly boardsServiceClientImpl: BoardsServiceClientImpl;

    // Unused but do not remove it. It's required by DI, otherwise `init` method is not called.
    @inject(BoardsServiceClient)
    protected readonly boardsServiceClient: BoardsServiceClient;

    @inject(SelectionService)
    protected readonly selectionService: SelectionService;

    @inject(EditorManager)
    protected readonly editorManager: EditorManager;

    @inject(ContextMenuRenderer)
    protected readonly contextMenuRenderer: ContextMenuRenderer;

    @inject(FileDialogService)
    protected readonly fileDialogService: FileDialogService;

    @inject(FileService)
    protected readonly fileSystem: FileService;

    @inject(SketchesService)
    protected readonly sketchService: SketchesService;

    @inject(BoardsConfigDialog)
    protected readonly boardsConfigDialog: BoardsConfigDialog;

    @inject(MenuModelRegistry)
    protected readonly menuRegistry: MenuModelRegistry;

    @inject(CommandRegistry)
    protected readonly commandRegistry: CommandRegistry;

    @inject(StatusBar)
    protected readonly statusBar: StatusBar;

    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    @inject(MonitorConnection)
    protected readonly monitorConnection: MonitorConnection;

    @inject(FileNavigatorContribution)
    protected readonly fileNavigatorContributions: FileNavigatorContribution;

    @inject(OutputContribution)
    protected readonly outputContribution: OutputContribution;

    @inject(OutlineViewContribution)
    protected readonly outlineContribution: OutlineViewContribution;

    @inject(ProblemContribution)
    protected readonly problemContribution: ProblemContribution;

    @inject(ScmContribution)
    protected readonly scmContribution: ScmContribution;

    @inject(SearchInWorkspaceFrontendContribution)
    protected readonly siwContribution: SearchInWorkspaceFrontendContribution;

    @inject(EditorMode)
    protected readonly editorMode: EditorMode;

    @inject(ArduinoDaemon)
    protected readonly daemon: ArduinoDaemon;

    @inject(OpenerService)
    protected readonly openerService: OpenerService;

    @inject(ConfigService)
    protected readonly configService: ConfigService;

    @inject(BoardsDataStore)
    protected readonly boardsDataStore: BoardsDataStore;

    @inject(MainMenuManager)
    protected readonly mainMenuManager: MainMenuManager;

    @inject(FileSystemExt)
    protected readonly fileSystemExt: FileSystemExt;

    @inject(HostedPluginSupport)
    protected hostedPluginSupport: HostedPluginSupport;

    @inject(ExecutableService)
    protected executableService: ExecutableService;

    @postConstruct()
    protected async init(): Promise<void> {
        if (!window.navigator.onLine) {
            // tslint:disable-next-line:max-line-length
            this.messageService.warn('You appear to be offline. Without an Internet connection, the Arduino CLI might not be able to download the required resources and could cause malfunction. Please connect to the Internet and restart the application.');
        }
        const updateStatusBar = ({ selectedBoard, selectedPort }: BoardsConfig.Config) => {
            this.statusBar.setElement('arduino-selected-board', {
                alignment: StatusBarAlignment.RIGHT,
                text: selectedBoard ? `$(microchip) ${selectedBoard.name}` : '$(close) no board selected',
                className: 'arduino-selected-board'
            });
            if (selectedBoard) {
                this.statusBar.setElement('arduino-selected-port', {
                    alignment: StatusBarAlignment.RIGHT,
                    text: selectedPort ? `on ${Port.toString(selectedPort)}` : '[not connected]',
                    className: 'arduino-selected-port'
                });
            }
        }
        this.boardsServiceClientImpl.onBoardsConfigChanged(updateStatusBar);
        updateStatusBar(this.boardsServiceClientImpl.boardsConfig);
    }

    onStart(app: FrontendApplication): void {
        // Initialize all `pro-mode` widgets. This is a NOOP if in normal mode.
        for (const viewContribution of [
            this.fileNavigatorContributions,
            this.outputContribution,
            this.outlineContribution,
            this.problemContribution,
            this.scmContribution,
            this.siwContribution] as Array<FrontendApplicationContribution>) {
            if (viewContribution.initializeLayout) {
                viewContribution.initializeLayout(app);
            }
        }
        this.boardsServiceClientImpl.onBoardsConfigChanged(async ({ selectedBoard }) => {
            if (selectedBoard) {
                const { name, fqbn } = selectedBoard;
                if (fqbn) {
                    await this.hostedPluginSupport.didStart;
                    this.startLanguageServer(fqbn, name);
                }
            }
        });
    }

    protected startLanguageServer = debounce((fqbn: string, name: string | undefined) => this.doStartLanguageServer(fqbn, name));
    protected async doStartLanguageServer(fqbn: string, name: string | undefined): Promise<void> {
        this.logger.info(`Starting language server: ${fqbn}`);
        const { clangdUri, cliUri, lsUri } = await this.executableService.list();
        const [clangdPath, cliPath, lsPath] = await Promise.all([
            this.fileSystem.fsPath(new URI(clangdUri)),
            this.fileSystem.fsPath(new URI(cliUri)),
            this.fileSystem.fsPath(new URI(lsUri)),
        ]);
        this.commandRegistry.executeCommand('arduino.languageserver.start', {
            lsPath,
            cliPath,
            clangdPath,
            board: {
                fqbn,
                name: name ? `"${name}"` : undefined
            }
        });
    }

    registerToolbarItems(registry: TabBarToolbarRegistry): void {
        registry.registerItem({
            id: BoardsToolBarItem.TOOLBAR_ID,
            render: () => <BoardsToolBarItem
                key='boardsToolbarItem'
                commands={this.commandRegistry}
                boardsServiceClient={this.boardsServiceClientImpl} />,
            isVisible: widget => ArduinoToolbar.is(widget) && widget.side === 'left',
            priority: 7
        });
        registry.registerItem({
            id: 'toggle-serial-monitor',
            command: MonitorViewContribution.TOGGLE_SERIAL_MONITOR_TOOLBAR,
            tooltip: 'Serial Monitor'
        });
        registry.registerItem({
            id: ArduinoCommands.TOGGLE_ADVANCED_MODE.id,
            command: ArduinoCommands.TOGGLE_ADVANCED_MODE_TOOLBAR.id,
            tooltip: this.editorMode.proMode ? 'Switch to Classic Mode' : 'Switch to Advanced Mode',
            text: this.editorMode.proMode ? '$(toggle-on)' : '$(toggle-off)'
        });
    }

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(ArduinoCommands.TOGGLE_COMPILE_FOR_DEBUG, {
            execute: () => this.editorMode.toggleCompileForDebug(),
            isToggled: () => this.editorMode.compileForDebug
        });
        registry.registerCommand(ArduinoCommands.OPEN_SKETCH_FILES, {
            execute: async (uri: URI) => {
                this.openSketchFiles(uri);
            }
        });
        registry.registerCommand(ArduinoCommands.OPEN_BOARDS_DIALOG, {
            execute: async () => {
                const boardsConfig = await this.boardsConfigDialog.open();
                if (boardsConfig) {
                    this.boardsServiceClientImpl.boardsConfig = boardsConfig;
                }
            }
        });
        registry.registerCommand(ArduinoCommands.TOGGLE_ADVANCED_MODE, {
            isToggled: () => this.editorMode.proMode,
            execute: () => this.editorMode.toggleProMode()
        });
        registry.registerCommand(ArduinoCommands.TOGGLE_ADVANCED_MODE_TOOLBAR, {
            isVisible: widget => ArduinoToolbar.is(widget) && widget.side === 'right',
            isToggled: () => this.editorMode.proMode,
            execute: () => this.editorMode.toggleProMode()
        });
    }

    registerMenus(registry: MenuModelRegistry) {
        if (!this.editorMode.proMode) {
            const menuId = (menuPath: string[]): string => {
                const index = menuPath.length - 1;
                const menuId = menuPath[index];
                return menuId;
            }
            registry.getMenu(MAIN_MENU_BAR).removeNode(menuId(MonacoMenus.SELECTION));
            registry.getMenu(MAIN_MENU_BAR).removeNode(menuId(EditorMainMenu.GO));
            registry.getMenu(MAIN_MENU_BAR).removeNode(menuId(TerminalMenus.TERMINAL));
            registry.getMenu(MAIN_MENU_BAR).removeNode(menuId(CommonMenus.VIEW));
        }
        registry.registerSubmenu(ArduinoMenus.SKETCH, 'Sketch');
        registry.registerSubmenu(ArduinoMenus.TOOLS, 'Tools');
        registry.registerMenuAction(ArduinoMenus.SKETCH, {
            commandId: ArduinoCommands.TOGGLE_COMPILE_FOR_DEBUG.id,
            label: 'Optimize for Debugging',
            order: '1'
        });
        registry.registerMenuAction(CommonMenus.HELP, {
            commandId: ArduinoCommands.TOGGLE_ADVANCED_MODE.id,
            label: 'Advanced Mode'
        });
    }

    protected async openSketchFiles(uri: URI): Promise<void> {
        try {
            const sketch = await this.sketchService.loadSketch(uri.toString());
            const { mainFileUri, otherSketchFileUris, additionalFileUris } = sketch;
            for (const uri of [mainFileUri, ...otherSketchFileUris, ...additionalFileUris]) {
                await this.ensureOpened(uri);
            }
            await this.ensureOpened(mainFileUri, true);
        } catch (e) {
            console.error(e);
            const message = e instanceof Error ? e.message : JSON.stringify(e);
            this.messageService.error(message);
        }
    }

    protected async ensureOpened(uri: string, forceOpen: boolean = false): Promise<any> {
        const widget = this.editorManager.all.find(widget => widget.editor.uri.toString() === uri);
        if (!widget || forceOpen) {
            return this.editorManager.open(new URI(uri));
        }
    }

    registerColors(colors: ColorRegistry): void {
        colors.register(
            {
                id: 'arduino.branding.primary',
                defaults: {
                    dark: 'statusBar.background',
                    light: 'statusBar.background'
                },
                description: 'The primary branding color, such as dialog titles, library, and board manager list labels.'
            },
            {
                id: 'arduino.branding.secondary',
                defaults: {
                    dark: 'statusBar.background',
                    light: 'statusBar.background'
                },
                description: 'Secondary branding color for list selections, dropdowns, and widget borders.'
            },
            {
                id: 'arduino.foreground',
                defaults: {
                    dark: 'editorWidget.background',
                    light: 'editorWidget.background',
                    hc: 'editorWidget.background'
                },
                description: 'Color of the Arduino Pro IDE foreground which is used for dialogs, such as the Select Board dialog.'
            },
            {
                id: 'arduino.toolbar.background',
                defaults: {
                    dark: 'button.background',
                    light: 'button.background',
                    hc: 'activityBar.inactiveForeground'
                },
                description: 'Background color of the toolbar items. Such as Upload, Verify, etc.'
            },
            {
                id: 'arduino.toolbar.hoverBackground',
                defaults: {
                    dark: 'button.hoverBackground',
                    light: 'button.hoverBackground',
                    hc: 'activityBar.inactiveForeground'
                },
                description: 'Background color of the toolbar items when hovering over them. Such as Upload, Verify, etc.'
            },
            {
                id: 'arduino.output.foreground',
                defaults: {
                    dark: 'editor.foreground',
                    light: 'editor.foreground',
                    hc: 'editor.foreground'
                },
                description: 'Color of the text in the Output view.'
            },
            {
                id: 'arduino.output.background',
                defaults: {
                    dark: 'editor.background',
                    light: 'editor.background',
                    hc: 'editor.background'
                },
                description: 'Background color of the Output view.'
            }
        );
    }

}
