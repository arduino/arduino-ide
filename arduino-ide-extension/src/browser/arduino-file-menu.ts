import { injectable, inject } from "inversify";
import { MenuContribution, MenuModelRegistry, MenuPath } from "@theia/core";
import { CommonMenus } from "@theia/core/lib/browser";
import { ArduinoCommands } from "./arduino-commands";

export namespace ArduinoToolbarContextMenu {
    export const OPEN_SKETCH_PATH: MenuPath = ['arduino-open-sketch-context-menu'];
    export const OPEN_GROUP: MenuPath = [...OPEN_SKETCH_PATH, '1_open'];
    export const WS_SKETCHES_GROUP: MenuPath = [...OPEN_SKETCH_PATH, '2_sketches'];
    export const EXAMPLE_SKETCHES_GROUP: MenuPath = [...OPEN_SKETCH_PATH, '3_examples'];
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
    }
}