import * as React from 'react';
import { injectable, inject, postConstruct } from 'inversify';
import URI from '@theia/core/lib/common/uri';
import { EditorWidget } from '@theia/editor/lib/browser/editor-widget';
import { MessageService } from '@theia/core/lib/common/message-service';
import { CommandContribution, CommandRegistry } from '@theia/core/lib/common/command';
import { DefaultFrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { BoardsService } from '../common/protocol/boards-service';
import { ArduinoCommands } from './arduino-commands';
import { ConnectedBoards } from './components/connected-boards';
import { CoreService } from '../common/protocol/core-service';
import { WorkspaceServiceExt } from './workspace-service-ext';
import { ToolOutputServiceClient } from '../common/protocol/tool-output-service';
import { QuickPickService } from '@theia/core/lib/common/quick-pick-service';
import { BoardsListWidgetFrontendContribution } from './boards/boards-widget-frontend-contribution';
import { BoardsNotificationService } from './boards-notification-service';
import { WorkspaceRootUriAwareCommandHandler, WorkspaceCommands } from '@theia/workspace/lib/browser/workspace-commands';
import { SelectionService } from '@theia/core';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import { SketchFactory } from './sketch-factory';
import { ArduinoToolbar } from './toolbar/arduino-toolbar';
import { EditorManager } from '@theia/editor/lib/browser';
import { open, ContextMenuRenderer, OpenerService, Widget } from '@theia/core/lib/browser';
import { OpenFileDialogProps, FileDialogService } from '@theia/filesystem/lib/browser/file-dialog';
import { FileSystem } from '@theia/filesystem/lib/common';
import { ArduinoOpenSketchContextMenu, SketchMenuEntry } from './arduino-file-menu';

@injectable()
export class ArduinoFrontendContribution extends DefaultFrontendApplicationContribution implements TabBarToolbarContribution, CommandContribution {

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

    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

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
            group: 'arduino',
            text: '$(check)'
        });
        registry.registerItem({
            id: ArduinoCommands.UPLOAD.id,
            command: ArduinoCommands.UPLOAD.id,
            tooltip: 'Upload',
            group: 'arduino',
            text: '$(arrow-right)'
        });
        registry.registerItem({
            id: ArduinoCommands.SHOW_OPEN_CONTEXT_MENU.id,
            command: ArduinoCommands.SHOW_OPEN_CONTEXT_MENU.id,
            tooltip: 'Open',
            group: 'arduino',
            text: '$(arrow-up)'
        });
        registry.registerItem({
            id: ConnectedBoards.TOOLBAR_ID,
            render: () => <ConnectedBoards
                boardsService={this.boardService}
                boardsNotificationService={this.boardsNotificationService}
                quickPickService={this.quickPickService}
                onNoBoardsInstalled={this.onNoBoardsInstalled.bind(this)}
                onUnknownBoard={this.onUnknownBoard.bind(this)} />,
            isVisible: widget => this.isArduinoToolbar(widget)
        })
    }

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(ArduinoCommands.VERIFY, {
            isVisible: widget => this.isArduinoToolbar(widget),
            isEnabled: widget => this.isArduinoToolbar(widget),
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
            isEnabled: widget => this.isArduinoToolbar(widget),
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
            execute: async (widget: Widget, event: React.MouseEvent<HTMLElement>) => {
                const el = (event.target as HTMLElement).parentElement;
                if(el) {
                    this.contextMenuRenderer.render(ArduinoOpenSketchContextMenu.PATH, {
                        x: el.getBoundingClientRect().left,
                        y: el.getBoundingClientRect().top + el.offsetHeight
                    });
                }
            }
        });
        registry.registerCommand(ArduinoCommands.OPEN_FILE_NAVIGATOR, {
            isEnabled: () => true,
            execute: () => this.doOpenFile()
        })
        registry.registerCommand(ArduinoCommands.OPEN_SKETCH, {
            isEnabled: () => true,
            execute: (sketch: SketchMenuEntry) => {
                console.log("OPEN SOME SKETCH", sketch);
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
        })
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
                await open(this.openerService, destinationFileUri);
                return destinationFileUri;
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

    private async onNoBoardsInstalled() {
        const action = await this.messageService.info("You have no boards installed. Use the boards mangager to install one.", "Open Boards Manager");
        if (!action) {
            return;
        }

        this.boardsListWidgetFrontendContribution.openView({ reveal: true });
    }

    private async onUnknownBoard() {
        const action = await this.messageService.warn("There's a board connected for which you need to install software." +
            " If this were not a PoC we would offer you the right package now.", "Open Boards Manager");
        if (!action) {
            return;
        }

        this.boardsListWidgetFrontendContribution.openView({ reveal: true });
    }

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
