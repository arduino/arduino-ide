import { Mutex } from 'async-mutex';
import { MAIN_MENU_BAR, MenuContribution, MenuModelRegistry, SelectionService, ILogger, DisposableCollection } from '@theia/core';
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
import { EditorMainMenu, EditorManager, EditorOpenerOptions } from '@theia/editor/lib/browser';
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
import { remote } from 'electron';
import { MainMenuManager } from '../common/main-menu-manager';
import { BoardsService, CoreService, Port, SketchesService, ExecutableService, Sketch } from '../common/protocol';
import { ArduinoDaemon } from '../common/protocol/arduino-daemon';
import { ConfigService } from '../common/protocol/config-service';
import { FileSystemExt } from '../common/protocol/filesystem-ext';
import { ArduinoCommands } from './arduino-commands';
import { BoardsConfig } from './boards/boards-config';
import { BoardsConfigDialog } from './boards/boards-config-dialog';
import { BoardsDataStore } from './boards/boards-data-store';
import { BoardsServiceProvider } from './boards/boards-service-provider';
import { BoardsToolBarItem } from './boards/boards-toolbar-item';
import { EditorMode } from './editor-mode';
import { ArduinoMenus } from './menu/arduino-menus';
import { MonitorConnection } from './monitor/monitor-connection';
import { MonitorViewContribution } from './monitor/monitor-view-contribution';
import { WorkspaceService } from './theia/workspace/workspace-service';
import { ArduinoToolbar } from './toolbar/arduino-toolbar';
import { HostedPluginSupport } from '@theia/plugin-ext/lib/hosted/browser/hosted-plugin';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { ResponseService } from '../common/protocol/response-service';
import { ArduinoPreferences } from './arduino-preferences';
import { SketchesServiceClientImpl } from '../common/protocol/sketches-service-client-impl';
import { SaveAsSketch } from './contributions/save-as-sketch';
import { FileChangeType } from '@theia/filesystem/lib/browser';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';

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

    @inject(BoardsServiceProvider)
    protected readonly boardsServiceClientImpl: BoardsServiceProvider;

    @inject(SelectionService)
    protected readonly selectionService: SelectionService;

    @inject(EditorManager)
    protected readonly editorManager: EditorManager;

    @inject(ContextMenuRenderer)
    protected readonly contextMenuRenderer: ContextMenuRenderer;

    @inject(FileDialogService)
    protected readonly fileDialogService: FileDialogService;

    @inject(FileService)
    protected readonly fileService: FileService;

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

    @inject(ResponseService)
    protected readonly responseService: ResponseService;

    @inject(ArduinoPreferences)
    protected readonly arduinoPreferences: ArduinoPreferences;

    @inject(SketchesServiceClientImpl)
    protected readonly sketchServiceClient: SketchesServiceClientImpl;

    @inject(FrontendApplicationStateService)
    protected readonly appStateService: FrontendApplicationStateService;

    protected invalidConfigPopup: Promise<void | 'No' | 'Yes' | undefined> | undefined;
    protected toDisposeOnStop = new DisposableCollection();

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
        this.appStateService.reachedState('ready').then(async () => {
            const sketch = await this.sketchServiceClient.currentSketch();
            if (sketch && (!await this.sketchService.isTemp(sketch))) {
                this.toDisposeOnStop.push(this.fileService.watch(new URI(sketch.uri)));
                this.toDisposeOnStop.push(this.fileService.onDidFilesChange(async event => {
                    for (const { type, resource } of event.changes) {
                        if (type === FileChangeType.ADDED && resource.parent.toString() === sketch.uri) {
                            const reloadedSketch = await this.sketchService.loadSketch(sketch.uri)
                            if (Sketch.isInSketch(resource, reloadedSketch)) {
                                this.ensureOpened(resource.toString(), true, { mode: 'open' });
                            }
                        }
                    }
                }));
            }
        });

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
        const start = async ({ selectedBoard }: BoardsConfig.Config) => {
            if (selectedBoard) {
                const { name, fqbn } = selectedBoard;
                if (fqbn) {
                    this.startLanguageServer(fqbn, name);
                }
            }
        };
        this.boardsServiceClientImpl.onBoardsConfigChanged(start);
        this.arduinoPreferences.onPreferenceChanged(event => {
            if (event.preferenceName === 'arduino.language.log' && event.newValue !== event.oldValue) {
                start(this.boardsServiceClientImpl.boardsConfig);
            }
        });
        this.arduinoPreferences.ready.then(() => {
            const webContents = remote.getCurrentWebContents();
            const zoomLevel = this.arduinoPreferences.get('arduino.window.zoomLevel');
            webContents.setZoomLevel(zoomLevel);
        });
        this.arduinoPreferences.onPreferenceChanged(event => {
            if (event.preferenceName === 'arduino.window.zoomLevel' && typeof event.newValue === 'number' && event.newValue !== event.oldValue) {
                const webContents = remote.getCurrentWebContents();
                webContents.setZoomLevel(event.newValue || 0);
            }
        });
        app.shell.leftPanelHandler.removeMenu('settings-menu');
    }

    onStop(): void {
        this.toDisposeOnStop.dispose();
    }

    protected languageServerFqbn?: string;
    protected languageServerStartMutex = new Mutex();
    protected async startLanguageServer(fqbn: string, name: string | undefined): Promise<void> {
        const release = await this.languageServerStartMutex.acquire();
        try {
            await this.hostedPluginSupport.didStart;
            const details = await this.boardsService.getBoardDetails({ fqbn });
            if (!details) {
                // Core is not installed for the selected board.
                console.info(`Could not start language server for ${fqbn}. The core is not installed for the board.`);
                if (this.languageServerFqbn) {
                    try {
                        await this.commandRegistry.executeCommand('arduino.languageserver.stop');
                        console.info(`Stopped language server process for ${this.languageServerFqbn}.`);
                        this.languageServerFqbn = undefined;
                    } catch (e) {
                        console.error(`Failed to start language server process for ${this.languageServerFqbn}`, e);
                        throw e;
                    }
                }
                return;
            }
            if (fqbn === this.languageServerFqbn) {
                // NOOP
                return;
            }
            this.logger.info(`Starting language server: ${fqbn}`);
            const log = this.arduinoPreferences.get('arduino.language.log');
            let currentSketchPath: string | undefined = undefined;
            if (log) {
                const currentSketch = await this.sketchServiceClient.currentSketch();
                if (currentSketch) {
                    currentSketchPath = await this.fileService.fsPath(new URI(currentSketch.uri));
                }
            }
            const { clangdUri, cliUri, lsUri } = await this.executableService.list();
            const [clangdPath, cliPath, lsPath] = await Promise.all([
                this.fileService.fsPath(new URI(clangdUri)),
                this.fileService.fsPath(new URI(cliUri)),
                this.fileService.fsPath(new URI(lsUri)),
            ]);
            this.languageServerFqbn = await Promise.race([
                new Promise<undefined>((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${20_000} ms.`)), 20_000)),
                this.commandRegistry.executeCommand<string>('arduino.languageserver.start', {
                    lsPath,
                    cliPath,
                    clangdPath,
                    log: currentSketchPath ? currentSketchPath : log,
                    board: {
                        fqbn,
                        name: name ? `"${name}"` : undefined
                    }
                })
            ]);
        } catch (e) {
            console.log(`Failed to start language server for ${fqbn}`, e);
            this.languageServerFqbn = undefined;
        } finally {
            release();
        }
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
            execute: async (query?: string | undefined) => {
                const boardsConfig = await this.boardsConfigDialog.open(query);
                if (boardsConfig) {
                    this.boardsServiceClientImpl.boardsConfig = boardsConfig;
                }
            }
        });
    }

    registerMenus(registry: MenuModelRegistry) {
        const menuId = (menuPath: string[]): string => {
            const index = menuPath.length - 1;
            const menuId = menuPath[index];
            return menuId;
        }
        registry.getMenu(MAIN_MENU_BAR).removeNode(menuId(MonacoMenus.SELECTION));
        registry.getMenu(MAIN_MENU_BAR).removeNode(menuId(EditorMainMenu.GO));
        registry.getMenu(MAIN_MENU_BAR).removeNode(menuId(TerminalMenus.TERMINAL));
        registry.getMenu(MAIN_MENU_BAR).removeNode(menuId(CommonMenus.VIEW));

        registry.registerSubmenu(ArduinoMenus.SKETCH, 'Sketch');
        registry.registerSubmenu(ArduinoMenus.TOOLS, 'Tools');
        registry.registerMenuAction(ArduinoMenus.SKETCH__MAIN_GROUP, {
            commandId: ArduinoCommands.TOGGLE_COMPILE_FOR_DEBUG.id,
            label: 'Optimize for Debugging',
            order: '4'
        });
    }

    protected async openSketchFiles(uri: URI): Promise<void> {
        try {
            const sketch = await this.sketchService.loadSketch(uri.toString());
            const { mainFileUri, rootFolderFileUris } = sketch;
            for (const uri of [mainFileUri, ...rootFolderFileUris]) {
                await this.ensureOpened(uri);
            }
            await this.ensureOpened(mainFileUri, true);
            if (mainFileUri.endsWith('.pde')) {
                const message = `The '${sketch.name}' still uses the old \`.pde\` format. Do you want to switch to the new \`.ino\` extension?`;
                this.messageService.info(message, 'Later', 'Yes').then(async answer => {
                    if (answer === 'Yes') {
                        this.commandRegistry.executeCommand(SaveAsSketch.Commands.SAVE_AS_SKETCH.id, { execOnlyIfTemp: false, openAfterMove: true, wipeOriginal: false });
                    }
                });
            }
        } catch (e) {
            console.error(e);
            const message = e instanceof Error ? e.message : JSON.stringify(e);
            this.messageService.error(message);
        }
    }

    protected async ensureOpened(uri: string, forceOpen: boolean = false, options?: EditorOpenerOptions | undefined): Promise<any> {
        const widget = this.editorManager.all.find(widget => widget.editor.uri.toString() === uri);
        if (!widget || forceOpen) {
            return this.editorManager.open(new URI(uri), options);
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
                description: 'Color of the Arduino IDE foreground which is used for dialogs, such as the Select Board dialog.'
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
                    light: 'button.foreground',
                    hc: 'textLink.foreground'
                },
                description: 'Background color of the toolbar items when hovering over them. Such as Upload, Verify, etc.'
            },
            {
                id: 'arduino.toolbar.toggleBackground',
                defaults: {
                    dark: 'editor.selectionBackground',
                    light: 'editor.selectionBackground',
                    hc: 'textPreformat.foreground'
                },
                description: 'Toggle color of the toolbar items when they are currently toggled (the command is in progress)'
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
