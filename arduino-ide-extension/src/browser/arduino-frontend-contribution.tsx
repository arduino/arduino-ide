import { ColorContribution } from '@theia/core/lib/browser/color-application-contribution';
import { ColorRegistry } from '@theia/core/lib/browser/color-registry';
import { CommonMenus } from '@theia/core/lib/browser/common-frontend-contribution';
import { FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import {
  TabBarToolbarContribution,
  TabBarToolbarRegistry,
} from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import {
  ColorTheme,
  CssStyleCollector,
  StylingParticipant,
} from '@theia/core/lib/browser/styling-service';
import {
  CommandContribution,
  CommandRegistry,
} from '@theia/core/lib/common/command';
import {
  MAIN_MENU_BAR,
  MenuContribution,
  MenuModelRegistry,
} from '@theia/core/lib/common/menu';
import { MessageService } from '@theia/core/lib/common/message-service';
import { nls } from '@theia/core/lib/common/nls';
import { isHighContrast } from '@theia/core/lib/common/theme';
import { ElectronWindowPreferences } from '@theia/core/lib/electron-browser/window/electron-window-preferences';
import {
  inject,
  injectable,
  postConstruct,
} from '@theia/core/shared/inversify';
import React from '@theia/core/shared/react';
import { EditorCommands } from '@theia/editor/lib/browser/editor-command';
import { EditorMainMenu } from '@theia/editor/lib/browser/editor-menu';
import { MonacoMenus } from '@theia/monaco/lib/browser/monaco-menu';
import { FileNavigatorCommands } from '@theia/navigator/lib/browser/navigator-contribution';
import { TerminalMenus } from '@theia/terminal/lib/browser/terminal-frontend-contribution';
import { BoardsServiceProvider } from './boards/boards-service-provider';
import { BoardsToolBarItem } from './boards/boards-toolbar-item';
import { ArduinoMenus } from './menu/arduino-menus';
import { MonitorViewContribution } from './serial/monitor/monitor-view-contribution';
import { SerialPlotterContribution } from './serial/plotter/plotter-frontend-contribution';
import { ArduinoToolbar } from './toolbar/arduino-toolbar';

@injectable()
export class ArduinoFrontendContribution
  implements
    FrontendApplicationContribution,
    TabBarToolbarContribution,
    CommandContribution,
    MenuContribution,
    ColorContribution,
    StylingParticipant
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
  protected init(): void {
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

  onStart(): void {
    this.electronWindowPreferences.onPreferenceChanged((event) => {
      if (event.newValue !== event.oldValue) {
        switch (event.preferenceName) {
          case 'window.zoomLevel':
            if (typeof event.newValue === 'number') {
              window.electronTheiaCore.setZoomLevel(event.newValue || 0);
            }
            break;
        }
      }
    });
    this.appStateService.reachedState('ready').then(() =>
      this.electronWindowPreferences.ready.then(() => {
        const zoomLevel =
          this.electronWindowPreferences.get('window.zoomLevel');
        window.electronTheiaCore.setZoomLevel(zoomLevel);
      })
    );
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
          hcDark: 'activityBar.inactiveForeground',
          hcLight: 'activityBar.inactiveForeground',
        },
        description:
          'Background color of the toolbar items. Such as Upload, Verify, etc.',
      },
      {
        id: 'arduino.toolbar.button.hoverBackground',
        defaults: {
          dark: 'button.hoverBackground',
          light: 'button.hoverBackground',
          hcDark: 'button.background',
          hcLight: 'button.background',
        },
        description:
          'Background color of the toolbar items when hovering over them. Such as Upload, Verify, etc.',
      },
      {
        id: 'arduino.toolbar.button.secondary.label',
        defaults: {
          dark: 'secondaryButton.foreground',
          light: 'button.foreground',
          hcDark: 'activityBar.inactiveForeground',
          hcLight: 'activityBar.inactiveForeground',
        },
        description:
          'Foreground color of the toolbar items. Such as Serial Monitor and Serial Plotter',
      },
      {
        id: 'arduino.toolbar.button.secondary.hoverBackground',
        defaults: {
          dark: 'secondaryButton.hoverBackground',
          light: 'button.hoverBackground',
          hcDark: 'textLink.foreground',
          hcLight: 'textLink.foreground',
        },
        description:
          'Background color of the toolbar items when hovering over them, such as "Serial Monitor" and "Serial Plotter"',
      },
      {
        id: 'arduino.toolbar.toggleBackground',
        defaults: {
          dark: 'editor.selectionBackground',
          light: 'editor.selectionBackground',
          hcDark: 'textPreformat.foreground',
          hcLight: 'textPreformat.foreground',
        },
        description:
          'Toggle color of the toolbar items when they are currently toggled (the command is in progress)',
      },
      {
        id: 'arduino.toolbar.dropdown.border',
        defaults: {
          dark: 'dropdown.border',
          light: 'dropdown.border',
          hcDark: 'dropdown.border',
          hcLight: 'dropdown.border',
        },
        description: 'Border color of the Board Selector.',
      },
      {
        id: 'arduino.toolbar.dropdown.borderActive',
        defaults: {
          dark: 'focusBorder',
          light: 'focusBorder',
          hcDark: 'focusBorder',
          hcLight: 'focusBorder',
        },
        description: "Border color of the Board Selector when it's active",
      },
      {
        id: 'arduino.toolbar.dropdown.background',
        defaults: {
          dark: 'tab.unfocusedActiveBackground',
          light: 'dropdown.background',
          hcDark: 'dropdown.background',
          hcLight: 'dropdown.background',
        },
        description: 'Background color of the Board Selector.',
      },
      {
        id: 'arduino.toolbar.dropdown.label',
        defaults: {
          dark: 'dropdown.foreground',
          light: 'dropdown.foreground',
          hcDark: 'dropdown.foreground',
          hcLight: 'dropdown.foreground',
        },
        description: 'Font color of the Board Selector.',
      },
      {
        id: 'arduino.toolbar.dropdown.iconSelected',
        defaults: {
          dark: 'list.activeSelectionIconForeground',
          light: 'list.activeSelectionIconForeground',
          hcDark: 'list.activeSelectionIconForeground',
          hcLight: 'list.activeSelectionIconForeground',
        },
        description:
          'Color of the selected protocol icon in the Board Selector.',
      },
      {
        id: 'arduino.toolbar.dropdown.option.backgroundHover',
        defaults: {
          dark: 'list.hoverBackground',
          light: 'list.hoverBackground',
          hcDark: 'list.hoverBackground',
          hcLight: 'list.hoverBackground',
        },
        description: 'Background color on hover of the Board Selector options.',
      },
      {
        id: 'arduino.toolbar.dropdown.option.backgroundSelected',
        defaults: {
          dark: 'list.activeSelectionBackground',
          light: 'list.activeSelectionBackground',
          hcDark: 'list.activeSelectionBackground',
          hcLight: 'list.activeSelectionBackground',
        },
        description:
          'Background color of the selected board in the Board Selector.',
      }
    );
  }

  registerThemeStyle(theme: ColorTheme, collector: CssStyleCollector): void {
    const warningForeground = theme.getColor('warningForeground');
    const warningBackground = theme.getColor('warningBackground');
    const focusBorder = theme.getColor('focusBorder');
    const contrastBorder = theme.getColor('contrastBorder');
    const notificationsBackground = theme.getColor('notifications.background');
    const buttonBorder = theme.getColor('button.border');
    const buttonBackground = theme.getColor('button.background') || 'none';
    const dropdownBackground = theme.getColor('dropdown.background');
    const arduinoToolbarButtonBackground = theme.getColor(
      'arduino.toolbar.button.background'
    );
    if (isHighContrast(theme.type)) {
      // toolbar items
      collector.addRule(`
        .p-TabBar-toolbar .item.arduino-tool-item.enabled:hover > div.toggle-serial-monitor,
        .p-TabBar-toolbar .item.arduino-tool-item.enabled:hover > div.toggle-serial-plotter {
          background: transparent;
        }
      `);
      if (contrastBorder) {
        collector.addRule(`
          .quick-input-widget {
            outline: 1px solid ${contrastBorder};
            outline-offset: -1px;
          }
        `);
      }
      if (focusBorder) {
        // customized react-select widget
        collector.addRule(`
          .arduino-select__option--is-selected {
            outline: 1px solid ${focusBorder};
          }
        `);
        collector.addRule(`
          .arduino-select__option--is-focused {
            outline: 1px dashed ${focusBorder};
          }
        `);
        // boards selector dropdown
        collector.addRule(`
          #select-board-dialog .selectBoardContainer .list .item:hover {
            outline: 1px dashed ${focusBorder};
          }
        `);
        // button hover
        collector.addRule(`
          .theia-button:hover,
          button.theia-button:hover {
            outline: 1px dashed ${focusBorder};
          }
        `);
        collector.addRule(`
          .theia-button {
            border: 1px solid ${focusBorder};
          }
        `);
        collector.addRule(`
          .component-list-item .header .installed-version:hover:before {
            background-color: transparent;
            outline: 1px dashed ${focusBorder};
          }
        `);
        // tree node
        collector.addRule(`
          .theia-TreeNode:hover {
            outline: 1px dashed ${focusBorder};
          }
        `);
        collector.addRule(`
          .quick-input-list .monaco-list-row.focused,
          .theia-Tree .theia-TreeNode.theia-mod-selected {
            outline: 1px dotted ${focusBorder};
          }
        `);
        collector.addRule(`
          div#select-board-dialog .selectBoardContainer .list .item.selected,
          .theia-Tree:focus .theia-TreeNode.theia-mod-selected,
          .theia-Tree .ReactVirtualized__List:focus .theia-TreeNode.theia-mod-selected {
            outline: 1px solid ${focusBorder};
          }
        `);
        // quick input
        collector.addRule(`
          .quick-input-list .monaco-list-row:hover {
            outline: 1px dashed ${focusBorder};
          }
        `);
        // editor tab-bar
        collector.addRule(`
          .p-TabBar.theia-app-centers .p-TabBar-tab.p-mod-closable > .p-TabBar-tabCloseIcon:hover {
            outline: 1px dashed ${focusBorder};
          }
        `);
        collector.addRule(`
          #theia-main-content-panel .p-TabBar .p-TabBar-tab:hover {
            outline: 1px dashed ${focusBorder};
            outline-offset: -4px;
          }
        `);
        collector.addRule(`
          #theia-main-content-panel .p-TabBar .p-TabBar-tab.p-mod-current {
            outline: 1px solid ${focusBorder};
            outline-offset: -4px;
          }
        `);
        // boards selector dropdown
        collector.addRule(`
          .arduino-boards-dropdown-item:hover {
            outline: 1px dashed ${focusBorder};
            outline-offset: -2px;
          }
        `);
        if (notificationsBackground) {
          // notification
          collector.addRule(`
            .theia-notification-list-item:hover:not(:focus) {
              background-color: ${notificationsBackground};
              outline: 1px dashed ${focusBorder};
              outline-offset: -2px;
            }
          `);
        }
        if (arduinoToolbarButtonBackground) {
          // toolbar item
          collector.addRule(`
            .item.arduino-tool-item.toggled .arduino-upload-sketch--toolbar,
            .item.arduino-tool-item.toggled .arduino-verify-sketch--toolbar {
              background-color: ${arduinoToolbarButtonBackground} !important;
              outline: 1px solid ${focusBorder};
            }
          `);
          collector.addRule(`
            .p-TabBar-toolbar .item.arduino-tool-item.enabled:hover > div {
              background: ${arduinoToolbarButtonBackground};
              outline: 1px dashed ${focusBorder};
            }
          `);
        }
      }
      if (dropdownBackground) {
        // boards selector dropdown
        collector.addRule(`
          .arduino-boards-dropdown-item:hover {
            background: ${dropdownBackground};
          }
        `);
      }
      if (warningForeground && warningBackground) {
        // <input> widget with inverted foreground and background colors
        collector.addRule(`
          .theia-input.warning:focus,
          .theia-input.warning::placeholder,
          .theia-input.warning {
            color: ${warningBackground};
            background-color: ${warningForeground};
          }
        `);
      }
      if (buttonBorder) {
        collector.addRule(`
          button.theia-button,
          button.theia-button.secondary,
          .component-list-item .theia-button.secondary.no-border,
          .component-list-item .theia-button.secondary.no-border:hover {
            border: 1px solid ${buttonBorder};
          }
        `);
        collector.addRule(`
          .component-list-item .header .installed-version:before {
            color: ${buttonBackground};
            border: 1px solid ${buttonBorder};
          }
        `);
      }
    }
  }
}
