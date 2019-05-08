import { injectable } from "inversify";
import { MenuContribution, MenuModelRegistry } from "@theia/core";
import { CommonMenus } from "@theia/core/lib/browser";
import { ArduinoCommands } from "./arduino-commands";

@injectable()
export class ArduinoFileMenuContribution implements MenuContribution {

    registerMenus(registry: MenuModelRegistry) {
        registry.registerMenuAction([...CommonMenus.FILE, '0_new_sletch'], {
            commandId: ArduinoCommands.NEW_SKETCH.id
        })
    }

}