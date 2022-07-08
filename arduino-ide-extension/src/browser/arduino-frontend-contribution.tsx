import * as remote from '@theia/core/electron-shared/@electron/remote';
import {
  inject,
  injectable,
  postConstruct,
} from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { SketchesService, Sketch } from '../common/protocol';

import {
  DisposableCollection,
  MAIN_MENU_BAR,
  MenuContribution,
  MenuModelRegistry,
} from '@theia/core';
import {
  Dialog,
  FrontendApplication,
  FrontendApplicationContribution,
  LocalStorageService,
  OnWillStopAction,
  SaveableWidget,
} from '@theia/core/lib/browser';
import { ColorContribution } from '@theia/core/lib/browser/color-application-contribution';
import { ColorRegistry } from '@theia/core/lib/browser/color-registry';
import { CommonMenus } from '@theia/core/lib/browser/common-frontend-contribution';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import {
  TabBarToolbarContribution,
  TabBarToolbarRegistry,
} from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { nls } from '@theia/core/lib/common';
import {
  CommandContribution,
  CommandRegistry,
} from '@theia/core/lib/common/command';
import { MessageService } from '@theia/core/lib/common/message-service';
import URI from '@theia/core/lib/common/uri';
import { EditorCommands, EditorMainMenu } from '@theia/editor/lib/browser';
import { FileChangeType } from '@theia/filesystem/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FileSystemFrontendContribution } from '@theia/filesystem/lib/browser/filesystem-frontend-contribution';
import { MonacoMenus } from '@theia/monaco/lib/browser/monaco-menu';
import { FileNavigatorCommands } from '@theia/navigator/lib/browser/navigator-contribution';
import { TerminalMenus } from '@theia/terminal/lib/browser/terminal-frontend-contribution';
import {
  CurrentSketch,
  SketchesServiceClientImpl,
} from '../common/protocol/sketches-service-client-impl';
import { ArduinoPreferences } from './arduino-preferences';
import { BoardsServiceProvider } from './boards/boards-service-provider';
import { BoardsToolBarItem } from './boards/boards-toolbar-item';
import { OpenSketchFiles } from './contributions/open-sketch-files';
import { SaveAsSketch } from './contributions/save-as-sketch';
import { ArduinoMenus } from './menu/arduino-menus';
import { MonitorViewContribution } from './serial/monitor/monitor-view-contribution';
import { ArduinoToolbar } from './toolbar/arduino-toolbar';

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
  @inject(MessageService)
  private readonly messageService: MessageService;

  @inject(BoardsServiceProvider)
  private readonly boardsServiceProvider: BoardsServiceProvider;

  @inject(FileService)
  private readonly fileService: FileService;

  @inject(SketchesService)
  private readonly sketchService: SketchesService;

  @inject(CommandRegistry)
  private readonly commandRegistry: CommandRegistry;

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

  protected toDisposeOnStop = new DisposableCollection();

  @postConstruct()
  protected async init(): Promise<void> {
    if (!window.navigator.onLine) {
      // tslint:disable-next-line:max-line-length
      this.messageService.warn(
        nls.localize(
          'arduino/common/offlineIndicator',
          'You appear to be offline. Without an Internet connection, the Arduino CLI might not be able to download the required resources and could cause malfunction. Please connect to the Internet and restart the application.'
        )
      );
    }
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
                  this.commandRegistry.executeCommand(
                    OpenSketchFiles.Commands.ENSURE_OPENED.id,
                    resource.toString(),
                    true,
                    {
                      mode: 'open',
                    }
                  );
                }
              }
            }
          })
        );
      }
    });
  }

  async onStart(app: FrontendApplication): Promise<void> {
    this.arduinoPreferences.onPreferenceChanged((event) => {
      if (event.newValue !== event.oldValue) {
        switch (event.preferenceName) {
          case 'arduino.window.zoomLevel':
            if (typeof event.newValue === 'number') {
              const webContents = remote.getCurrentWebContents();
              webContents.setZoomLevel(event.newValue || 0);
            }
            break;
        }
      }
    });

    // TODO: Verify this! If true IDE2 can start ~100ms faster.
    // If the preferences is resolved, then the `ready` call will happen in the same tick
    // and will do a `send_sync` request to the electron main to get the current window.
    // Consider moving after app `ready`.
    this.arduinoPreferences.ready.then(() => {
      const webContents = remote.getCurrentWebContents();
      const zoomLevel = this.arduinoPreferences.get('arduino.window.zoomLevel');
      webContents.setZoomLevel(zoomLevel);
    });

    // Removes the _Settings_ (cog) icon from the left sidebar
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

  registerToolbarItems(registry: TabBarToolbarRegistry): void {
    registry.registerItem({
      id: BoardsToolBarItem.TOOLBAR_ID,
      render: () => (
        <BoardsToolBarItem
          key="boardsToolbarItem"
          commands={this.commandRegistry}
          boardsServiceProvider={this.boardsServiceProvider}
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

  // TODO: should be handled by `Close` contribution. https://github.com/arduino/arduino-ide/issues/1016
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
