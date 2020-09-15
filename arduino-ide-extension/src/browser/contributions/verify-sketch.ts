import { inject, injectable } from 'inversify';
import { OutputChannelManager } from '@theia/output/lib/common/output-channel';
import { CoreService } from '../../common/protocol';
import { ArduinoMenus } from '../menu/arduino-menus';
import { ArduinoToolbar } from '../toolbar/arduino-toolbar';
import { BoardsDataStore } from '../boards/boards-data-store';
import { BoardsServiceProvider } from '../boards/boards-service-provider';
import { SketchContribution, Command, CommandRegistry, MenuModelRegistry, KeybindingRegistry, TabBarToolbarRegistry } from './contribution';

@injectable()
export class VerifySketch extends SketchContribution {

    @inject(CoreService)
    protected readonly coreService: CoreService;

    @inject(BoardsDataStore)
    protected readonly boardsDataStore: BoardsDataStore;

    @inject(BoardsServiceProvider)
    protected readonly boardsServiceClientImpl: BoardsServiceProvider;

    @inject(OutputChannelManager)
    protected readonly outputChannelManager: OutputChannelManager;

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
            order: '2'
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
        const uri = await this.sketchServiceClient.currentSketchFile();
        if (!uri) {
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
            const fqbn = await this.boardsDataStore.appendConfigToFqbn(boardsConfig.selectedBoard.fqbn);
            this.outputChannelManager.getChannel('Arduino: compile').clear();
            await this.coreService.compile({
                sketchUri: uri,
                fqbn,
                optimizeForDebug: this.editorMode.compileForDebug
            });
            this.messageService.info('Done compiling.', { timeout: 1000 });
        } catch (e) {
            this.messageService.error(e.toString());
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
