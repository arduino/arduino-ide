import { CommonMenus } from '@theia/core/lib/browser/common-frontend-contribution';

export namespace ArduinoMenus {

    // Main menu
    export const FILE__SKETCH_GROUP = [...CommonMenus.FILE, '0_sketch'];
    export const FILE__PRINT_GROUP = [...CommonMenus.FILE, '1_print'];

    // `Open...` context menu
    export const OPEN_SKETCH__CONTEXT = ['arduino-open-sketch--context'];
    export const OPEN_SKETCH__CONTEXT__OPEN_GROUP = [...OPEN_SKETCH__CONTEXT, '0_open'];
    export const OPEN_SKETCH__CONTEXT__RECENT_GROUP = [...OPEN_SKETCH__CONTEXT, '1_recent'];
    export const OPEN_SKETCH__CONTEXT__EXAMPLES_GROUP = [...OPEN_SKETCH__CONTEXT, '2_examples'];

}
