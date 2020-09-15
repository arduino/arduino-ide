import { inject, injectable } from 'inversify';
import { OutputChannelManager } from '@theia/output/lib/common/output-channel';
import { CoreService } from '../../common/protocol';
import { ArduinoMenus } from '../menu/arduino-menus';
import { ArduinoToolbar } from '../toolbar/arduino-toolbar';
import { BoardsDataStore } from '../boards/boards-data-store';
import { MonitorConnection } from '../monitor/monitor-connection';
import { BoardsServiceProvider } from '../boards/boards-service-provider';
import { SketchContribution, Command, CommandRegistry, MenuModelRegistry, KeybindingRegistry, TabBarToolbarRegistry } from './contribution';

@injectable()
export class UploadSketch extends SketchContribution {

    @inject(CoreService)
    protected readonly coreService: CoreService;

    @inject(MonitorConnection)
    protected readonly monitorConnection: MonitorConnection;

    @inject(BoardsDataStore)
    protected readonly boardsDataStore: BoardsDataStore;

    @inject(BoardsServiceProvider)
    protected readonly boardsServiceClientImpl: BoardsServiceProvider;

    @inject(OutputChannelManager)
    protected readonly outputChannelManager: OutputChannelManager;

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(UploadSketch.Commands.UPLOAD_SKETCH, {
            execute: () => this.uploadSketch()
        });
        registry.registerCommand(UploadSketch.Commands.UPLOAD_SKETCH_USING_PROGRAMMER, {
            execute: () => this.uploadSketch(true)
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
        registry.registerMenuAction(ArduinoMenus.SKETCH__MAIN_GROUP, {
            commandId: UploadSketch.Commands.UPLOAD_SKETCH_USING_PROGRAMMER.id,
            label: 'Upload Using Programmer',
            order: '1'
        });
    }

    registerKeybindings(registry: KeybindingRegistry): void {
        registry.registerKeybinding({
            command: UploadSketch.Commands.UPLOAD_SKETCH.id,
            keybinding: 'CtrlCmd+U'
        });
        registry.registerKeybinding({
            command: UploadSketch.Commands.UPLOAD_SKETCH_USING_PROGRAMMER.id,
            keybinding: 'CtrlCmd+Shift+U'
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

    async uploadSketch(usingProgrammer: boolean = false): Promise<void> {
        const uri = await this.sketchServiceClient.currentSketchFile();
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
            if (!boardsConfig.selectedBoard.fqbn) {
                throw new Error(`No core is installed for the '${boardsConfig.selectedBoard.name}' board. Please install the core.`);
            }

            const [fqbn, { selectedProgrammer }] = await Promise.all([
                this.boardsDataStore.appendConfigToFqbn(boardsConfig.selectedBoard.fqbn),
                this.boardsDataStore.getData(boardsConfig.selectedBoard.fqbn)
            ]);

            let options: CoreService.Upload.Options | undefined = undefined;
            const sketchUri = uri;
            const optimizeForDebug = this.editorMode.compileForDebug;
            const { selectedPort } = boardsConfig;

            if (usingProgrammer) {
                const programmer = selectedProgrammer;
                if (!programmer) {
                    throw new Error('Programmer is not selected. Please select a programmer from the `Tools` > `Programmer` menu.');
                }
                let port: undefined | string = undefined;
                // If the port is set by the user, we pass it to the CLI as it might be required.
                // If it is not set but the CLI requires it, we let the CLI to complain.
                if (selectedPort) {
                    port = selectedPort.address;
                }
                options = {
                    sketchUri,
                    fqbn,
                    optimizeForDebug,
                    programmer,
                    port
                };
            } else {
                if (!selectedPort) {
                    throw new Error('No ports selected. Please select a port.');
                }
                const port = selectedPort.address;
                options = {
                    sketchUri,
                    fqbn,
                    optimizeForDebug,
                    port
                };
            }
            this.outputChannelManager.getChannel('Arduino: upload').clear();
            await this.coreService.upload(options);
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
        export const UPLOAD_SKETCH_USING_PROGRAMMER: Command = {
            id: 'arduino-upload-sketch-using-programmer'
        };
        export const UPLOAD_SKETCH_TOOLBAR: Command = {
            id: 'arduino-upload-sketch--toolbar'
        };
    }
}
