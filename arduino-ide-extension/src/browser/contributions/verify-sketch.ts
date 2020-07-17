import { inject, injectable } from 'inversify';
import { ArduinoMenus } from '../menu/arduino-menus';
import { ArduinoToolbar } from '../toolbar/arduino-toolbar';
import { BoardsConfigStore } from '../boards/boards-config-store';
import { BoardsServiceClientImpl } from '../boards/boards-service-client-impl';
import { SketchContribution, Command, CommandRegistry, MenuModelRegistry, KeybindingRegistry, TabBarToolbarRegistry } from './contribution';
import { CoreService } from '../../common/protocol';

@injectable()
export class VerifySketch extends SketchContribution {

    @inject(CoreService)
    protected readonly coreService: CoreService;

    @inject(BoardsConfigStore)
    protected readonly boardsConfigStore: BoardsConfigStore;

    @inject(BoardsServiceClientImpl)
    protected readonly boardsServiceClientImpl: BoardsServiceClientImpl;

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(VerifySketch.Commands.VERIFY_SKETCH, {
            execute: () => this.verifySketch()
        });
        registry.registerCommand(VerifySketch.Commands.VERIFY_SKETCH_TOOLBAR, {
            isVisible: widget => ArduinoToolbar.is(widget) && widget.side === 'left',
            execute: () => registry.executeCommand(VerifySketch.Commands.VERIFY_SKETCH.id)
        });
    }

    registerMenus(registry: MenuModelRegistry): void {
        registry.registerMenuAction(ArduinoMenus.SKETCH__MAIN_GROUP, {
            commandId: VerifySketch.Commands.VERIFY_SKETCH.id,
            label: 'Verify/Compile',
            order: '0'
        });
    }

    registerKeybindings(registry: KeybindingRegistry): void {
        registry.registerKeybinding({
            command: VerifySketch.Commands.VERIFY_SKETCH.id,
            keybinding: 'CtrlCmd+R'
        });
    }

    registerToolbarItems(registry: TabBarToolbarRegistry): void {
        registry.registerItem({
            id: VerifySketch.Commands.VERIFY_SKETCH_TOOLBAR.id,
            command: VerifySketch.Commands.VERIFY_SKETCH_TOOLBAR.id,
            tooltip: 'Verify',
            priority: 0
        });
    }

    async verifySketch(): Promise<void> {
        const sketch = await this.getCurrentSketch();
        if (!sketch) {
            return;
        }
        try {
            const { boardsConfig } = this.boardsServiceClientImpl;
            if (!boardsConfig || !boardsConfig.selectedBoard) {
                throw new Error('No boards selected. Please select a board.');
            }
            if (!boardsConfig.selectedBoard.fqbn) {
                throw new Error(`No core is installed for the '${boardsConfig.selectedBoard.name}' board. Please install the core.`);
            }
            const fqbn = await this.boardsConfigStore.appendConfigToFqbn(boardsConfig.selectedBoard.fqbn);
            await this.coreService.compile({
                sketchUri: sketch.uri,
                fqbn,
                optimizeForDebug: this.editorMode.compileForDebug
            });
        } catch (e) {
            await this.messageService.error(e.toString());
        }
    }

}

export namespace VerifySketch {
    export namespace Commands {
        export const VERIFY_SKETCH: Command = {
            id: 'arduino-verify-sketch'
        };
        export const VERIFY_SKETCH_TOOLBAR: Command = {
            id: 'arduino-verify-sketch--toolbar'
        };
    }
}
