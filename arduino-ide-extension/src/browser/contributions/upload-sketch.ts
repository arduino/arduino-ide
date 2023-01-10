import { inject, injectable } from '@theia/core/shared/inversify';
import { Emitter } from '@theia/core/lib/common/event';
import { CoreService, Port, sanitizeFqbn } from '../../common/protocol';
import { ArduinoMenus } from '../menu/arduino-menus';
import { ArduinoToolbar } from '../toolbar/arduino-toolbar';
import {
  Command,
  CommandRegistry,
  MenuModelRegistry,
  KeybindingRegistry,
  TabBarToolbarRegistry,
  CoreServiceContribution,
} from './contribution';
import { deepClone, nls } from '@theia/core/lib/common';
import { CurrentSketch } from '../../common/protocol/sketches-service-client-impl';
import type { VerifySketchParams } from './verify-sketch';
import { UserFields } from './user-fields';

@injectable()
export class UploadSketch extends CoreServiceContribution {
  private readonly onDidChangeEmitter = new Emitter<void>();
  private readonly onDidChange = this.onDidChangeEmitter.event;
  private uploadInProgress = false;

  @inject(UserFields)
  private readonly userFields: UserFields;

  override registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(UploadSketch.Commands.UPLOAD_SKETCH, {
      execute: async () => {
        if (await this.userFields.checkUserFieldsDialog()) {
          this.uploadSketch();
        }
      },
      isEnabled: () => !this.uploadInProgress,
    });
    registry.registerCommand(UploadSketch.Commands.UPLOAD_WITH_CONFIGURATION, {
      execute: async () => {
        if (await this.userFields.checkUserFieldsDialog(true)) {
          this.uploadSketch();
        }
      },
      isEnabled: () => !this.uploadInProgress && this.userFields.isRequired(),
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

  override registerMenus(registry: MenuModelRegistry): void {
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
      order: '3',
    });
  }

  override registerKeybindings(registry: KeybindingRegistry): void {
    registry.registerKeybinding({
      command: UploadSketch.Commands.UPLOAD_SKETCH.id,
      keybinding: 'CtrlCmd+U',
    });
    registry.registerKeybinding({
      command: UploadSketch.Commands.UPLOAD_SKETCH_USING_PROGRAMMER.id,
      keybinding: 'CtrlCmd+Shift+U',
    });
  }

  override registerToolbarItems(registry: TabBarToolbarRegistry): void {
    registry.registerItem({
      id: UploadSketch.Commands.UPLOAD_SKETCH_TOOLBAR.id,
      command: UploadSketch.Commands.UPLOAD_SKETCH_TOOLBAR.id,
      tooltip: nls.localize('arduino/sketch/upload', 'Upload'),
      priority: 1,
      onDidChange: this.onDidChange,
    });
  }

  async uploadSketch(usingProgrammer = false): Promise<void> {
    if (this.uploadInProgress) {
      return;
    }

    try {
      // toggle the toolbar button and menu item state.
      // uploadInProgress will be set to false whether the upload fails or not
      this.uploadInProgress = true;
      this.menuManager.update();
      this.boardsServiceProvider.snapshotBoardDiscoveryOnUpload();
      this.onDidChangeEmitter.fire();
      this.clearVisibleNotification();

      const verifyOptions =
        await this.commandService.executeCommand<CoreService.Options.Compile>(
          'arduino-verify-sketch',
          <VerifySketchParams>{
            exportBinaries: false,
            silent: true,
          }
        );
      if (!verifyOptions) {
        return;
      }

      const uploadOptions = await this.uploadOptions(
        usingProgrammer,
        verifyOptions
      );
      if (!uploadOptions) {
        return;
      }

      if (!this.userFields.checkUserFieldsForUpload()) {
        return;
      }

      await this.doWithProgress({
        progressText: nls.localize('arduino/sketch/uploading', 'Uploading...'),
        task: (progressId, coreService) =>
          coreService.upload({ ...uploadOptions, progressId }),
        keepOutput: true,
      });

      this.messageService.info(
        nls.localize('arduino/sketch/doneUploading', 'Done uploading.'),
        { timeout: 3000 }
      );
    } catch (e) {
      this.userFields.notifyFailedWithError(e);
      this.handleError(e);
    } finally {
      this.uploadInProgress = false;
      this.menuManager.update();
      this.boardsServiceProvider.attemptPostUploadAutoSelect();
      this.onDidChangeEmitter.fire();
    }
  }

  private async uploadOptions(
    usingProgrammer: boolean,
    verifyOptions: CoreService.Options.Compile
  ): Promise<CoreService.Options.Upload | undefined> {
    const sketch = await this.sketchServiceClient.currentSketch();
    if (!CurrentSketch.isValid(sketch)) {
      return undefined;
    }
    const userFields = this.userFields.getUserFields();
    const { boardsConfig } = this.boardsServiceProvider;
    const [fqbn, { selectedProgrammer: programmer }, verify, verbose] =
      await Promise.all([
        verifyOptions.fqbn, // already decorated FQBN
        this.boardsDataStore.getData(sanitizeFqbn(verifyOptions.fqbn)),
        this.preferences.get('arduino.upload.verify'),
        this.preferences.get('arduino.upload.verbose'),
      ]);
    const port = this.maybeUpdatePortProperties(boardsConfig.selectedPort);
    return {
      sketch,
      fqbn,
      ...(usingProgrammer && { programmer }),
      port,
      verbose,
      verify,
      userFields,
    };
  }

  /**
   * This is a hack to ensure that the port object has the `properties` when uploading.(https://github.com/arduino/arduino-ide/issues/740)
   * This method works around a bug when restoring a `port` persisted by an older version of IDE2. See the bug [here](https://github.com/arduino/arduino-ide/pull/1335#issuecomment-1224355236).
   *
   * Before the upload, this method checks the available ports and makes sure that the `properties` of an available port, and the port selected by the user have the same `properties`.
   * This method does not update any state (for example, the `BoardsConfig.Config`) but uses the correct `properties` for the `upload`.
   */
  private maybeUpdatePortProperties(port: Port | undefined): Port | undefined {
    if (port) {
      const key = Port.keyOf(port);
      for (const candidate of this.boardsServiceProvider.availablePorts) {
        if (key === Port.keyOf(candidate) && candidate.properties) {
          return {
            ...port,
            properties: deepClone(candidate.properties),
          };
        }
      }
    }
    return port;
  }
}

export namespace UploadSketch {
  export namespace Commands {
    export const UPLOAD_SKETCH: Command = {
      id: 'arduino-upload-sketch',
    };
    export const UPLOAD_WITH_CONFIGURATION: Command & { label: string } = {
      id: 'arduino-upload-with-configuration-sketch',
      label: nls.localize(
        'arduino/sketch/configureAndUpload',
        'Configure and Upload'
      ),
      category: 'Arduino',
    };
    export const UPLOAD_SKETCH_USING_PROGRAMMER: Command = {
      id: 'arduino-upload-sketch-using-programmer',
    };
    export const UPLOAD_SKETCH_TOOLBAR: Command = {
      id: 'arduino-upload-sketch--toolbar',
    };
  }
}
