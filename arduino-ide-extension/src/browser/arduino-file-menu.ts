import { injectable, inject } from "inversify";
import { MenuContribution, MenuModelRegistry, MenuPath, CommandRegistry, Command } from "@theia/core";
import { CommonMenus } from "@theia/core/lib/browser";
import { ArduinoCommands } from "./arduino-commands";
import URI from "@theia/core/lib/common/uri";

export namespace ArduinoOpenSketchContextMenu {
    export const PATH: MenuPath = ['arduino-open-sketch-context-menu'];
    export const OPEN_GROUP: MenuPath = [...PATH, '1_open'];
    export const WS_SKETCHES_GROUP: MenuPath = [...PATH, '2_sketches'];
    export const EXAMPLE_SKETCHES_GROUP: MenuPath = [...PATH, '3_examples'];
}

export interface SketchMenuEntry {
    name: string,
    uri: URI
}

@injectable()
export class ArduinoFileMenuContribution implements MenuContribution {

    @inject(CommandRegistry)
    protected readonly commands: CommandRegistry;


    protected async getWorkspaceSketches(): Promise<SketchMenuEntry[]> {
        return [
            {
                name: 'foo',
                uri: new URI('this/is/a/test/uri/foo')
            },
            {
                name: 'bar',
                uri: new URI('this/is/a/test/uri/bar')
            }
        ]
    }

    registerMenus(registry: MenuModelRegistry) {
        registry.registerMenuAction([...CommonMenus.FILE, '0_new_sletch'], {
            commandId: ArduinoCommands.NEW_SKETCH.id
        })

        registry.registerMenuAction(ArduinoOpenSketchContextMenu.OPEN_GROUP, {
            commandId: ArduinoCommands.OPEN_FILE_NAVIGATOR.id,
            label: 'Open...'
        });

        this.getWorkspaceSketches().then(sketches => {
            sketches.forEach(sketch => {

                const command: Command = {
                    id: 'openSketch' + sketch.name
                }
                this.commands.registerCommand(command, {
                    execute: () => this.commands.executeCommand(ArduinoCommands.OPEN_SKETCH.id, sketch)
                });

                registry.registerMenuAction(ArduinoOpenSketchContextMenu.WS_SKETCHES_GROUP, {
                    commandId: command.id,
                    label: sketch.name 
                });    
            })
        })

    }
}