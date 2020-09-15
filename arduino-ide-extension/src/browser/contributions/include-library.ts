import * as PQueue from 'p-queue';
import { inject, injectable } from 'inversify';
import URI from '@theia/core/lib/common/uri';
import { MonacoEditor } from '@theia/monaco/lib/browser/monaco-editor';
import { EditorManager } from '@theia/editor/lib/browser';
import { MenuModelRegistry, MenuPath } from '@theia/core/lib/common/menu';
import { Disposable, DisposableCollection } from '@theia/core/lib/common/disposable';
import { ArduinoMenus } from '../menu/arduino-menus';
import { LibraryPackage, LibraryLocation, LibraryService } from '../../common/protocol';
import { MainMenuManager } from '../../common/main-menu-manager';
import { LibraryListWidget } from '../library/library-list-widget';
import { BoardsServiceProvider } from '../boards/boards-service-provider';
import { SketchContribution, Command, CommandRegistry } from './contribution';
import { NotificationCenter } from '../notification-center';

@injectable()
export class IncludeLibrary extends SketchContribution {

    @inject(CommandRegistry)
    protected readonly commandRegistry: CommandRegistry;

    @inject(MenuModelRegistry)
    protected readonly menuRegistry: MenuModelRegistry;

    @inject(MainMenuManager)
    protected readonly mainMenuManager: MainMenuManager;

    @inject(EditorManager)
    protected readonly editorManager: EditorManager;

    @inject(NotificationCenter)
    protected readonly notificationCenter: NotificationCenter;

    @inject(BoardsServiceProvider)
    protected readonly boardsServiceClient: BoardsServiceProvider;

    @inject(LibraryService)
    protected readonly libraryService: LibraryService;

    protected readonly queue = new PQueue({ autoStart: true, concurrency: 1 });
    protected readonly toDispose = new DisposableCollection();

    onStart(): void {
        this.updateMenuActions();
        this.boardsServiceClient.onBoardsConfigChanged(() => this.updateMenuActions())
        this.notificationCenter.onLibraryInstalled(() => this.updateMenuActions());
        this.notificationCenter.onLibraryUninstalled(() => this.updateMenuActions());
    }

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(IncludeLibrary.Commands.INCLUDE_LIBRARY, {
            execute: async arg => {
                if (LibraryPackage.is(arg)) {
                    this.includeLibrary(arg);
                }
            }
        });
    }

    protected async updateMenuActions(): Promise<void> {
        return this.queue.add(async () => {
            this.toDispose.dispose();
            this.mainMenuManager.update();
            const libraries: LibraryPackage[] = []
            const fqbn = this.boardsServiceClient.boardsConfig.selectedBoard?.fqbn;
            // Do not show board specific examples, when no board is selected.
            if (fqbn) {
                libraries.push(...await this.libraryService.list({ fqbn }));
            }

            // `Include Library` submenu
            const includeLibMenuPath = [...ArduinoMenus.SKETCH__UTILS_GROUP, '0_include'];
            this.menuRegistry.registerSubmenu(includeLibMenuPath, 'Include Library', { order: '1' });
            // `Manage Libraries...` group.
            this.menuRegistry.registerMenuAction([...includeLibMenuPath, '0_manage'], {
                commandId: `${LibraryListWidget.WIDGET_ID}:toggle`,
                label: 'Manage Libraries...'
            });
            this.toDispose.push(Disposable.create(() => this.menuRegistry.unregisterMenuAction({ commandId: `${LibraryListWidget.WIDGET_ID}:toggle` })));

            // `Add .ZIP Library...`
            // TODO: implement it

            // `Arduino libraries`
            const packageMenuPath = [...includeLibMenuPath, '2_arduino'];
            const userMenuPath = [...includeLibMenuPath, '3_contributed'];
            for (const library of libraries) {
                this.toDispose.push(this.registerLibrary(library, library.location === LibraryLocation.USER ? userMenuPath : packageMenuPath));
            }

            this.mainMenuManager.update();
        });
    }

    protected registerLibrary(library: LibraryPackage, menuPath: MenuPath): Disposable {
        const commandId = `arduino-include-library--${library.name}:${library.author}`;
        const command = { id: commandId };
        const handler = { execute: () => this.commandRegistry.executeCommand(IncludeLibrary.Commands.INCLUDE_LIBRARY.id, library) };
        const menuAction = { commandId, label: library.name };
        this.menuRegistry.registerMenuAction(menuPath, menuAction);
        return new DisposableCollection(
            this.commandRegistry.registerCommand(command, handler),
            Disposable.create(() => this.menuRegistry.unregisterMenuAction(menuAction)),
        );
    }

    protected async includeLibrary(library: LibraryPackage): Promise<void> {
        const sketch = await this.sketchServiceClient.currentSketch();
        if (!sketch) {
            return;
        }
        // If the current editor is one of the additional files from the sketch, we use that.
        // Otherwise, we pick the editor of the main sketch file.
        let codeEditor: monaco.editor.IStandaloneCodeEditor | undefined;
        const editor = this.editorManager.currentEditor?.editor;
        if (editor instanceof MonacoEditor) {
            if (sketch.additionalFileUris.some(uri => uri === editor.uri.toString())) {
                codeEditor = editor.getControl();
            }
        }

        if (!codeEditor) {
            const widget = await this.editorManager.open(new URI(sketch.mainFileUri));
            if (widget.editor instanceof MonacoEditor) {
                codeEditor = widget.editor.getControl();
            }
        }

        if (!codeEditor) {
            return;
        }

        const textModel = codeEditor.getModel();
        if (!textModel) {
            return;
        }
        const cursorState = codeEditor.getSelections() || [];
        const eol = textModel.getEOL();
        const includes = library.includes.slice();
        includes.push(''); // For the trailing new line.
        const text = includes.map(include => include ? `#include <${include}>` : eol).join(eol);
        textModel.pushStackElement(); // Start a fresh operation.
        textModel.pushEditOperations(cursorState, [{
            range: new monaco.Range(1, 1, 1, 1),
            text,
            forceMoveMarkers: true
        }], () => cursorState);
        textModel.pushStackElement(); // Make it undoable.
    }

}

export namespace IncludeLibrary {
    export namespace Commands {
        export const INCLUDE_LIBRARY: Command = {
            id: 'arduino-include-library'
        };
    }
}
