import { injectable, inject } from "inversify";
import { MenuContribution, MenuModelRegistry, MenuPath, CommandRegistry, Command } from "@theia/core";
import { CommonMenus } from "@theia/core/lib/browser";
import { ArduinoCommands } from "./arduino-commands";
import { SketchesService, Sketch } from "../common/protocol/sketches-service";
import { AWorkspaceService } from "./arduino-workspace-service";

export namespace ArduinoOpenSketchContextMenu {
    export const PATH: MenuPath = ['arduino-open-sketch-context-menu'];
    export const OPEN_GROUP: MenuPath = [...PATH, '1_open'];
    export const WS_SKETCHES_GROUP: MenuPath = [...PATH, '2_sketches'];
    export const EXAMPLE_SKETCHES_GROUP: MenuPath = [...PATH, '3_examples'];
}

@injectable()
export class ArduinoFileMenuContribution implements MenuContribution {

    @inject(CommandRegistry)
    protected readonly commands: CommandRegistry;

    @inject(SketchesService)
    protected readonly sketches: SketchesService;

    constructor(
        @inject(AWorkspaceService) protected readonly workspaceService: AWorkspaceService,
        @inject(MenuModelRegistry) protected readonly menuRegistry: MenuModelRegistry) {
        workspaceService.onWorkspaceChanged(() => {
            if (this.workspaceService.workspace) {
                this.registerSketchesInMenu(menuRegistry);
            }
        })
    }

    protected registerSketchesInMenu(registry: MenuModelRegistry) {
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

    protected async getWorkspaceSketches(): Promise<Sketch[]> {
        const sketches = this.sketches.getSketches(this.workspaceService.workspace);
        return sketches;
    }

    registerMenus(registry: MenuModelRegistry) {
        registry.registerMenuAction([...CommonMenus.FILE, '0_new_sletch'], {
            commandId: ArduinoCommands.NEW_SKETCH.id
        })

        registry.registerMenuAction(ArduinoOpenSketchContextMenu.OPEN_GROUP, {
            commandId: ArduinoCommands.OPEN_FILE_NAVIGATOR.id,
            label: 'Open...'
        });
    }
}