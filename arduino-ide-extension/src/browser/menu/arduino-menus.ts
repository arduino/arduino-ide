import { MAIN_MENU_BAR } from '@theia/core/lib/common/menu';
import { CommonMenus } from '@theia/core/lib/browser/common-frontend-contribution';
import { isOSX } from '@theia/core';

export namespace ArduinoMenus {

    // Main menu
    // -- File
    export const FILE__SKETCH_GROUP = [...CommonMenus.FILE, '0_sketch'];
    export const FILE__PRINT_GROUP = [...CommonMenus.FILE, '1_print'];
    // XXX: on macOS, the settings group is not under `File`
    export const FILE__SETTINGS_GROUP = [...(isOSX ? MAIN_MENU_BAR : CommonMenus.FILE), '2_settings'];
    export const FILE__QUIT_GROUP = [...CommonMenus.FILE, '3_quit'];

    // -- Edit
    // `Copy`, `Copy to Forum`, `Paste`, etc.
    // Note: `1_undo` is the first group from Theia, we start with `2`
    export const EDIT__TEXT_CONTROL_GROUP = [...CommonMenus.EDIT, '2_text_control'];
    // `Comment/Uncomment`, etc.
    export const EDIT__CODE_CONTROL_GROUP = [...CommonMenus.EDIT, '3_code_control'];
    export const EDIT__FONT_CONTROL_GROUP = [...CommonMenus.EDIT, '4_font_control'];
    export const EDIT__FIND_GROUP = [...CommonMenus.EDIT, '5_find'];

    // -- Sketch
    export const SKETCH = [...MAIN_MENU_BAR, '3_sketch'];
    export const SKETCH__MAIN_GROUP = [...SKETCH, '0_main'];
    export const SKETCH__UTILS_GROUP = [...SKETCH, '1_utils'];

    // -- Tools
    export const TOOLS = [...MAIN_MENU_BAR, '4_tools'];
    export const TOOLS__MAIN_GROUP = [...TOOLS, '0_main'];

    // Context menu
    // -- Open
    export const OPEN_SKETCH__CONTEXT = ['arduino-open-sketch--context'];
    export const OPEN_SKETCH__CONTEXT__OPEN_GROUP = [...OPEN_SKETCH__CONTEXT, '0_open'];
    export const OPEN_SKETCH__CONTEXT__RECENT_GROUP = [...OPEN_SKETCH__CONTEXT, '1_recent'];
    export const OPEN_SKETCH__CONTEXT__EXAMPLES_GROUP = [...OPEN_SKETCH__CONTEXT, '2_examples'];

    // -- Sketch control
    export const SKETCH_CONTROL__CONTEXT = ['arduino-sketch-control--context'];
    // `New Tab`, `Rename`, `Delete`
    export const SKETCH_CONTROL__CONTEXT__MAIN_GROUP = [...SKETCH_CONTROL__CONTEXT, '0_main'];
    // `Previous Tab`, `Next Tab`
    export const SKETCH_CONTROL__CONTEXT__NAVIGATION_GROUP = [...SKETCH_CONTROL__CONTEXT, '1_navigation'];
    // Sketch files opened in editors
    export const SKETCH_CONTROL__CONTEXT__RESOURCES_GROUP = [...SKETCH_CONTROL__CONTEXT, '2_resources'];

}
