import { isOSX } from '@theia/core/lib/common/os';
import { CommonMenus } from '@theia/core/lib/browser/common-frontend-contribution';
import {
  MAIN_MENU_BAR,
  MenuModelRegistry,
  MenuNode,
  MenuPath,
  SubMenuOptions,
} from '@theia/core/lib/common/menu';

export namespace ArduinoMenus {
  // Main menu
  // -- File
  export const FILE__SKETCH_GROUP = [...CommonMenus.FILE, '0_sketch'];
  export const FILE__PRINT_GROUP = [...CommonMenus.FILE, '1_print'];
  // XXX: on macOS, the "Preferences" and "Advanced" group is not under `File`
  // The empty path ensures no top level menu is created for the preferences, even if they contains sub menus
  export const FILE__PREFERENCES_GROUP = [
    ...(isOSX ? [''] : CommonMenus.FILE),
    '2_preferences',
  ];
  export const FILE__ADVANCED_GROUP = [
    ...(isOSX ? [''] : CommonMenus.FILE),
    '3_advanced',
  ];
  export const FILE__ADVANCED_SUBMENU = [
    ...FILE__ADVANCED_GROUP,
    '0_advanced_sub',
  ];

  export const FILE__QUIT_GROUP = [...CommonMenus.FILE, '3_quit'];

  // -- File / Open Recent
  export const FILE__OPEN_RECENT_SUBMENU = [
    ...FILE__SKETCH_GROUP,
    '0_open_recent',
  ];

  // -- File / Sketchbook
  export const FILE__SKETCHBOOK_SUBMENU = [
    ...FILE__SKETCH_GROUP,
    '1_sketchbook',
  ];

  // -- File / Examples
  export const FILE__EXAMPLES_SUBMENU = [...FILE__SKETCH_GROUP, '2_examples'];
  export const EXAMPLES__BUILT_IN_GROUP = [
    ...FILE__EXAMPLES_SUBMENU,
    '0_built_ins',
  ];
  export const EXAMPLES__ANY_BOARD_GROUP = [
    ...FILE__EXAMPLES_SUBMENU,
    '1_any_board',
  ];
  export const EXAMPLES__CURRENT_BOARD_GROUP = [
    ...FILE__EXAMPLES_SUBMENU,
    '2_current_board',
  ];
  export const EXAMPLES__USER_LIBS_GROUP = [
    ...FILE__EXAMPLES_SUBMENU,
    '3_user_libs',
  ];

  // -- Edit
  // `Copy`, `Copy to Forum`, `Paste`, etc.
  // Note: `1_undo` is the first group from Theia, we start with `2`
  export const EDIT__TEXT_CONTROL_GROUP = [
    ...CommonMenus.EDIT,
    '2_text_control',
  ];
  // `Comment/Uncomment`, etc.
  export const EDIT__CODE_CONTROL_GROUP = [
    ...CommonMenus.EDIT,
    '3_code_control',
  ];
  export const EDIT__FONT_CONTROL_GROUP = [
    ...CommonMenus.EDIT,
    '4_font_control',
  ];
  export const EDIT__FIND_GROUP = [...CommonMenus.EDIT, '5_find'];

  // -- Sketch
  export const SKETCH = [...MAIN_MENU_BAR, '3_sketch'];
  export const SKETCH__MAIN_GROUP = [...SKETCH, '0_main'];
  export const SKETCH__UTILS_GROUP = [...SKETCH, '1_utils'];

  // -- Tools
  export const TOOLS = [...MAIN_MENU_BAR, '4_tools'];
  // `Auto Format`, `Archive Sketch`, `Manage Libraries...`, `Serial Monitor`
  export const TOOLS__MAIN_GROUP = [...TOOLS, '0_main'];
  // `Connectivity Firmware Updater`
  export const TOOLS__FIRMWARE_UPLOADER_GROUP = [
    ...TOOLS,
    '1_firmware_uploader',
  ];
  // `Board`, `Port`, and `Get Board Info`.
  export const TOOLS__BOARD_SELECTION_GROUP = [...TOOLS, '2_board_selection'];
  // Core settings, such as `Processor` and `Programmers` for the board and `Burn Bootloader`
  export const TOOLS__BOARD_SETTINGS_GROUP = [...TOOLS, '3_board_settings'];

  // -- Help
  // `Getting Started`, `Environment`, `Troubleshooting`, etc.
  export const HELP__MAIN_GROUP = [...CommonMenus.HELP, '0_main'];
  // `Find in reference`, `FAQ`, etc.
  export const HELP__FIND_GROUP = [...CommonMenus.HELP, '1_find'];
  // `Advanced Mode`.
  // XXX: this will be removed.
  export const HELP__CONTROL_GROUP = [...CommonMenus.HELP, '2_control'];
  // `About` group
  // XXX: on macOS, the about group is not under `Help`
  export const HELP__ABOUT_GROUP = [
    ...(isOSX ? MAIN_MENU_BAR : CommonMenus.HELP),
    '999_about',
  ];

  // ------------

  // Context menus
  // -- Open
  export const OPEN_SKETCH__CONTEXT = ['arduino-open-sketch--context'];
  export const OPEN_SKETCH__CONTEXT__OPEN_GROUP = [
    ...OPEN_SKETCH__CONTEXT,
    '0_open',
  ];
  export const OPEN_SKETCH__CONTEXT__RECENT_GROUP = [
    ...OPEN_SKETCH__CONTEXT,
    '1_recent',
  ];
  export const OPEN_SKETCH__CONTEXT__EXAMPLES_GROUP = [
    ...OPEN_SKETCH__CONTEXT,
    '2_examples',
  ];

  // -- Sketch control
  export const SKETCH_CONTROL__CONTEXT = ['arduino-sketch-control--context'];
  // `New Tab`, `Rename`, `Delete`
  export const SKETCH_CONTROL__CONTEXT__MAIN_GROUP = [
    ...SKETCH_CONTROL__CONTEXT,
    '0_main',
  ];
  // `Previous Tab`, `Next Tab`
  export const SKETCH_CONTROL__CONTEXT__NAVIGATION_GROUP = [
    ...SKETCH_CONTROL__CONTEXT,
    '1_navigation',
  ];
  // Sketch files opened in editors
  export const SKETCH_CONTROL__CONTEXT__RESOURCES_GROUP = [
    ...SKETCH_CONTROL__CONTEXT,
    '2_resources',
  ];
}

/**
 * This is a hack. It removes a submenu with all its children if any.
 * Theia cannot dispose submenu entries with a proper API: https://github.com/eclipse-theia/theia/issues/7299
 */
export function unregisterSubmenu(
  menuPath: string[],
  menuRegistry: MenuModelRegistry
): void {
  if (menuPath.length < 2) {
    throw new Error(
      `Expected at least two item as a menu-path. Got ${JSON.stringify(
        menuPath
      )} instead.`
    );
  }
  const toRemove = menuPath[menuPath.length - 1];
  const parentMenuPath = menuPath.slice(0, menuPath.length - 1);
  // This is unsafe. Calling `getMenu` with a non-existing menu-path will result in a new menu creation.
  // https://github.com/eclipse-theia/theia/issues/7300
  const parent = menuRegistry.getMenu(parentMenuPath);
  const index = parent.children.findIndex(({ id }) => id === toRemove);
  if (index === -1) {
    throw new Error(
      `Could not find menu with menu-path: ${JSON.stringify(menuPath)}.`
    );
  }
  (parent.children as Array<MenuNode>).splice(index, 1);
}

/**
 * Special menu node that is not backed by any commands and is always disabled.
 */
export class PlaceholderMenuNode implements MenuNode {
  constructor(
    protected readonly menuPath: MenuPath,
    readonly label: string,
    protected options: SubMenuOptions = { order: '0' }
  ) {}

  get icon(): string | undefined {
    return this.options?.iconClass;
  }

  get sortString(): string {
    return this.options?.order || this.label;
  }

  get id(): string {
    return [...this.menuPath, 'placeholder'].join('-');
  }
}
