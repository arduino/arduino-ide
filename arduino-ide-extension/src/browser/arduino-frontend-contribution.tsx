import * as remote from '@theia/core/electron-shared/@electron/remote';
import {
  inject,
  injectable,
  postConstruct,
} from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { SketchesService } from '../common/protocol';
import {
  MAIN_MENU_BAR,
  MenuContribution,
  MenuModelRegistry,
} from '@theia/core';
import {
  Dialog,
  FrontendApplication,
  FrontendApplicationContribution,
  OnWillStopAction,
} from '@theia/core/lib/browser';
import { ColorContribution } from '@theia/core/lib/browser/color-application-contribution';
import { ColorRegistry } from '@theia/core/lib/browser/color-registry';
import { CommonMenus } from '@theia/core/lib/browser/common-frontend-contribution';
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
import { EditorCommands, EditorMainMenu } from '@theia/editor/lib/browser';
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
import { SaveAsSketch } from './contributions/save-as-sketch';
import { ArduinoMenus } from './menu/arduino-menus';
import { MonitorViewContribution } from './serial/monitor/monitor-view-contribution';
import { ArduinoToolbar } from './toolbar/arduino-toolbar';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import { SerialPlotterContribution } from './serial/plotter/plotter-frontend-contribution';

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
    this.appStateService.reachedState('ready').then(() =>
      this.arduinoPreferences.ready.then(() => {
        const webContents = remote.getCurrentWebContents();
        const zoomLevel = this.arduinoPreferences.get(
          'arduino.window.zoomLevel'
        );
        webContents.setZoomLevel(zoomLevel);
      })
    );
    // Removes the _Settings_ (cog) icon from the left sidebar
    app.shell.leftPanelHandler.removeBottomMenu('settings-menu');
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
      id: 'toggle-serial-plotter',
      command: SerialPlotterContribution.Commands.OPEN_TOOLBAR.id,
      tooltip: nls.localize(
        'arduino/serial/openSerialPlotter',
        'Serial Plotter'
      ),
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
        id: 'arduino.toolbar.button.secondary.label',
        defaults: {
          dark: 'secondaryButton.foreground',
          light: 'button.foreground',
          hc: 'activityBar.inactiveForeground',
        },
        description:
          'Foreground color of the toolbar items. Such as Serial Monitor and Serial Plotter',
      },
      {
        id: 'arduino.toolbar.button.secondary.hoverBackground',
        defaults: {
          dark: 'secondaryButton.hoverBackground',
          light: 'button.hoverBackground',
          hc: 'textLink.foreground',
        },
        description:
          'Background color of the toolbar items when hovering over them, such as "Serial Monitor" and "Serial Plotter"',
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
