import PQueue from 'p-queue';
import { inject, injectable } from '@theia/core/shared/inversify';
import URI from '@theia/core/lib/common/uri';
import { MonacoEditor } from '@theia/monaco/lib/browser/monaco-editor';
import { MenuModelRegistry, MenuPath } from '@theia/core/lib/common/menu';
import {
  Disposable,
  DisposableCollection,
} from '@theia/core/lib/common/disposable';
import { ArduinoMenus, PlaceholderMenuNode } from '../menu/arduino-menus';
import { LibraryPackage, LibraryService } from '../../common/protocol';
import { MainMenuManager } from '../../common/main-menu-manager';
import { LibraryListWidget } from '../library/library-list-widget';
import { BoardsServiceProvider } from '../boards/boards-service-provider';
import { SketchContribution, Command, CommandRegistry } from './contribution';
import { NotificationCenter } from '../notification-center';
import { nls } from '@theia/core/lib/common';
import * as monaco from '@theia/monaco-editor-core';
import { CurrentSketch } from '../sketches-service-client-impl';

@injectable()
export class IncludeLibrary extends SketchContribution {
  @inject(CommandRegistry)
  private readonly commandRegistry: CommandRegistry;

  @inject(MenuModelRegistry)
  private readonly menuRegistry: MenuModelRegistry;

  @inject(MainMenuManager)
  private readonly mainMenuManager: MainMenuManager;

  @inject(NotificationCenter)
  private readonly notificationCenter: NotificationCenter;

  @inject(BoardsServiceProvider)
  private readonly boardsServiceProvider: BoardsServiceProvider;

  @inject(LibraryService)
  private readonly libraryService: LibraryService;

  private readonly queue = new PQueue({ autoStart: true, concurrency: 1 });
  private readonly toDispose = new DisposableCollection();

  override onStart(): void {
    this.boardsServiceProvider.onBoardsConfigDidChange(() =>
      this.updateMenuActions()
    );
    this.notificationCenter.onLibraryDidInstall(() => this.updateMenuActions());
    this.notificationCenter.onLibraryDidUninstall(() =>
      this.updateMenuActions()
    );
    this.notificationCenter.onDidReinitialize(() => this.updateMenuActions());
  }

  override onReady(): void {
    this.boardsServiceProvider.ready.then(() => this.updateMenuActions());
  }

  override registerMenus(registry: MenuModelRegistry): void {
    // `Include Library` submenu
    const includeLibMenuPath = [
      ...ArduinoMenus.SKETCH__UTILS_GROUP,
      '0_include',
    ];
    registry.registerSubmenu(
      includeLibMenuPath,
      nls.localize('arduino/library/include', 'Include Library'),
      {
        order: '1',
      }
    );
    // `Manage Libraries...` group.
    registry.registerMenuAction([...includeLibMenuPath, '0_manage'], {
      commandId: `${LibraryListWidget.WIDGET_ID}:toggle`,
      label: nls.localize(
        'arduino/library/manageLibraries',
        'Manage Libraries...'
      ),
    });
  }

  override registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(IncludeLibrary.Commands.INCLUDE_LIBRARY, {
      execute: async (arg) => {
        if (LibraryPackage.is(arg)) {
          this.includeLibrary(arg);
        }
      },
    });
  }

  private async updateMenuActions(): Promise<void> {
    return this.queue.add(async () => {
      this.toDispose.dispose();
      this.mainMenuManager.update();
      const libraries: LibraryPackage[] = [];
      const fqbn = this.boardsServiceProvider.boardsConfig.selectedBoard?.fqbn;
      // Show all libraries, when no board is selected.
      // Otherwise, show libraries only for the selected board.
      libraries.push(...(await this.libraryService.list({ fqbn })));

      const includeLibMenuPath = [
        ...ArduinoMenus.SKETCH__UTILS_GROUP,
        '0_include',
      ];
      // `Add .ZIP Library...`
      // TODO: implement it

      // `Arduino libraries`
      const packageMenuPath = [...includeLibMenuPath, '2_arduino'];
      const userMenuPath = [...includeLibMenuPath, '3_contributed'];
      const { user, rest } = LibraryPackage.groupByLocation(libraries);
      if (rest.length) {
        (rest as any).unshift(
          nls.localize('arduino/library/arduinoLibraries', 'Arduino libraries')
        );
      }
      if (user.length) {
        (user as any).unshift(
          nls.localize(
            'arduino/library/contributedLibraries',
            'Contributed libraries'
          )
        );
      }

      for (const library of user) {
        this.toDispose.push(this.registerLibrary(library, userMenuPath));
      }
      for (const library of rest) {
        this.toDispose.push(this.registerLibrary(library, packageMenuPath));
      }

      this.mainMenuManager.update();
    });
  }

  private registerLibrary(
    libraryOrPlaceholder: LibraryPackage | string,
    menuPath: MenuPath
  ): Disposable {
    if (typeof libraryOrPlaceholder === 'string') {
      const placeholder = new PlaceholderMenuNode(
        menuPath,
        libraryOrPlaceholder
      );
      this.menuRegistry.registerMenuNode(menuPath, placeholder);
      return Disposable.create(() =>
        this.menuRegistry.unregisterMenuNode(placeholder.id)
      );
    }
    const commandId = `arduino-include-library--${libraryOrPlaceholder.name}:${libraryOrPlaceholder.author}`;
    const command = { id: commandId };
    const handler = {
      execute: () =>
        this.commandRegistry.executeCommand(
          IncludeLibrary.Commands.INCLUDE_LIBRARY.id,
          libraryOrPlaceholder
        ),
    };
    const menuAction = { commandId, label: libraryOrPlaceholder.name };
    this.menuRegistry.registerMenuAction(menuPath, menuAction);
    return new DisposableCollection(
      this.commandRegistry.registerCommand(command, handler),
      Disposable.create(() =>
        this.menuRegistry.unregisterMenuAction(menuAction)
      )
    );
  }

  private async includeLibrary(library: LibraryPackage): Promise<void> {
    const sketch = await this.sketchServiceClient.currentSketch();
    if (!CurrentSketch.isValid(sketch)) {
      return;
    }
    // If the current editor is one of the additional files from the sketch, we use that.
    // Otherwise, we pick the editor of the main sketch file.
    let codeEditor: monaco.editor.IStandaloneCodeEditor | undefined;
    const editor = this.editorManager.currentEditor?.editor;
    if (editor instanceof MonacoEditor) {
      if (
        sketch.additionalFileUris.some((uri) => uri === editor.uri.toString())
      ) {
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
    const text = includes
      .map((include) => (include ? `#include <${include}>` : eol))
      .join(eol);
    textModel.pushStackElement(); // Start a fresh operation.
    textModel.pushEditOperations(
      cursorState,
      [
        {
          range: new monaco.Range(1, 1, 1, 1),
          text,
          forceMoveMarkers: true,
        },
      ],
      () => cursorState
    );
    textModel.pushStackElement(); // Make it undoable.
  }
}

export namespace IncludeLibrary {
  export namespace Commands {
    export const INCLUDE_LIBRARY: Command = {
      id: 'arduino-include-library',
    };
  }
}
