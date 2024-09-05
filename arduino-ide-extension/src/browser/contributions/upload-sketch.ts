import { Emitter } from '@theia/core/lib/common/event';
import { nls } from '@theia/core/lib/common/nls';
import { inject, injectable } from '@theia/core/shared/inversify';
import { FQBN } from 'fqbn';
import { CoreService } from '../../common/protocol';
import { ArduinoMenus } from '../menu/arduino-menus';
import { CurrentSketch } from '../sketches-service-client-impl';
import { ArduinoToolbar } from '../toolbar/arduino-toolbar';
import {
  Command,
  CommandRegistry,
  CoreServiceContribution,
  KeybindingRegistry,
  MenuModelRegistry,
  TabBarToolbarRegistry,
} from './contribution';
import { UserFields } from './user-fields';
import type { VerifySketchParams } from './verify-sketch';

@injectable()
export class UploadSketch extends CoreServiceContribution {
  @inject(UserFields)
  private readonly userFields: UserFields;

  private readonly onDidChangeEmitter = new Emitter<void>();
  private readonly onDidChange = this.onDidChangeEmitter.event;
  private uploadInProgress = false;

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

      const uploadResponse = await this.doWithProgress({
        progressText: nls.localize('arduino/sketch/uploading', 'Uploading...'),
        task: async (progressId, coreService, token) => {
          try {
            return await coreService.upload(
              { ...uploadOptions, progressId },
              token
            );
          } catch (err) {
            if (err.code === 4005) {
              const uploadWithProgrammerOptions = await this.uploadOptions(
                true,
                verifyOptions
              );
              if (uploadWithProgrammerOptions) {
                return coreService.upload(
                  { ...uploadWithProgrammerOptions, progressId },
                  token
                );
              }
            } else {
              throw err;
            }
          }
        },
        keepOutput: true,
        cancelable: true,
      });

      if (!uploadResponse) {
        return;
      }

      // the port update is NOOP if nothing has changed
      this.boardsServiceProvider.updateConfig(uploadResponse.portAfterUpload);

      this.messageService.info(
        nls.localize('arduino/sketch/doneUploading', 'Done uploading.'),
        { timeout: 3000 }
      );
    } catch (e) {
      this.userFields.notifyFailedWithError(e);
      this.handleError(e);
    } finally {
      // TODO: here comes the port change if happened during the upload
      // https://github.com/arduino/arduino-cli/issues/2245
      this.uploadInProgress = false;
      this.menuManager.update();
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
        this.boardsDataStore.getData(
          verifyOptions.fqbn
            ? new FQBN(verifyOptions.fqbn).toString(true)
            : undefined
        ),
        this.preferences.get('arduino.upload.verify'),
        this.preferences.get('arduino.upload.verbose'),
      ]);
    const port = boardsConfig.selectedPort;
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
