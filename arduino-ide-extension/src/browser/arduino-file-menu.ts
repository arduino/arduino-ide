import { injectable, inject } from "inversify";
import { MenuContribution, MenuModelRegistry, MenuPath, CommandRegistry, Command } from "@theia/core";
import { CommonMenus } from "@theia/core/lib/browser";
import { ArduinoCommands } from "./arduino-commands";
import { SketchesService, Sketch } from "../common/protocol/sketches-service";
import { AWorkspaceService } from "./arduino-workspace-service";
import { BoardsService, Board, AttachedSerialBoard, AttachedNetworkBoard } from "../common/protocol/boards-service";

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

    @inject(CommandRegistry)
    protected readonly commands: CommandRegistry;

    @inject(SketchesService)
    protected readonly sketches: SketchesService;

    @inject(BoardsService)
    protected readonly boardsService: BoardsService;

    constructor(
        @inject(AWorkspaceService) protected readonly workspaceService: AWorkspaceService,
        @inject(MenuModelRegistry) protected readonly menuRegistry: MenuModelRegistry) {
        workspaceService.onWorkspaceChanged(() => {
            if (this.workspaceService.workspace) {
                this.registerSketchesInMenu(menuRegistry);
                this.registerConnectedBoardsInMenu(menuRegistry);
            }
        })
    }

    protected async registerConnectedBoardsInMenu(registry: MenuModelRegistry) {
        const { boards } = await this.boardsService.getAttachedBoards();
        const selectedBoard = await this.boardsService.getSelectBoard();
        const selectedPort = selectedBoard ? this.getPort(selectedBoard) : '';
        boards.forEach(board => {
            const port = this.getPort(board);
            const command: Command = {
                id: 'selectBoard' + port
            }
            this.commands.registerCommand(command, {
                execute: () => this.commands.executeCommand(ArduinoCommands.SELECT_BOARD.id, board)
            });
            registry.registerMenuAction(ArduinoToolbarContextMenu.CONNECTED_GROUP, {
                commandId: command.id,
                label: board.name + (selectedPort === port ? '*' : '')
            });
        });
    }



    protected getPort(board: Board): string {
        if (AttachedSerialBoard.is(board)) {
            return board.port;
        }
        if (AttachedNetworkBoard.is(board)) {
            return 'netport: ' + board.port;
        }
        return '';
    }

    protected async registerSketchesInMenu(registry: MenuModelRegistry) {
        const sketches = await this.getWorkspaceSketches();
        sketches.forEach(sketch => {
            const command: Command = {
                id: 'openSketch' + sketch.name
            }
            this.commands.registerCommand(command, {
                execute: () => this.commands.executeCommand(ArduinoCommands.OPEN_SKETCH.id, sketch)
            });
            registry.registerMenuAction(ArduinoToolbarContextMenu.WS_SKETCHES_GROUP, {
                commandId: command.id,
                label: sketch.name
            });
        })
    }

    protected async getWorkspaceSketches(): Promise<Sketch[]> {
        const sketches = this.sketches.getSketches(this.workspaceService.workspace);
        return sketches;
    }

    registerMenus(registry: MenuModelRegistry) {
        registry.registerMenuAction([...CommonMenus.FILE, '0_new_sletch'], {
            commandId: ArduinoCommands.NEW_SKETCH.id
        });

        registry.registerMenuAction(ArduinoToolbarContextMenu.OPEN_GROUP, {
            commandId: ArduinoCommands.OPEN_FILE_NAVIGATOR.id,
            label: 'Open...'
        });

        registry.registerMenuAction(ArduinoToolbarContextMenu.OPEN_BOARDS_DIALOG_GROUP, {
            commandId: ArduinoCommands.OPEN_BOARDS_DIALOG.id,
            label: 'Select Other Board & Port'
        });
    }
}