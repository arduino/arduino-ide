import { CommonMenus } from '@theia/core/lib/browser/common-frontend-contribution';

export namespace ArduinoMenus {
    export const FILE__SKETCH_GROUP = [...CommonMenus.FILE, '0_sketch'];
    export const FILE__PRINT_GROUP = [...CommonMenus.FILE, '1_print'];
}
