import { inject, injectable, postConstruct } from 'inversify';
import { Emitter } from '@theia/core/lib/common/event';
import { BoardUserField, CoreService } from '../../common/protocol';
import { ArduinoMenus, PlaceholderMenuNode } from '../menu/arduino-menus';
import { ArduinoToolbar } from '../toolbar/arduino-toolbar';
import { BoardsDataStore } from '../boards/boards-data-store';
import { BoardsServiceProvider } from '../boards/boards-service-provider';
import {
  SketchContribution,
  Command,
  CommandRegistry,
  MenuModelRegistry,
  KeybindingRegistry,
  TabBarToolbarRegistry,
} from './contribution';
import { UserFieldsDialog } from '../dialogs/user-fields/user-fields-dialog';
import { DisposableCollection, nls } from '@theia/core/lib/common';

@injectable()
export class UploadSketch extends SketchContribution {
  @inject(CoreService)
  protected readonly coreService: CoreService;

  @inject(MenuModelRegistry)
  protected readonly menuRegistry: MenuModelRegistry;

  @inject(BoardsDataStore)
  protected readonly boardsDataStore: BoardsDataStore;

  @inject(BoardsServiceProvider)
  protected readonly boardsServiceClientImpl: BoardsServiceProvider;

  @inject(UserFieldsDialog)
  protected readonly userFieldsDialog: UserFieldsDialog;

  protected cachedUserFields: Map<string, BoardUserField[]> = new Map();

  protected readonly onDidChangeEmitter = new Emitter<Readonly<void>>();
  readonly onDidChange = this.onDidChangeEmitter.event;

  protected uploadInProgress = false;
  protected boardRequiresUserFields = false;

  protected readonly menuActionsDisposables = new DisposableCollection();

  @postConstruct()
  protected init(): void {
    this.boardsServiceClientImpl.onBoardsConfigChanged(async () => {
      const userFields =
        await this.boardsServiceClientImpl.selectedBoardUserFields();
      this.boardRequiresUserFields = userFields.length > 0;
      this.registerMenus(this.menuRegistry);
    });
  }

  private selectedFqbnAddress(): string {
    const { boardsConfig } = this.boardsServiceClientImpl;
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

  registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(UploadSketch.Commands.UPLOAD_SKETCH, {
      execute: async () => {
        const key = this.selectedFqbnAddress();
        if (!key) {
          return;
        }
        if (this.boardRequiresUserFields && !this.cachedUserFields.has(key)) {
          // Deep clone the array of board fields to avoid editing the cached ones
          this.userFieldsDialog.value = (
            await this.boardsServiceClientImpl.selectedBoardUserFields()
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
          cached ??
          (await this.boardsServiceClientImpl.selectedBoardUserFields())
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

  registerMenus(registry: MenuModelRegistry): void {
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
            UploadSketch.Commands.UPLOAD_WITH_CONFIGURATION.label!,
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

      const board = {
        ...boardsConfig.selectedBoard,
        name: boardsConfig.selectedBoard?.name || '',
        fqbn,
      }
      let options: CoreService.Upload.Options | undefined = undefined;
      const sketchUri = sketch.uri;
      const optimizeForDebug = this.editorMode.compileForDebug;
      const { selectedPort } = boardsConfig;
      const port = selectedPort;
      const userFields =
        this.cachedUserFields.get(this.selectedFqbnAddress()) ?? [];
      if (userFields.length === 0 && this.boardRequiresUserFields) {
        this.messageService.error(
          nls.localize(
            'arduino/sketch/userFieldsNotFoundError',
            "Can't find user fields for connected board"
          )
        );
        return;
      }

      if (usingProgrammer) {
        const programmer = selectedProgrammer;
        options = {
          sketchUri,
          board,
          optimizeForDebug,
          programmer,
          port,
          verbose,
          verify,
          sourceOverride,
          userFields,
        };
      } else {
        options = {
          sketchUri,
          board,
          optimizeForDebug,
          port,
          verbose,
          verify,
          sourceOverride,
          userFields,
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
      let errorMessage = '';
      if (typeof e === 'string') {
        errorMessage = e;
      } else {
        errorMessage = e.toString();
      }
      this.messageService.error(errorMessage);
    } finally {
      this.uploadInProgress = false;
      this.onDidChangeEmitter.fire();
    }
  }
}

export namespace UploadSketch {
  export namespace Commands {
    export const UPLOAD_SKETCH: Command = {
      id: 'arduino-upload-sketch',
    };
    export const UPLOAD_WITH_CONFIGURATION: Command = {
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
