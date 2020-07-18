import { MAIN_MENU_BAR } from '@theia/core/lib/common/menu';
import { CommonMenus } from '@theia/core/lib/browser/common-frontend-contribution';

export namespace ArduinoMenus {

    // Main menu
    // File
    export const FILE__SKETCH_GROUP = [...CommonMenus.FILE, '0_sketch'];
    export const FILE__PRINT_GROUP = [...CommonMenus.FILE, '1_print'];

    // Edit
    export const EDIT__TEXT_CONTROL_GROUP = [...CommonMenus.EDIT, '1_text_control']; // `Copy`, `Copy to Forum`, `Paste`, etc.
    export const EDIT__CODE_CONTROL_GROUP = [...CommonMenus.EDIT, '2_code_control']; // `Comment/Uncomment`, etc.
    export const EDIT__FONT_CONTROL_GROUP = [...CommonMenus.EDIT, '3_font_control'];
    export const EDIT__FIND_GROUP = [...CommonMenus.EDIT, '4_find'];

    // Sketch
    export const SKETCH = [...MAIN_MENU_BAR, '3_sketch'];
    export const SKETCH__MAIN_GROUP = [...SKETCH, '0_main'];
    export const SKETCH__UTILS_GROUP = [...SKETCH, '1_utils'];

    // Tools
    export const TOOLS = [...MAIN_MENU_BAR, '4_tools'];
    export const TOOLS__MAIN_GROUP = [...TOOLS, '0_main'];

    // Context menu
    // Open
    export const OPEN_SKETCH__CONTEXT = ['arduino-open-sketch--context'];
    export const OPEN_SKETCH__CONTEXT__OPEN_GROUP = [...OPEN_SKETCH__CONTEXT, '0_open'];
    export const OPEN_SKETCH__CONTEXT__RECENT_GROUP = [...OPEN_SKETCH__CONTEXT, '1_recent'];
    export const OPEN_SKETCH__CONTEXT__EXAMPLES_GROUP = [...OPEN_SKETCH__CONTEXT, '2_examples'];

}
