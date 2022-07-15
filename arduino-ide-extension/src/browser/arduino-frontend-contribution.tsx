import {
  inject,
  injectable,
  postConstruct,
} from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import * as remote from '@theia/core/electron-shared/@electron/remote';
import {
  BoardsService,
  SketchesService,
  ExecutableService,
  Sketch,
  LibraryService,
  ArduinoDaemon,
} from '../common/protocol';
import { Mutex } from 'async-mutex';
import {
  MAIN_MENU_BAR,
  MenuContribution,
  MenuModelRegistry,
  ILogger,
  DisposableCollection,
} from '@theia/core';
import {
  Dialog,
  FrontendApplication,
  FrontendApplicationContribution,
  LocalStorageService,
  OnWillStopAction,
  SaveableWidget,
  StatusBar,
  StatusBarAlignment,
} from '@theia/core/lib/browser';
import { nls } from '@theia/core/lib/common';
import { ColorContribution } from '@theia/core/lib/browser/color-application-contribution';
import { ColorRegistry } from '@theia/core/lib/browser/color-registry';
import { CommonMenus } from '@theia/core/lib/browser/common-frontend-contribution';
import {
  TabBarToolbarContribution,
  TabBarToolbarRegistry,
} from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import {
  CommandContribution,
  CommandRegistry,
} from '@theia/core/lib/common/command';
import { MessageService } from '@theia/core/lib/common/message-service';
import URI from '@theia/core/lib/common/uri';
import {
  EditorCommands,
  EditorMainMenu,
  EditorManager,
  EditorOpenerOptions,
} from '@theia/editor/lib/browser';
import { MonacoMenus } from '@theia/monaco/lib/browser/monaco-menu';
import { FileNavigatorCommands } from '@theia/navigator/lib/browser/navigator-contribution';
import { TerminalMenus } from '@theia/terminal/lib/browser/terminal-frontend-contribution';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FileChangeType } from '@theia/filesystem/lib/browser';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import { ArduinoCommands } from './arduino-commands';
import { BoardsConfig } from './boards/boards-config';
import { BoardsConfigDialog } from './boards/boards-config-dialog';
import { BoardsServiceProvider } from './boards/boards-service-provider';
import { BoardsToolBarItem } from './boards/boards-toolbar-item';
import { EditorMode } from './editor-mode';
import { ArduinoMenus } from './menu/arduino-menus';
import { MonitorViewContribution } from './serial/monitor/monitor-view-contribution';
import { ArduinoToolbar } from './toolbar/arduino-toolbar';
import { ArduinoPreferences } from './arduino-preferences';
import {
  CurrentSketch,
  SketchesServiceClientImpl,
} from '../common/protocol/sketches-service-client-impl';
import { SaveAsSketch } from './contributions/save-as-sketch';
import { IDEUpdaterDialog } from './dialogs/ide-updater/ide-updater-dialog';
import { IDEUpdater } from '../common/protocol/ide-updater';
import { FileSystemFrontendContribution } from '@theia/filesystem/lib/browser/filesystem-frontend-contribution';
import { HostedPluginEvents } from './hosted-plugin-events';

const INIT_LIBS_AND_PACKAGES = 'initializedLibsAndPackages';
export const SKIP_IDE_VERSION = 'skipIDEVersion';

@injectable()
export class ArduinoFrontendContribution
  implements
    FrontendApplicationContribution,
    TabBarToolbarContribution,
    CommandContribution,
    MenuContribution,
    ColorContribution
{
  @inject(ILogger)
  private readonly logger: ILogger;

  @inject(MessageService)
  private readonly messageService: MessageService;

  @inject(BoardsService)
  private readonly boardsService: BoardsService;

  @inject(LibraryService)
  private readonly libraryService: LibraryService;

  @inject(BoardsServiceProvider)
  private readonly boardsServiceClientImpl: BoardsServiceProvider;

  @inject(EditorManager)
  private readonly editorManager: EditorManager;

  @inject(FileService)
  private readonly fileService: FileService;

  @inject(SketchesService)
  private readonly sketchService: SketchesService;

  @inject(BoardsConfigDialog)
  private readonly boardsConfigDialog: BoardsConfigDialog;

  @inject(CommandRegistry)
  private readonly commandRegistry: CommandRegistry;

  @inject(StatusBar)
  private readonly statusBar: StatusBar;

  @inject(EditorMode)
  private readonly editorMode: EditorMode;

  @inject(HostedPluginEvents)
  private readonly hostedPluginEvents: HostedPluginEvents;

  @inject(ExecutableService)
  private readonly executableService: ExecutableService;

  @inject(ArduinoPreferences)
  private readonly arduinoPreferences: ArduinoPreferences;

  @inject(SketchesServiceClientImpl)
  private readonly sketchServiceClient: SketchesServiceClientImpl;

  @inject(FrontendApplicationStateService)
  private readonly appStateService: FrontendApplicationStateService;

  @inject(LocalStorageService)
  private readonly localStorageService: LocalStorageService;

  @inject(FileSystemFrontendContribution)
  private readonly fileSystemFrontendContribution: FileSystemFrontendContribution;

  @inject(IDEUpdater)
  private readonly updater: IDEUpdater;

  @inject(IDEUpdaterDialog)
  private readonly updaterDialog: IDEUpdaterDialog;

  @inject(ArduinoDaemon)
  private readonly daemon: ArduinoDaemon;

  protected invalidConfigPopup:
    | Promise<void | 'No' | 'Yes' | undefined>
    | undefined;
  protected toDisposeOnStop = new DisposableCollection();

  @postConstruct()
  protected async init(): Promise<void> {
    const isFirstStartup = !(await this.localStorageService.getData(
      INIT_LIBS_AND_PACKAGES
    ));
    if (isFirstStartup) {
      await this.localStorageService.setData(INIT_LIBS_AND_PACKAGES, true);
      const avrPackage = await this.boardsService.getBoardPackage({
        id: 'arduino:avr',
      });
      const builtInLibrary = (
        await this.libraryService.search({
          query: 'Arduino_BuiltIn',
        })
      )[0];

      !!avrPackage && (await this.boardsService.install({ item: avrPackage }));
      !!builtInLibrary &&
        (await this.libraryService.install({
          item: builtInLibrary,
          installDependencies: true,
        }));
    }
    if (!window.navigator.onLine) {
      // tslint:disable-next-line:max-line-length
      this.messageService.warn(
        nls.localize(
          'arduino/common/offlineIndicator',
          'You appear to be offline. Without an Internet connection, the Arduino CLI might not be able to download the required resources and could cause malfunction. Please connect to the Internet and restart the application.'
        )
      );
    }
    const updateStatusBar = ({
      selectedBoard,
      selectedPort,
    }: BoardsConfig.Config) => {
      this.statusBar.setElement('arduino-selected-board', {
        alignment: StatusBarAlignment.RIGHT,
        text: selectedBoard
          ? `$(microchip) ${selectedBoard.name}`
          : `$(close) ${nls.localize(
              'arduino/common/noBoardSelected',
              'No board selected'
            )}`,
        className: 'arduino-selected-board',
      });
      if (selectedBoard) {
        this.statusBar.setElement('arduino-selected-port', {
          alignment: StatusBarAlignment.RIGHT,
          text: selectedPort
            ? nls.localize(
                'arduino/common/selectedOn',
                'on {0}',
                selectedPort.address
              )
            : nls.localize('arduino/common/notConnected', '[not connected]'),
          className: 'arduino-selected-port',
        });
      }
    };
    this.boardsServiceClientImpl.onBoardsConfigChanged(updateStatusBar);
    updateStatusBar(this.boardsServiceClientImpl.boardsConfig);
    this.appStateService.reachedState('ready').then(async () => {
      const sketch = await this.sketchServiceClient.currentSketch();
      if (
        CurrentSketch.isValid(sketch) &&
        !(await this.sketchService.isTemp(sketch))
      ) {
        this.toDisposeOnStop.push(this.fileService.watch(new URI(sketch.uri)));
        this.toDisposeOnStop.push(
          this.fileService.onDidFilesChange(async (event) => {
            for (const { type, resource } of event.changes) {
              if (
                type === FileChangeType.ADDED &&
                resource.parent.toString() === sketch.uri
              ) {
                const reloadedSketch = await this.sketchService.loadSketch(
                  sketch.uri
                );
                if (Sketch.isInSketch(resource, reloadedSketch)) {
                  this.ensureOpened(resource.toString(), true, {
                    mode: 'open',
                  });
                }
              }
            }
          })
        );
      }
    });
  }

  async onStart(app: FrontendApplication): Promise<void> {
    this.updater
      .init(
        this.arduinoPreferences.get('arduino.ide.updateChannel'),
        this.arduinoPreferences.get('arduino.ide.updateBaseUrl')
      )
      .then(() => this.updater.checkForUpdates(true))
      .then(async (updateInfo) => {
        if (!updateInfo) return;
        const versionToSkip = await this.localStorageService.getData<string>(
          SKIP_IDE_VERSION
        );
        if (versionToSkip === updateInfo.version) return;
        this.updaterDialog.open(updateInfo);
      })
      .catch((e) => {
        this.messageService.error(
          nls.localize(
            'arduino/ide-updater/errorCheckingForUpdates',
            'Error while checking for Arduino IDE updates.\n{0}',
            e.message
          )
        );
      });

    const start = async ({ selectedBoard }: BoardsConfig.Config) => {
      if (selectedBoard) {
        const { name, fqbn } = selectedBoard;
        if (fqbn) {
          this.startLanguageServer(fqbn, name);
        }
      }
    };
    this.boardsServiceClientImpl.onBoardsConfigChanged(start);
    this.hostedPluginEvents.onPluginsDidStart(() =>
      start(this.boardsServiceClientImpl.boardsConfig)
    );
    this.hostedPluginEvents.onPluginsWillUnload(
      () => (this.languageServerFqbn = undefined)
    );
    this.arduinoPreferences.onPreferenceChanged((event) => {
      if (event.newValue !== event.oldValue) {
        switch (event.preferenceName) {
          case 'arduino.language.log':
            start(this.boardsServiceClientImpl.boardsConfig);
            break;
          case 'arduino.window.zoomLevel':
            if (typeof event.newValue === 'number') {
              const webContents = remote.getCurrentWebContents();
              webContents.setZoomLevel(event.newValue || 0);
            }
            break;
          case 'arduino.ide.updateChannel':
          case 'arduino.ide.updateBaseUrl':
            this.updater.init(
              this.arduinoPreferences.get('arduino.ide.updateChannel'),
              this.arduinoPreferences.get('arduino.ide.updateBaseUrl')
            );
            break;
        }
      }
    });
    this.arduinoPreferences.ready.then(() => {
      const webContents = remote.getCurrentWebContents();
      const zoomLevel = this.arduinoPreferences.get('arduino.window.zoomLevel');
      webContents.setZoomLevel(zoomLevel);
    });

    app.shell.leftPanelHandler.removeBottomMenu('settings-menu');

    this.fileSystemFrontendContribution.onDidChangeEditorFile(
      ({ type, editor }) => {
        if (type === FileChangeType.DELETED) {
          const editorWidget = editor;
          if (SaveableWidget.is(editorWidget)) {
            editorWidget.closeWithoutSaving();
          } else {
            editorWidget.close();
          }
        }
      }
    );
  }

  onStop(): void {
    this.toDisposeOnStop.dispose();
  }

  protected languageServerFqbn?: string;
  protected languageServerStartMutex = new Mutex();
  protected async startLanguageServer(
    fqbn: string,
    name: string | undefined
  ): Promise<void> {
    const port = await this.daemon.tryGetPort();
    if (!port) {
      return;
    }
    const release = await this.languageServerStartMutex.acquire();
    try {
      await this.hostedPluginEvents.didStart;
      const details = await this.boardsService.getBoardDetails({ fqbn });
      if (!details) {
        // Core is not installed for the selected board.
        console.info(
          `Could not start language server for ${fqbn}. The core is not installed for the board.`
        );
        if (this.languageServerFqbn) {
          try {
            await this.commandRegistry.executeCommand(
              'arduino.languageserver.stop'
            );
            console.info(
              `Stopped language server process for ${this.languageServerFqbn}.`
            );
            this.languageServerFqbn = undefined;
          } catch (e) {
            console.error(
              `Failed to start language server process for ${this.languageServerFqbn}`,
              e
            );
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
        if (CurrentSketch.isValid(currentSketch)) {
          currentSketchPath = await this.fileService.fsPath(
            new URI(currentSketch.uri)
          );
        }
      }
      const { clangdUri, lsUri } = await this.executableService.list();
      const [clangdPath, lsPath] = await Promise.all([
        this.fileService.fsPath(new URI(clangdUri)),
        this.fileService.fsPath(new URI(lsUri)),
      ]);

      this.languageServerFqbn = await Promise.race([
        new Promise<undefined>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Timeout after ${20_000} ms.`)),
            20_000
          )
        ),
        this.commandRegistry.executeCommand<string>(
          'arduino.languageserver.start',
          {
            lsPath,
            cliDaemonAddr: `localhost:${port}`,
            clangdPath,
            log: currentSketchPath ? currentSketchPath : log,
            cliDaemonInstance: '1',
            board: {
              fqbn,
              name: name ? `"${name}"` : undefined,
            },
          }
        ),
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
      render: () => (
        <BoardsToolBarItem
          key="boardsToolbarItem"
          commands={this.commandRegistry}
          boardsServiceClient={this.boardsServiceClientImpl}
        />
      ),
      isVisible: (widget) =>
        ArduinoToolbar.is(widget) && widget.side === 'left',
      priority: 7,
    });
    registry.registerItem({
      id: 'toggle-serial-monitor',
      command: MonitorViewContribution.TOGGLE_SERIAL_MONITOR_TOOLBAR,
      tooltip: nls.localize('arduino/common/serialMonitor', 'Serial Monitor'),
    });
  }

  registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(ArduinoCommands.TOGGLE_COMPILE_FOR_DEBUG, {
      execute: () => this.editorMode.toggleCompileForDebug(),
      isToggled: () => this.editorMode.compileForDebug,
    });
    registry.registerCommand(ArduinoCommands.OPEN_SKETCH_FILES, {
      execute: async (uri: URI) => {
        this.openSketchFiles(uri);
      },
    });
    registry.registerCommand(ArduinoCommands.OPEN_BOARDS_DIALOG, {
      execute: async (query?: string | undefined) => {
        const boardsConfig = await this.boardsConfigDialog.open(query);
        if (boardsConfig) {
          this.boardsServiceClientImpl.boardsConfig = boardsConfig;
        }
      },
    });

    for (const command of [
      EditorCommands.SPLIT_EDITOR_DOWN,
      EditorCommands.SPLIT_EDITOR_LEFT,
      EditorCommands.SPLIT_EDITOR_RIGHT,
      EditorCommands.SPLIT_EDITOR_UP,
      EditorCommands.SPLIT_EDITOR_VERTICAL,
      EditorCommands.SPLIT_EDITOR_HORIZONTAL,
      FileNavigatorCommands.REVEAL_IN_NAVIGATOR,
    ]) {
      registry.unregisterCommand(command);
    }
  }

  registerMenus(registry: MenuModelRegistry): void {
    const menuId = (menuPath: string[]): string => {
      const index = menuPath.length - 1;
      const menuId = menuPath[index];
      return menuId;
    };
    registry.getMenu(MAIN_MENU_BAR).removeNode(menuId(MonacoMenus.SELECTION));
    registry.getMenu(MAIN_MENU_BAR).removeNode(menuId(EditorMainMenu.GO));
    registry.getMenu(MAIN_MENU_BAR).removeNode(menuId(TerminalMenus.TERMINAL));
    registry.getMenu(MAIN_MENU_BAR).removeNode(menuId(CommonMenus.VIEW));

    registry.registerSubmenu(
      ArduinoMenus.SKETCH,
      nls.localize('arduino/menu/sketch', 'Sketch')
    );
    registry.registerSubmenu(
      ArduinoMenus.TOOLS,
      nls.localize('arduino/menu/tools', 'Tools')
    );
    registry.registerMenuAction(ArduinoMenus.SKETCH__MAIN_GROUP, {
      commandId: ArduinoCommands.TOGGLE_COMPILE_FOR_DEBUG.id,
      label: nls.localize(
        'arduino/debug/optimizeForDebugging',
        'Optimize for Debugging'
      ),
      order: '5',
    });
  }

  protected async openSketchFiles(uri: URI): Promise<void> {
    try {
      const sketch = await this.sketchService.loadSketch(uri.toString());
      const { mainFileUri, rootFolderFileUris } = sketch;
      for (const uri of [mainFileUri, ...rootFolderFileUris]) {
        await this.ensureOpened(uri);
      }
      if (mainFileUri.endsWith('.pde')) {
        const message = nls.localize(
          'arduino/common/oldFormat',
          "The '{0}' still uses the old `.pde` format. Do you want to switch to the new `.ino` extension?",
          sketch.name
        );
        const yes = nls.localize('vscode/extensionsUtils/yes', 'Yes');
        this.messageService
          .info(message, nls.localize('arduino/common/later', 'Later'), yes)
          .then(async (answer) => {
            if (answer === yes) {
              this.commandRegistry.executeCommand(
                SaveAsSketch.Commands.SAVE_AS_SKETCH.id,
                {
                  execOnlyIfTemp: false,
                  openAfterMove: true,
                  wipeOriginal: false,
                }
              );
            }
          });
      }
    } catch (e) {
      console.error(e);
      const message = e instanceof Error ? e.message : JSON.stringify(e);
      this.messageService.error(message);
    }
  }

  protected async ensureOpened(
    uri: string,
    forceOpen = false,
    options?: EditorOpenerOptions | undefined
  ): Promise<unknown> {
    const widget = this.editorManager.all.find(
      (widget) => widget.editor.uri.toString() === uri
    );
    if (!widget || forceOpen) {
      return this.editorManager.open(
        new URI(uri),
        options ?? {
          mode: 'reveal',
          preview: false,
          counter: 0,
        }
      );
    }
  }

  registerColors(colors: ColorRegistry): void {
    colors.register(
      {
        id: 'arduino.branding.primary',
        defaults: {
          dark: 'statusBar.background',
          light: 'statusBar.background',
        },
        description:
          'The primary branding color, such as dialog titles, library, and board manager list labels.',
      },
      {
        id: 'arduino.branding.secondary',
        defaults: {
          dark: 'statusBar.background',
          light: 'statusBar.background',
        },
        description:
          'Secondary branding color for list selections, dropdowns, and widget borders.',
      },
      {
        id: 'arduino.foreground',
        defaults: {
          dark: 'editorWidget.background',
          light: 'editorWidget.background',
          hc: 'editorWidget.background',
        },
        description:
          'Color of the Arduino IDE foreground which is used for dialogs, such as the Select Board dialog.',
      },
      {
        id: 'arduino.toolbar.button.background',
        defaults: {
          dark: 'button.background',
          light: 'button.background',
          hc: 'activityBar.inactiveForeground',
        },
        description:
          'Background color of the toolbar items. Such as Upload, Verify, etc.',
      },
      {
        id: 'arduino.toolbar.button.hoverBackground',
        defaults: {
          dark: 'button.hoverBackground',
          light: 'button.foreground',
          hc: 'textLink.foreground',
        },
        description:
          'Background color of the toolbar items when hovering over them. Such as Upload, Verify, etc.',
      },
      {
        id: 'arduino.toolbar.toggleBackground',
        defaults: {
          dark: 'editor.selectionBackground',
          light: 'editor.selectionBackground',
          hc: 'textPreformat.foreground',
        },
        description:
          'Toggle color of the toolbar items when they are currently toggled (the command is in progress)',
      },
      {
        id: 'arduino.output.foreground',
        defaults: {
          dark: 'editor.foreground',
          light: 'editor.foreground',
          hc: 'editor.foreground',
        },
        description: 'Color of the text in the Output view.',
      },
      {
        id: 'arduino.output.background',
        defaults: {
          dark: 'editor.background',
          light: 'editor.background',
          hc: 'editor.background',
        },
        description: 'Background color of the Output view.',
      },
      {
        id: 'arduino.toolbar.dropdown.border',
        defaults: {
          dark: 'dropdown.border',
          light: 'dropdown.border',
          hc: 'dropdown.border',
        },
        description: 'Border color of the Board Selector.',
      },

      {
        id: 'arduino.toolbar.dropdown.borderActive',
        defaults: {
          dark: 'focusBorder',
          light: 'focusBorder',
          hc: 'focusBorder',
        },
        description: "Border color of the Board Selector when it's active",
      },

      {
        id: 'arduino.toolbar.dropdown.background',
        defaults: {
          dark: 'tab.unfocusedActiveBackground',
          light: 'tab.unfocusedActiveBackground',
          hc: 'tab.unfocusedActiveBackground',
        },
        description: 'Background color of the Board Selector.',
      },

      {
        id: 'arduino.toolbar.dropdown.label',
        defaults: {
          dark: 'foreground',
          light: 'foreground',
          hc: 'foreground',
        },
        description: 'Font color of the Board Selector.',
      },
      {
        id: 'arduino.toolbar.dropdown.iconSelected',
        defaults: {
          dark: 'statusBar.background',
          light: 'statusBar.background',
          hc: 'statusBar.background',
        },
        description:
          'Color of the selected protocol icon in the Board Selector.',
      },
      {
        id: 'arduino.toolbar.dropdown.option.backgroundHover',
        defaults: {
          dark: 'editor.background',
          light: 'editor.background',
          hc: 'editor.background',
        },
        description: 'Background color on hover of the Board Selector options.',
      },
      {
        id: 'arduino.toolbar.dropdown.option.backgroundSelected',
        defaults: {
          dark: 'editor.background',
          light: 'editor.background',
          hc: 'editor.background',
        },
        description:
          'Background color of the selected board in the Board Selector.',
      }
    );
  }

  onWillStop(): OnWillStopAction {
    return {
      reason: 'temp-sketch',
      action: () => {
        return this.showTempSketchDialog();
      },
    };
  }

  private async showTempSketchDialog(): Promise<boolean> {
    const sketch = await this.sketchServiceClient.currentSketch();
    if (!CurrentSketch.isValid(sketch)) {
      return true;
    }
    const isTemp = await this.sketchService.isTemp(sketch);
    if (!isTemp) {
      return true;
    }
    const messageBoxResult = await remote.dialog.showMessageBox(
      remote.getCurrentWindow(),
      {
        message: nls.localize(
          'arduino/sketch/saveTempSketch',
          'Save your sketch to open it again later.'
        ),
        title: nls.localize(
          'theia/core/quitTitle',
          'Are you sure you want to quit?'
        ),
        type: 'question',
        buttons: [
          Dialog.CANCEL,
          nls.localizeByDefault('Save As...'),
          nls.localizeByDefault("Don't Save"),
        ],
      }
    );
    const result = messageBoxResult.response;
    if (result === 2) {
      return true;
    } else if (result === 1) {
      return !!(await this.commandRegistry.executeCommand(
        SaveAsSketch.Commands.SAVE_AS_SKETCH.id,
        {
          execOnlyIfTemp: false,
          openAfterMove: false,
          wipeOriginal: true,
        }
      ));
    }
    return false;
  }
}
