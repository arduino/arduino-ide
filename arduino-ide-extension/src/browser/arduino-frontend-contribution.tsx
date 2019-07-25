import * as React from 'react';
import { injectable, inject, postConstruct } from 'inversify';
import URI from '@theia/core/lib/common/uri';
import { EditorWidget } from '@theia/editor/lib/browser/editor-widget';
import { MessageService } from '@theia/core/lib/common/message-service';
import { CommandContribution, CommandRegistry, Command } from '@theia/core/lib/common/command';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { BoardsService, Board } from '../common/protocol/boards-service';
import { ArduinoCommands } from './arduino-commands';
import { ConnectedBoards } from './components/connected-boards';
import { CoreService } from '../common/protocol/core-service';
import { WorkspaceServiceExt } from './workspace-service-ext';
import { ToolOutputServiceClient } from '../common/protocol/tool-output-service';
import { QuickPickService } from '@theia/core/lib/common/quick-pick-service';
import { BoardsListWidgetFrontendContribution } from './boards/boards-widget-frontend-contribution';
import { BoardsNotificationService } from './boards-notification-service';
import { WorkspaceRootUriAwareCommandHandler, WorkspaceCommands } from '@theia/workspace/lib/browser/workspace-commands';
import { SelectionService, MenuContribution, MenuModelRegistry, MAIN_MENU_BAR } from '@theia/core';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import { SketchFactory } from './sketch-factory';
import { ArduinoToolbar } from './toolbar/arduino-toolbar';
import { EditorManager, EditorMainMenu } from '@theia/editor/lib/browser';
import { ContextMenuRenderer, OpenerService, Widget, StatusBar, ShellLayoutRestorer } from '@theia/core/lib/browser';
import { OpenFileDialogProps, FileDialogService } from '@theia/filesystem/lib/browser/file-dialog';
import { FileSystem, FileStat } from '@theia/filesystem/lib/common';
import { ArduinoToolbarContextMenu } from './arduino-file-menu';
import { Sketch, SketchesService } from '../common/protocol/sketches-service';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { CommonCommands, CommonMenus } from '@theia/core/lib/browser/common-frontend-contribution';
import { FileSystemCommands } from '@theia/filesystem/lib/browser/filesystem-frontend-contribution';
import { FileDownloadCommands } from '@theia/filesystem/lib/browser/download/file-download-command-contribution';
import { MonacoMenus } from '@theia/monaco/lib/browser/monaco-menu';
import { TerminalMenus } from '@theia/terminal/lib/browser/terminal-frontend-contribution';
import { MaybePromise } from '@theia/core/lib/common/types';
import { SelectBoardDialog } from './boards/select-board-dialog';
import { BoardsToolBarItem } from './boards/boards-toolbar-item';

export namespace ArduinoMenus {
    export const SKETCH = [...MAIN_MENU_BAR, '3_sketch'];
    export const TOOLS = [...MAIN_MENU_BAR, '4_tools'];
}

export const ARDUINO_PRO_MODE: boolean = (() => {
    const proModeStr = window.localStorage.getItem('arduino-pro-mode');
    return proModeStr === 'true';
})();

@injectable()
export class ArduinoFrontendContribution implements TabBarToolbarContribution, CommandContribution, MenuContribution {

    @inject(MessageService)
    protected readonly messageService: MessageService;

    @inject(BoardsService)
    protected readonly boardService: BoardsService;

    @inject(CoreService)
    protected readonly coreService: CoreService;

    @inject(WorkspaceServiceExt)
    protected readonly workspaceServiceExt: WorkspaceServiceExt;

    @inject(ToolOutputServiceClient)
    protected readonly toolOutputServiceClient: ToolOutputServiceClient;

    @inject(QuickPickService)
    protected readonly quickPickService: QuickPickService;

    @inject(BoardsListWidgetFrontendContribution)
    protected readonly boardsListWidgetFrontendContribution: BoardsListWidgetFrontendContribution;

    @inject(BoardsNotificationService)
    protected readonly boardsNotificationService: BoardsNotificationService;

    @inject(SelectionService)
    protected readonly selectionService: SelectionService;

    @inject(SketchFactory)
    protected readonly sketchFactory: SketchFactory;

    @inject(EditorManager)
    protected readonly editorManager: EditorManager;

    @inject(ContextMenuRenderer)
    protected readonly contextMenuRenderer: ContextMenuRenderer;

    @inject(FileDialogService)
    protected readonly fileDialogService: FileDialogService;

    @inject(FileSystem)
    protected readonly fileSystem: FileSystem;

    @inject(OpenerService)
    protected readonly openerService: OpenerService;

    @inject(WindowService)
    protected readonly windowService: WindowService;

    @inject(SketchesService)
    protected readonly sketches: SketchesService;

    @inject(SelectBoardDialog)
    protected readonly selectBoardsDialog: SelectBoardDialog;

    @inject(MenuModelRegistry)
    protected readonly menuRegistry: MenuModelRegistry;

    @inject(CommandRegistry)
    protected readonly commands: CommandRegistry;

    @inject(StatusBar)
    protected readonly statusBar: StatusBar;

    @inject(ShellLayoutRestorer)
    protected readonly layoutRestorer: ShellLayoutRestorer;

    protected boardsToolbarItem: BoardsToolBarItem | null;
    protected wsSketchCount: number = 0;

    constructor(@inject(WorkspaceService) protected readonly workspaceService: WorkspaceService) {
        this.workspaceService.onWorkspaceChanged(() => {
            if (this.workspaceService.workspace) {
                this.registerSketchesInMenu(this.menuRegistry);
            }
        })
    }

    @postConstruct()
    protected async init(): Promise<void> {
        // This is a hack. Otherwise, the backend services won't bind.
        await this.workspaceServiceExt.roots();
    }

    registerToolbarItems(registry: TabBarToolbarRegistry): void {
        registry.registerItem({
            id: ArduinoCommands.VERIFY.id,
            command: ArduinoCommands.VERIFY.id,
            tooltip: 'Verify',
            text: '$(check)'
        });
        registry.registerItem({
            id: ArduinoCommands.UPLOAD.id,
            command: ArduinoCommands.UPLOAD.id,
            tooltip: 'Upload',
            text: '$(arrow-right)'
        });
        registry.registerItem({
            id: ArduinoCommands.SHOW_OPEN_CONTEXT_MENU.id,
            command: ArduinoCommands.SHOW_OPEN_CONTEXT_MENU.id,
            tooltip: 'Open',
            text: '$(arrow-up)'
        });
        registry.registerItem({
            id: ArduinoCommands.SAVE_SKETCH.id,
            command: ArduinoCommands.SAVE_SKETCH.id,
            tooltip: 'Save',
            text: '$(arrow-down)'
        });
        registry.registerItem({
            id: ConnectedBoards.TOOLBAR_ID,
            render: () => <BoardsToolBarItem
                key='boardsToolbarItem'
                ref={ref => this.boardsToolbarItem = ref}
                commands={this.commands}
                statusBar={this.statusBar}
                contextMenuRenderer={this.contextMenuRenderer}
                boardsNotificationService={this.boardsNotificationService}
                boardService={this.boardService} />,
            isVisible: widget => this.isArduinoToolbar(widget)
        })
    }

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(ArduinoCommands.VERIFY, {
            isVisible: widget => this.isArduinoToolbar(widget),
            isEnabled: widget => true,
            execute: async () => {
                const widget = this.getCurrentWidget();
                if (widget instanceof EditorWidget) {
                    await widget.saveable.save();
                }

                const uri = this.toUri(widget);
                if (!uri) {
                    return;
                }

                try {
                    await this.coreService.compile({ uri: uri.toString() });
                } catch (e) {
                    await this.messageService.error(e.toString());
                }
            }
        });
        registry.registerCommand(ArduinoCommands.UPLOAD, {
            isVisible: widget => this.isArduinoToolbar(widget),
            isEnabled: widget => true,
            execute: async () => {
                const widget = this.getCurrentWidget();
                if (widget instanceof EditorWidget) {
                    await widget.saveable.save();
                }

                const uri = this.toUri(widget);
                if (!uri) {
                    return;
                }

                try {
                    await this.coreService.upload({ uri: uri.toString() });
                } catch (e) {
                    await this.messageService.error(e.toString());
                }
            }
        });
        registry.registerCommand(ArduinoCommands.SHOW_OPEN_CONTEXT_MENU, {
            isVisible: widget => this.isArduinoToolbar(widget),
            isEnabled: widget => this.isArduinoToolbar(widget),
            execute: async (widget: Widget, target: EventTarget) => {
                if (this.wsSketchCount) {
                    const el = (target as HTMLElement).parentElement;
                    if (el) {
                        this.contextMenuRenderer.render(ArduinoToolbarContextMenu.OPEN_SKETCH_PATH, {
                            x: el.getBoundingClientRect().left,
                            y: el.getBoundingClientRect().top + el.offsetHeight
                        });
                    }
                } else {
                    this.commands.executeCommand(ArduinoCommands.OPEN_FILE_NAVIGATOR.id);
                }
            }
        });
        registry.registerCommand(ArduinoCommands.OPEN_FILE_NAVIGATOR, {
            isEnabled: () => true,
            execute: () => this.doOpenFile()
        })
        registry.registerCommand(ArduinoCommands.OPEN_SKETCH, {
            isEnabled: () => true,
            execute: async (sketch: Sketch) => {
                this.openSketchFilesInNewWindow(sketch.uri);
            }
        })
        registry.registerCommand(ArduinoCommands.SAVE_SKETCH, {
            isEnabled: widget => this.isArduinoToolbar(widget),
            isVisible: widget => this.isArduinoToolbar(widget),
            execute: async (sketch: Sketch) => {
                registry.executeCommand(CommonCommands.SAVE_ALL.id);
            }
        })
        registry.registerCommand(ArduinoCommands.NEW_SKETCH, new WorkspaceRootUriAwareCommandHandler(this.workspaceService, this.selectionService, {
            execute: async uri => {
                try {
                    // hack: sometimes we don't get the workspace root, but the currently active file: correct for that
                    if (uri.path.ext !== "") {
                        uri = uri.withPath(uri.path.dir.dir);
                    }

                    await this.sketchFactory.createNewSketch(uri);
                } catch (e) {
                    await this.messageService.error(e.toString());
                }
            }
        }));
        registry.registerCommand(ArduinoCommands.REFRESH_BOARDS, {
            isEnabled: () => true,
            execute: () => this.boardsNotificationService.notifyBoardsInstalled()
        });
        registry.registerCommand(ArduinoCommands.SELECT_BOARD, {
            isEnabled: () => true,
            execute: async (board: Board) => {
                this.selectBoard(board);
            }
        })
        registry.registerCommand(ArduinoCommands.OPEN_BOARDS_DIALOG, {
            isEnabled: () => true,
            execute: async () => {
                const boardAndPort = await this.selectBoardsDialog.open();
                if (boardAndPort && boardAndPort.board) {
                    this.selectBoard(boardAndPort.board);
                }
            }
        })
        registry.registerCommand(ArduinoCommands.TOGGLE_PROMODE, {
            execute: () => {
                const oldModeState = ARDUINO_PRO_MODE;
                window.localStorage.setItem('arduino-pro-mode', oldModeState ? 'false' : 'true');
                registry.executeCommand('reset.layout');
            },
            isToggled: () => ARDUINO_PRO_MODE
        })
    }

    protected async selectBoard(board: Board) {
        await this.boardService.selectBoard(board);
        if (this.boardsToolbarItem) {
            this.boardsToolbarItem.setSelectedBoard(board);
        }
    }

    registerMenus(registry: MenuModelRegistry) {
        if (!ARDUINO_PRO_MODE) {
            registry.unregisterMenuAction(FileSystemCommands.UPLOAD);
            registry.unregisterMenuAction(FileDownloadCommands.DOWNLOAD);

            registry.unregisterMenuAction(WorkspaceCommands.NEW_FILE);
            registry.unregisterMenuAction(WorkspaceCommands.NEW_FOLDER);

            registry.unregisterMenuAction(WorkspaceCommands.OPEN_FOLDER);
            registry.unregisterMenuAction(WorkspaceCommands.OPEN_WORKSPACE);
            registry.unregisterMenuAction(WorkspaceCommands.OPEN_RECENT_WORKSPACE);
            registry.unregisterMenuAction(WorkspaceCommands.SAVE_WORKSPACE_AS);
            registry.unregisterMenuAction(WorkspaceCommands.CLOSE);

            registry.getMenu(MAIN_MENU_BAR).removeNode(this.getMenuId(MonacoMenus.SELECTION));
            registry.getMenu(MAIN_MENU_BAR).removeNode(this.getMenuId(EditorMainMenu.GO));
            registry.getMenu(MAIN_MENU_BAR).removeNode(this.getMenuId(TerminalMenus.TERMINAL));
            registry.getMenu(MAIN_MENU_BAR).removeNode(this.getMenuId(CommonMenus.VIEW));
        }

        registry.registerSubmenu(ArduinoMenus.SKETCH, 'Sketch');
        registry.registerMenuAction(ArduinoMenus.SKETCH, {
            commandId: ArduinoCommands.VERIFY.id,
            label: 'Verify/Compile',
            order: '1'
        });
        registry.registerMenuAction(ArduinoMenus.SKETCH, {
            commandId: ArduinoCommands.UPLOAD.id,
            label: 'Upload',
            order: '2'
        });
        registry.registerMenuAction(ArduinoToolbarContextMenu.OPEN_GROUP, {
            commandId: ArduinoCommands.OPEN_FILE_NAVIGATOR.id,
            label: 'Open...'
        });

        registry.registerSubmenu(ArduinoMenus.TOOLS, 'Tools');

        registry.registerMenuAction(CommonMenus.HELP, {
            commandId: ArduinoCommands.TOGGLE_PROMODE.id,
            label: 'Advanced Mode'
        })
    }

    protected getMenuId(menuPath: string[]): string {
        const index = menuPath.length - 1;
        const menuId = menuPath[index];
        return menuId;
    }

    protected registerSketchesInMenu(registry: MenuModelRegistry) {
        this.getWorkspaceSketches().then(sketches => {
            this.wsSketchCount = sketches.length;
            sketches.forEach(sketch => {
                const command: Command = {
                    id: 'openSketch' + sketch.name
                }
                this.commands.registerCommand(command, {
                    execute: () => this.commands.executeCommand(ArduinoCommands.OPEN_SKETCH.id, sketch)
                });

                registry.registerMenuAction(ArduinoToolbarContextMenu.WS_SKETCHES_GROUP, {
                    commandId: command.id,
                    label: sketch.name
                });
            })
        })
    }

    protected async getWorkspaceSketches(): Promise<Sketch[]> {
        const sketches = this.sketches.getSketches(this.workspaceService.workspace);
        return sketches;
    }

    protected async openSketchFilesInNewWindow(uri: string) {
        const location = new URL(window.location.href);
        location.searchParams.set('sketch', uri);
        this.windowService.openNewWindow(location.toString());
    }

    async openSketchFiles(uri: string) {
        const fileStat = await this.fileSystem.getFileStat(uri);
        if (fileStat) {
            const uris = await this.sketches.getSketchFiles(fileStat);
            for (const uri of uris) {
                this.editorManager.open(new URI(uri));
            }
        }
    }

    /**
     * Opens a file after prompting the `Open File` dialog. Resolves to `undefined`, if
     *  - the workspace root is not set,
     *  - the file to open does not exist, or
     *  - it was not a file, but a directory.
     *
     * Otherwise, resolves to the URI of the file.
     */
    protected async doOpenFile(): Promise<URI | undefined> {
        const props: OpenFileDialogProps = {
            title: WorkspaceCommands.OPEN_FILE.dialogLabel,
            canSelectFolders: false,
            canSelectFiles: true
        };
        const [rootStat] = await this.workspaceService.roots;
        const destinationFileUri = await this.fileDialogService.showOpenDialog(props, rootStat);
        if (destinationFileUri) {
            const destinationFile = await this.fileSystem.getFileStat(destinationFileUri.toString());
            if (destinationFile && !destinationFile.isDirectory) {
                const message = await this.validate(destinationFile);
                if (!message) {
                    await this.openSketchFilesInNewWindow(destinationFileUri.toString());
                    return destinationFileUri;
                } else {
                    this.messageService.warn(message);
                }
            }
        }
        return undefined;
    }

    protected getCurrentWidget(): EditorWidget | undefined {
        let widget = this.editorManager.currentEditor;
        if (!widget) {
            const visibleWidgets = this.editorManager.all.filter(w => w.isVisible);
            if (visibleWidgets.length > 0) {
                widget = visibleWidgets[0];
            }
        }
        return widget;
    }

    /**
     * Returns `undefined` if the `file` is valid. Otherwise, returns with the validation error message.
     */
    protected validate(file: FileStat): MaybePromise<string | undefined> {
        const uri = new URI(file.uri);
        const path = uri.path;
        const { name, ext, dir } = path;
        if (ext !== '.ino') {
            return "Only sketches with '.ino' extension can be opened.";
        }
        if (name !== dir.name) {
            return `The file "${name}${ext}" needs to be inside a sketch folder named "${name}".`;
        }
        return undefined;
    }

    // private async onNoBoardsInstalled() {
    //     const action = await this.messageService.info("You have no boards installed. Use the boards manager to install one.", "Open Boards Manager");
    //     if (!action) {
    //         return;
    //     }

    //     this.boardsListWidgetFrontendContribution.openView({ reveal: true });
    // }

    // private async onUnknownBoard() {
    //     const action = await this.messageService.warn("There's a board connected for which you need to install software." +
    //         " If this were not a PoC we would offer you the right package now.", "Open Boards Manager");
    //     if (!action) {
    //         return;
    //     }

    //     this.boardsListWidgetFrontendContribution.openView({ reveal: true });
    // }

    private isArduinoToolbar(maybeToolbarWidget: any): boolean {
        if (maybeToolbarWidget instanceof ArduinoToolbar) {
            return true;
        }
        return false;
    }

    private toUri(arg: any): URI | undefined {
        if (arg instanceof URI) {
            return arg;
        }
        if (typeof arg === 'string') {
            return new URI(arg);
        }
        if (arg instanceof EditorWidget) {
            return arg.editor.uri;
        }
        return undefined;
    }

}
