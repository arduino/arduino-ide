import * as remote from '@theia/core/electron-shared/@electron/remote';
import {
  inject,
  injectable,
  postConstruct,
} from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import {
  MAIN_MENU_BAR,
  MenuContribution,
  MenuModelRegistry,
} from '@theia/core';
import {
  FrontendApplication,
  FrontendApplicationContribution,
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
import { ElectronWindowPreferences } from '@theia/core/lib/electron-browser/window/electron-window-preferences';
import { BoardsServiceProvider } from './boards/boards-service-provider';
import { BoardsToolBarItem } from './boards/boards-toolbar-item';
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

  @inject(CommandRegistry)
  private readonly commandRegistry: CommandRegistry;

  @inject(ElectronWindowPreferences)
  private readonly electronWindowPreferences: ElectronWindowPreferences;

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

  onStart(app: FrontendApplication): void {
    this.electronWindowPreferences.onPreferenceChanged((event) => {
      if (event.newValue !== event.oldValue) {
        switch (event.preferenceName) {
          case 'window.zoomLevel':
            if (typeof event.newValue === 'number') {
              const webContents = remote.getCurrentWebContents();
              webContents.setZoomLevel(event.newValue || 0);
            }
            break;
        }
      }
    });
    this.appStateService.reachedState('ready').then(() =>
      this.electronWindowPreferences.ready.then(() => {
        const webContents = remote.getCurrentWebContents();
        const zoomLevel =
          this.electronWindowPreferences.get('window.zoomLevel');
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
          light: 'button.hoverBackground',
          hc: 'button.background',
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
          light: 'dropdown.background',
          hc: 'dropdown.background',
        },
        description: 'Background color of the Board Selector.',
      },

      {
        id: 'arduino.toolbar.dropdown.label',
        defaults: {
          dark: 'dropdown.foreground',
          light: 'dropdown.foreground',
          hc: 'dropdown.foreground',
        },
        description: 'Font color of the Board Selector.',
      },
      {
        id: 'arduino.toolbar.dropdown.iconSelected',
        defaults: {
          dark: 'list.activeSelectionIconForeground',
          light: 'list.activeSelectionIconForeground',
          hc: 'list.activeSelectionIconForeground',
        },
        description:
          'Color of the selected protocol icon in the Board Selector.',
      },
      {
        id: 'arduino.toolbar.dropdown.option.backgroundHover',
        defaults: {
          dark: 'list.hoverBackground',
          light: 'list.hoverBackground',
          hc: 'list.hoverBackground',
        },
        description: 'Background color on hover of the Board Selector options.',
      },
      {
        id: 'arduino.toolbar.dropdown.option.backgroundSelected',
        defaults: {
          dark: 'list.activeSelectionBackground',
          light: 'list.activeSelectionBackground',
          hc: 'list.activeSelectionBackground',
        },
        description:
          'Background color of the selected board in the Board Selector.',
      }
    );
  }
}
