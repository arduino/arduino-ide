import { inject, injectable } from 'inversify';
import { Emitter } from '@theia/core/lib/common/event';
import { CoreService } from '../../common/protocol';
import { ArduinoMenus } from '../menu/arduino-menus';
import { ArduinoToolbar } from '../toolbar/arduino-toolbar';
import { BoardsDataStore } from '../boards/boards-data-store';
import { SerialConnectionManager } from '../monitor/monitor-connection';
import { BoardsServiceProvider } from '../boards/boards-service-provider';
import {
  SketchContribution,
  Command,
  CommandRegistry,
  MenuModelRegistry,
  KeybindingRegistry,
  TabBarToolbarRegistry,
} from './contribution';
import { nls } from '@theia/core/lib/browser/nls';

@injectable()
export class UploadSketch extends SketchContribution {
  @inject(CoreService)
  protected readonly coreService: CoreService;

  @inject(SerialConnectionManager)
  protected readonly monitorConnection: SerialConnectionManager;

  @inject(BoardsDataStore)
  protected readonly boardsDataStore: BoardsDataStore;

  @inject(BoardsServiceProvider)
  protected readonly boardsServiceClientImpl: BoardsServiceProvider;

  protected readonly onDidChangeEmitter = new Emitter<Readonly<void>>();
  readonly onDidChange = this.onDidChangeEmitter.event;

  protected uploadInProgress = false;

  registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(UploadSketch.Commands.UPLOAD_SKETCH, {
      execute: () => this.uploadSketch(),
      isEnabled: () => !this.uploadInProgress,
    });
    registry.registerCommand(
      UploadSketch.Commands.UPLOAD_SKETCH_USING_PROGRAMMER,
      {
        execute: () => this.uploadSketch(true),
        isEnabled: () => !this.uploadInProgress,
      }
    );
    registry.registerCommand(UploadSketch.Commands.UPLOAD_SKETCH_TOOLBAR, {
      isVisible: (widget) =>
        ArduinoToolbar.is(widget) && widget.side === 'left',
      isEnabled: () => !this.uploadInProgress,
      isToggled: () => this.uploadInProgress,
      execute: () =>
        registry.executeCommand(UploadSketch.Commands.UPLOAD_SKETCH.id),
    });
  }

  registerMenus(registry: MenuModelRegistry): void {
    registry.registerMenuAction(ArduinoMenus.SKETCH__MAIN_GROUP, {
      commandId: UploadSketch.Commands.UPLOAD_SKETCH.id,
      label: nls.localize('arduino/sketch/upload', 'Upload'),
      order: '1',
    });
    registry.registerMenuAction(ArduinoMenus.SKETCH__MAIN_GROUP, {
      commandId: UploadSketch.Commands.UPLOAD_SKETCH_USING_PROGRAMMER.id,
      label: nls.localize(
        'arduino/sketch/uploadUsingProgrammer',
        'Upload Using Programmer'
      ),
      order: '2',
    });
  }

  registerKeybindings(registry: KeybindingRegistry): void {
    registry.registerKeybinding({
      command: UploadSketch.Commands.UPLOAD_SKETCH.id,
      keybinding: 'CtrlCmd+U',
    });
    registry.registerKeybinding({
      command: UploadSketch.Commands.UPLOAD_SKETCH_USING_PROGRAMMER.id,
      keybinding: 'CtrlCmd+Shift+U',
    });
  }

  registerToolbarItems(registry: TabBarToolbarRegistry): void {
    registry.registerItem({
      id: UploadSketch.Commands.UPLOAD_SKETCH_TOOLBAR.id,
      command: UploadSketch.Commands.UPLOAD_SKETCH_TOOLBAR.id,
      tooltip: nls.localize('arduino/sketch/upload', 'Upload'),
      priority: 1,
      onDidChange: this.onDidChange,
    });
  }

  async uploadSketch(usingProgrammer = false): Promise<void> {
    // even with buttons disabled, better to double check if an upload is already in progress
    if (this.uploadInProgress) {
      return;
    }

    // toggle the toolbar button and menu item state.
    // uploadInProgress will be set to false whether the upload fails or not
    this.uploadInProgress = true;
    this.onDidChangeEmitter.fire();
    const sketch = await this.sketchServiceClient.currentSketch();
    if (!sketch) {
      return;
    }
    await this.monitorConnection.disconnect();
    try {
      const { boardsConfig } = this.boardsServiceClientImpl;
      const [fqbn, { selectedProgrammer }, verify, verbose, sourceOverride] =
        await Promise.all([
          this.boardsDataStore.appendConfigToFqbn(
            boardsConfig.selectedBoard?.fqbn
          ),
          this.boardsDataStore.getData(boardsConfig.selectedBoard?.fqbn),
          this.preferences.get('arduino.upload.verify'),
          this.preferences.get('arduino.upload.verbose'),
          this.sourceOverride(),
        ]);

      let options: CoreService.Upload.Options | undefined = undefined;
      const sketchUri = sketch.uri;
      const optimizeForDebug = this.editorMode.compileForDebug;
      const { selectedPort } = boardsConfig;
      const port = selectedPort;

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
          sourceOverride,
        };
      } else {
        options = {
          sketchUri,
          fqbn,
          optimizeForDebug,
          port,
          verbose,
          verify,
          sourceOverride,
        };
      }
      this.outputChannelManager.getChannel('Arduino').clear();
      if (usingProgrammer) {
        await this.coreService.uploadUsingProgrammer(options);
      } else {
        await this.coreService.upload(options);
      }
      this.messageService.info(
        nls.localize('arduino/sketch/doneUploading', 'Done uploading.'),
        { timeout: 3000 }
      );
    } catch (e) {
      this.messageService.error(e.toString());
    } finally {
      this.uploadInProgress = false;
      this.onDidChangeEmitter.fire();

      if (
        this.monitorConnection.isSerialOpen() &&
        this.monitorConnection.monitorConfig
      ) {
        const { board, port } = this.monitorConnection.monitorConfig;
        try {
          await this.boardsServiceClientImpl.waitUntilAvailable(
            Object.assign(board, { port }),
            10_000
          );
          await this.monitorConnection.connect();
        } catch (waitError) {
          this.messageService.error(
            nls.localize(
              'arduino/sketch/couldNotConnectToMonitor',
              'Could not reconnect to serial monitor. {0}',
              waitError.toString()
            )
          );
        }
      }
    }
  }
}

export namespace UploadSketch {
  export namespace Commands {
    export const UPLOAD_SKETCH: Command = {
      id: 'arduino-upload-sketch',
    };
    export const UPLOAD_SKETCH_USING_PROGRAMMER: Command = {
      id: 'arduino-upload-sketch-using-programmer',
    };
    export const UPLOAD_SKETCH_TOOLBAR: Command = {
      id: 'arduino-upload-sketch--toolbar',
    };
  }
}
