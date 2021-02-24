import { inject, injectable } from 'inversify';
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
            order: '1'
        });
        registry.registerMenuAction(ArduinoMenus.SKETCH__MAIN_GROUP, {
            commandId: UploadSketch.Commands.UPLOAD_SKETCH_USING_PROGRAMMER.id,
            label: 'Upload Using Programmer',
            order: '2'
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
        const sketch = await this.sketchServiceClient.currentSketch();
        if (!sketch) {
            return;
        }
        let shouldAutoConnect = false;
        const monitorConfig = this.monitorConnection.monitorConfig;
        if (monitorConfig) {
            await this.monitorConnection.disconnect();
            if (this.monitorConnection.autoConnect) {
                shouldAutoConnect = true;
            }
            this.monitorConnection.autoConnect = false;
        }
        try {
            const { boardsConfig } = this.boardsServiceClientImpl;
            const [fqbn, { selectedProgrammer }, verify, verbose, sourceOverride] = await Promise.all([
                this.boardsDataStore.appendConfigToFqbn(boardsConfig.selectedBoard?.fqbn),
                this.boardsDataStore.getData(boardsConfig.selectedBoard?.fqbn),
                this.preferences.get('arduino.upload.verify'),
                this.preferences.get('arduino.upload.verbose'),
                this.sourceOverride()
            ]);

            let options: CoreService.Upload.Options | undefined = undefined;
            const sketchUri = sketch.uri;
            const optimizeForDebug = this.editorMode.compileForDebug;
            const { selectedPort } = boardsConfig;
            const port = selectedPort?.address;

            if (usingProgrammer) {
                const programmer = selectedProgrammer;
                options = {
                    sketchUri,
                    fqbn,
                    optimizeForDebug,
                    programmer,
                    port,
                    verbose,
                    verify,
                    sourceOverride
                };
            } else {
                options = {
                    sketchUri,
                    fqbn,
                    optimizeForDebug,
                    port,
                    verbose,
                    verify,
                    sourceOverride
                };
            }
            this.outputChannelManager.getChannel('Arduino').clear();
            if (usingProgrammer) {
                await this.coreService.uploadUsingProgrammer(options);
            } else {
                await this.coreService.upload(options);
            }
            this.messageService.info('Done uploading.', { timeout: 1000 });
        } catch (e) {
            this.messageService.error(e.toString());
        } finally {
            if (monitorConfig) {
                const { board, port } = monitorConfig;
                try {
                    await this.boardsServiceClientImpl.waitUntilAvailable(Object.assign(board, { port }), 10_000);
                    if (shouldAutoConnect) {
                        // Enabling auto-connect will trigger a connect.
                        this.monitorConnection.autoConnect = true;
                    } else {
                        await this.monitorConnection.connect(monitorConfig);
                    }
                } catch (waitError) {
                    this.messageService.error(`Could not reconnect to serial monitor. ${waitError.toString()}`);
                }
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
