import { injectable, inject } from "inversify";
import { MenuContribution, MenuModelRegistry, MenuPath } from "@theia/core";
import { CommonMenus } from "@theia/core/lib/browser";
import { ArduinoCommands } from "./arduino-commands";

export namespace ArduinoToolbarContextMenu {
    export const OPEN_SKETCH_PATH: MenuPath = ['arduino-open-sketch-context-menu'];
    export const OPEN_GROUP: MenuPath = [...OPEN_SKETCH_PATH, '1_open'];
    export const WS_SKETCHES_GROUP: MenuPath = [...OPEN_SKETCH_PATH, '2_sketches'];
    export const EXAMPLE_SKETCHES_GROUP: MenuPath = [...OPEN_SKETCH_PATH, '3_examples'];

    export const SELECT_BOARDS_PATH: MenuPath = ['arduino-select-boards-context-menu'];
    export const CONNECTED_GROUP: MenuPath = [...SELECT_BOARDS_PATH, '1_connected'];
    export const OPEN_BOARDS_DIALOG_GROUP: MenuPath = [...SELECT_BOARDS_PATH, '2_open_boards_dialog'];
}

@injectable()
export class ArduinoToolbarMenuContribution implements MenuContribution {

    constructor(
        @inject(MenuModelRegistry) protected readonly menuRegistry: MenuModelRegistry) {
    }

    registerMenus(registry: MenuModelRegistry) {
        registry.registerMenuAction([...CommonMenus.FILE, '0_new_sletch'], {
            commandId: ArduinoCommands.NEW_SKETCH.id
        })

        registry.registerMenuAction(ArduinoToolbarContextMenu.OPEN_BOARDS_DIALOG_GROUP, {
            commandId: ArduinoCommands.OPEN_BOARDS_DIALOG.id,
            label: 'Select Other Board & Port'
        });
    }
}