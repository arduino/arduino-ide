import { inject, injectable } from '@theia/core/shared/inversify';
import { Emitter } from '@theia/core/lib/common/event';
import { BoardUserField, CoreService } from '../../common/protocol';
import { ArduinoMenus, PlaceholderMenuNode } from '../menu/arduino-menus';
import { ArduinoToolbar } from '../toolbar/arduino-toolbar';
import {
  Command,
  CommandRegistry,
  MenuModelRegistry,
  KeybindingRegistry,
  TabBarToolbarRegistry,
  CoreServiceContribution,
} from './contribution';
import { UserFieldsDialog } from '../dialogs/user-fields/user-fields-dialog';
import { DisposableCollection, nls } from '@theia/core/lib/common';
import { CurrentSketch } from '../../common/protocol/sketches-service-client-impl';
import type { VerifySketchParams } from './verify-sketch';

@injectable()
export class UploadSketch extends CoreServiceContribution {
  @inject(MenuModelRegistry)
  private readonly menuRegistry: MenuModelRegistry;

  @inject(UserFieldsDialog)
  private readonly userFieldsDialog: UserFieldsDialog;

  private boardRequiresUserFields = false;
  private readonly cachedUserFields: Map<string, BoardUserField[]> = new Map();
  private readonly menuActionsDisposables = new DisposableCollection();

  private readonly onDidChangeEmitter = new Emitter<void>();
  private readonly onDidChange = this.onDidChangeEmitter.event;
  private uploadInProgress = false;

  protected override init(): void {
    super.init();
    this.boardsServiceProvider.onBoardsConfigChanged(async () => {
      const userFields =
        await this.boardsServiceProvider.selectedBoardUserFields();
      this.boardRequiresUserFields = userFields.length > 0;
      this.registerMenus(this.menuRegistry);
    });
  }

  private selectedFqbnAddress(): string {
    const { boardsConfig } = this.boardsServiceProvider;
    const fqbn = boardsConfig.selectedBoard?.fqbn;
    if (!fqbn) {
      return '';
    }
    const address =
      boardsConfig.selectedBoard?.port?.address ||
      boardsConfig.selectedPort?.address;
    if (!address) {
      return '';
    }
    return fqbn + '|' + address;
  }

  override registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(UploadSketch.Commands.UPLOAD_SKETCH, {
      execute: async () => {
        const key = this.selectedFqbnAddress();
        if (!key) {
          return;
        }
        if (this.boardRequiresUserFields && !this.cachedUserFields.has(key)) {
          // Deep clone the array of board fields to avoid editing the cached ones
          this.userFieldsDialog.value = (
            await this.boardsServiceProvider.selectedBoardUserFields()
          ).map((f) => ({ ...f }));
          const result = await this.userFieldsDialog.open();
          if (!result) {
            return;
          }
          this.cachedUserFields.set(key, result);
        }
        this.uploadSketch();
      },
      isEnabled: () => !this.uploadInProgress,
    });
    registry.registerCommand(UploadSketch.Commands.UPLOAD_WITH_CONFIGURATION, {
      execute: async () => {
        const key = this.selectedFqbnAddress();
        if (!key) {
          return;
        }

        const cached = this.cachedUserFields.get(key);
        // Deep clone the array of board fields to avoid editing the cached ones
        this.userFieldsDialog.value = (
          cached ?? (await this.boardsServiceProvider.selectedBoardUserFields())
        ).map((f) => ({ ...f }));

        const result = await this.userFieldsDialog.open();
        if (!result) {
          return;
        }
        this.cachedUserFields.set(key, result);
        this.uploadSketch();
      },
      isEnabled: () => !this.uploadInProgress && this.boardRequiresUserFields,
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
    this.menuActionsDisposables.dispose();
    this.menuActionsDisposables.push(
      registry.registerMenuAction(ArduinoMenus.SKETCH__MAIN_GROUP, {
        commandId: UploadSketch.Commands.UPLOAD_SKETCH.id,
        label: nls.localize('arduino/sketch/upload', 'Upload'),
        order: '1',
      })
    );
    if (this.boardRequiresUserFields) {
      this.menuActionsDisposables.push(
        registry.registerMenuAction(ArduinoMenus.SKETCH__MAIN_GROUP, {
          commandId: UploadSketch.Commands.UPLOAD_WITH_CONFIGURATION.id,
          label: UploadSketch.Commands.UPLOAD_WITH_CONFIGURATION.label,
          order: '2',
        })
      );
    } else {
      this.menuActionsDisposables.push(
        registry.registerMenuNode(
          ArduinoMenus.SKETCH__MAIN_GROUP,
          new PlaceholderMenuNode(
            ArduinoMenus.SKETCH__MAIN_GROUP,
            // commandId: UploadSketch.Commands.UPLOAD_WITH_CONFIGURATION.id,
            UploadSketch.Commands.UPLOAD_WITH_CONFIGURATION.label,
            { order: '2' }
          )
        )
      );
    }
    this.menuActionsDisposables.push(
      registry.registerMenuAction(ArduinoMenus.SKETCH__MAIN_GROUP, {
        commandId: UploadSketch.Commands.UPLOAD_SKETCH_USING_PROGRAMMER.id,
        label: nls.localize(
          'arduino/sketch/uploadUsingProgrammer',
          'Upload Using Programmer'
        ),
        order: '3',
      })
    );
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

      // TODO: This does not belong here.
      // IDE2 should not do any preliminary checks but let the CLI fail and then toast a user consumable error message.
      if (
        uploadOptions.userFields.length === 0 &&
        this.boardRequiresUserFields
      ) {
        this.messageService.error(
          nls.localize(
            'arduino/sketch/userFieldsNotFoundError',
            "Can't find user fields for connected board"
          )
        );
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
      this.handleError(e);
    } finally {
      this.uploadInProgress = false;
      this.boardsServiceProvider.forcePostUploadReconnect();
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
    const userFields = this.userFields();
    const { boardsConfig } = this.boardsServiceProvider;
    const [fqbn, { selectedProgrammer: programmer }, verify, verbose] =
      await Promise.all([
        verifyOptions.fqbn, // already decorated FQBN
        this.boardsDataStore.getData(this.sanitizeFqbn(verifyOptions.fqbn)),
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

  private userFields() {
    return this.cachedUserFields.get(this.selectedFqbnAddress()) ?? [];
  }

  /**
   * Converts the `VENDOR:ARCHITECTURE:BOARD_ID[:MENU_ID=OPTION_ID[,MENU2_ID=OPTION_ID ...]]` FQBN to
   * `VENDOR:ARCHITECTURE:BOARD_ID` format.
   * See the details of the `{build.fqbn}` entry in the [specs](https://arduino.github.io/arduino-cli/latest/platform-specification/#global-predefined-properties).
   */
  private sanitizeFqbn(fqbn: string | undefined): string | undefined {
    if (!fqbn) {
      return undefined;
    }
    const [vendor, arch, id] = fqbn.split(':');
    return `${vendor}:${arch}:${id}`;
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
        'Configure And Upload'
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
