import { inject, injectable } from 'inversify';
import { CoreService } from '../../common/protocol';
import { MonitorConnection } from '../monitor/monitor-connection';
import { BoardsDataStore } from '../boards/boards-data-store';
import { BoardsServiceClientImpl } from '../boards/boards-service-client-impl';
import { ArduinoMenus } from '../menu/arduino-menus';
import { ArduinoToolbar } from '../toolbar/arduino-toolbar';
import { SketchContribution, Command, CommandRegistry, MenuModelRegistry, KeybindingRegistry, TabBarToolbarRegistry } from './contribution';

@injectable()
export class UploadSketch extends SketchContribution {

    @inject(CoreService)
    protected readonly coreService: CoreService;

    @inject(MonitorConnection)
    protected readonly monitorConnection: MonitorConnection;

    @inject(BoardsDataStore)
    protected readonly boardsDataStore: BoardsDataStore;

    @inject(BoardsServiceClientImpl)
    protected readonly boardsServiceClientImpl: BoardsServiceClientImpl;

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(UploadSketch.Commands.UPLOAD_SKETCH, {
            execute: () => this.uploadSketch()
        });
        registry.registerCommand(UploadSketch.Commands.UPLOAD_SKETCH_TOOLBAR, {
            isVisible: widget => ArduinoToolbar.is(widget) && widget.side === 'left',
            execute: () => registry.executeCommand(UploadSketch.Commands.UPLOAD_SKETCH.id)
        });
    }

    registerMenus(registry: MenuModelRegistry): void {
        registry.registerMenuAction(ArduinoMenus.SKETCH__MAIN_GROUP, {
            commandId: UploadSketch.Commands.UPLOAD_SKETCH.id,
            label: 'Upload',
            order: '0'
        });
    }

    registerKeybindings(registry: KeybindingRegistry): void {
        registry.registerKeybinding({
            command: UploadSketch.Commands.UPLOAD_SKETCH.id,
            keybinding: 'CtrlCmd+U'
        });
    }

    registerToolbarItems(registry: TabBarToolbarRegistry): void {
        registry.registerItem({
            id: UploadSketch.Commands.UPLOAD_SKETCH_TOOLBAR.id,
            command: UploadSketch.Commands.UPLOAD_SKETCH_TOOLBAR.id,
            tooltip: 'Upload',
            priority: 1
        });
    }

    async uploadSketch(): Promise<void> {
        const uri = await this.currentSketchFile();
        if (!uri) {
            return;
        }
        const monitorConfig = this.monitorConnection.monitorConfig;
        if (monitorConfig) {
            await this.monitorConnection.disconnect();
        }
        try {
            const { boardsConfig } = this.boardsServiceClientImpl;
            if (!boardsConfig || !boardsConfig.selectedBoard) {
                throw new Error('No boards selected. Please select a board.');
            }
            const { selectedPort } = boardsConfig;
            if (!selectedPort) {
                throw new Error('No ports selected. Please select a port.');
            }
            if (!boardsConfig.selectedBoard.fqbn) {
                throw new Error(`No core is installed for the '${boardsConfig.selectedBoard.name}' board. Please install the core.`);
            }
            const fqbn = await this.boardsDataStore.appendConfigToFqbn(boardsConfig.selectedBoard.fqbn);
            await this.coreService.upload({
                sketchUri: uri,
                fqbn,
                port: selectedPort.address,
                optimizeForDebug: this.editorMode.compileForDebug
            });
            this.messageService.info('Done uploading.', { timeout: 1000 });
        } catch (e) {
            this.messageService.error(e.toString());
        } finally {
            if (monitorConfig) {
                await this.monitorConnection.connect(monitorConfig);
            }
        }
    }

}

export namespace UploadSketch {
    export namespace Commands {
        export const UPLOAD_SKETCH: Command = {
            id: 'arduino-upload-sketch'
        };
        export const UPLOAD_SKETCH_TOOLBAR: Command = {
            id: 'arduino-upload-sketch--toolbar'
        };
    }
}
