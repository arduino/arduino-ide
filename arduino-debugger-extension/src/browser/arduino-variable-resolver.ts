
import { VariableContribution, VariableRegistry, Variable } from '@theia/variable-resolver/lib/browser';
import { injectable, inject } from 'inversify';
import URI from '@theia/core/lib/common/uri';
import { BoardsServiceClientImpl } from 'arduino-ide-extension/lib/browser/boards/boards-service-client-impl';
import { BoardsService, ToolLocations } from 'arduino-ide-extension/lib/common/protocol/boards-service';
import { WorkspaceVariableContribution } from '@theia/workspace/lib/browser/workspace-variable-contribution';

@injectable()
export class ArduinoVariableResolver implements VariableContribution {

    @inject(BoardsServiceClientImpl)
    protected readonly boardsServiceClient: BoardsServiceClientImpl;

    @inject(BoardsService)
    protected readonly boardsService: BoardsService;

    @inject(WorkspaceVariableContribution)
    protected readonly workspaceVars: WorkspaceVariableContribution;

    registerVariables(variables: VariableRegistry): void {
        variables.registerVariable(<Variable>{
            name: `boardTools`,
            description: "Provides paths and access to board specific tooling",
            resolve: this.resolveBoardTools.bind(this),
        });
        variables.registerVariable(<Variable>{
            name: "board",
            description: "Provides details about the currently selected board",
            resolve: this.resolveBoard.bind(this),
        });

        variables.registerVariable({
            name: "sketchBinary",
            description: "Path to the sketch's binary file",
            resolve: this.resolveSketchBinary.bind(this)
        });
    }

    // TODO: this function is a total hack. Instead of botching around with URI's it should ask something on the backend
    //       that properly udnerstands the filesystem.
    protected async resolveSketchBinary(context?: URI, argument?: string, configurationSection?: string): Promise<Object> {
        let sketchPath = argument || this.workspaceVars.getResourceUri()!.path.toString();
        return sketchPath.substring(0, sketchPath.length - 3) + "arduino.samd.arduino_zero_edbg.elf";
    }

    protected async resolveBoard(context?: URI, argument?: string, configurationSection?: string): Promise<Object> {
        const { boardsConfig } = this.boardsServiceClient;
        if (!boardsConfig || !boardsConfig.selectedBoard) {
            throw new Error('No boards selected. Please select a board.');
        }

        if (!argument || argument === "fqbn") {
            return boardsConfig.selectedBoard.fqbn!;
        }
        if (argument === "name") {
            return boardsConfig.selectedBoard.name;
        }

        const details = await this.boardsService.detail({id: boardsConfig.selectedBoard.fqbn!});
        if (!details.item) {
            throw new Error("Cannot get board details");
        }
        if (argument === "openocd-debug-file") {
            return details.item.locations!.debugScript;
        }

        return boardsConfig.selectedBoard.fqbn!;
    }

    protected async resolveBoardTools(context?: URI, argument?: string, configurationSection?: string): Promise<Object> {
        const { boardsConfig } = this.boardsServiceClient;
        if (!boardsConfig || !boardsConfig.selectedBoard) {
            throw new Error('No boards selected. Please select a board.');
        }
        const details = await this.boardsService.detail({id: boardsConfig.selectedBoard.fqbn!});
        if (!details.item) {
            throw new Error("Cannot get board details")
        }

        let toolLocations: { [name: string]: ToolLocations } = {};
        details.item.requiredTools.forEach(t => {
            toolLocations[t.name] = t.locations!;
        })

        switch(argument) {
            case "openocd":
                return toolLocations["openocd"].main;
            case "openocd-scripts":
                return toolLocations["openocd"].scripts;
            case "objdump":
                return toolLocations["arm-none-eabi-gcc"].objdump;
            case "gdb":
                return toolLocations["arm-none-eabi-gcc"].gdb;
        }

        return boardsConfig.selectedBoard.name;
    }

}