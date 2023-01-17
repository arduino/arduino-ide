import {
  inject,
  injectable,
  interfaces,
  postConstruct,
} from '@theia/core/shared/inversify';
import URI from '@theia/core/lib/common/uri';
import { ILogger } from '@theia/core/lib/common/logger';
import { Saveable } from '@theia/core/lib/browser/saveable';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { MaybePromise } from '@theia/core/lib/common/types';
import { LabelProvider } from '@theia/core/lib/browser/label-provider';
import { EditorManager } from '@theia/editor/lib/browser/editor-manager';
import { MessageService } from '@theia/core/lib/common/message-service';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { open, OpenerService } from '@theia/core/lib/browser/opener-service';

import {
  MenuModelRegistry,
  MenuContribution,
} from '@theia/core/lib/common/menu';
import {
  KeybindingRegistry,
  KeybindingContribution,
} from '@theia/core/lib/browser/keybinding';
import {
  TabBarToolbarContribution,
  TabBarToolbarRegistry,
} from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import {
  FrontendApplicationContribution,
  FrontendApplication,
} from '@theia/core/lib/browser/frontend-application';
import {
  Command,
  CommandRegistry,
  CommandContribution,
  CommandService,
} from '@theia/core/lib/common/command';
import { SettingsService } from '../dialogs/settings/settings';
import {
  CurrentSketch,
  SketchesServiceClientImpl,
} from '../sketches-service-client-impl';
import {
  SketchesService,
  FileSystemExt,
  Sketch,
  CoreService,
  CoreError,
  ResponseServiceClient,
} from '../../common/protocol';
import { ArduinoPreferences } from '../arduino-preferences';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import { nls } from '@theia/core';
import { OutputChannelManager } from '../theia/output/output-channel';
import { ClipboardService } from '@theia/core/lib/browser/clipboard-service';
import { ExecuteWithProgress } from '../../common/protocol/progressible';
import { BoardsServiceProvider } from '../boards/boards-service-provider';
import { BoardsDataStore } from '../boards/boards-data-store';
import { NotificationManager } from '../theia/messages/notifications-manager';
import { MessageType } from '@theia/core/lib/common/message-service-protocol';
import { WorkspaceService } from '../theia/workspace/workspace-service';
import { MainMenuManager } from '../../common/main-menu-manager';
import { ConfigServiceClient } from '../config/config-service-client';

export {
  Command,
  CommandRegistry,
  MenuModelRegistry,
  KeybindingRegistry,
  TabBarToolbarRegistry,
  URI,
  Sketch,
  open,
};

@injectable()
export abstract class Contribution
  implements
    CommandContribution,
    MenuContribution,
    KeybindingContribution,
    TabBarToolbarContribution,
    FrontendApplicationContribution
{
  @inject(ILogger)
  protected readonly logger: ILogger;

  @inject(MessageService)
  protected readonly messageService: MessageService;

  @inject(CommandService)
  protected readonly commandService: CommandService;

  @inject(WorkspaceService)
  protected readonly workspaceService: WorkspaceService;

  @inject(LabelProvider)
  protected readonly labelProvider: LabelProvider;

  @inject(SettingsService)
  protected readonly settingsService: SettingsService;

  @inject(ArduinoPreferences)
  protected readonly preferences: ArduinoPreferences;

  @inject(FrontendApplicationStateService)
  protected readonly appStateService: FrontendApplicationStateService;

  @inject(MainMenuManager)
  protected readonly menuManager: MainMenuManager;

  @postConstruct()
  protected init(): void {
    this.appStateService.reachedState('ready').then(() => this.onReady());
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function, unused-imports/no-unused-vars
  onStart(app: FrontendApplication): MaybePromise<void> {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function, unused-imports/no-unused-vars
  registerCommands(registry: CommandRegistry): void {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function, unused-imports/no-unused-vars
  registerMenus(registry: MenuModelRegistry): void {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function, unused-imports/no-unused-vars
  registerKeybindings(registry: KeybindingRegistry): void {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function, unused-imports/no-unused-vars
  registerToolbarItems(registry: TabBarToolbarRegistry): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onReady(): MaybePromise<void> {}
}

@injectable()
export abstract class SketchContribution extends Contribution {
  @inject(FileService)
  protected readonly fileService: FileService;

  @inject(FileSystemExt)
  protected readonly fileSystemExt: FileSystemExt;

  @inject(ConfigServiceClient)
  protected readonly configService: ConfigServiceClient;

  @inject(SketchesService)
  protected readonly sketchesService: SketchesService;

  @inject(OpenerService)
  protected readonly openerService: OpenerService;

  @inject(SketchesServiceClientImpl)
  protected readonly sketchServiceClient: SketchesServiceClientImpl;

  @inject(EditorManager)
  protected readonly editorManager: EditorManager;

  @inject(OutputChannelManager)
  protected readonly outputChannelManager: OutputChannelManager;

  @inject(EnvVariablesServer)
  protected readonly envVariableServer: EnvVariablesServer;

  protected async sourceOverride(): Promise<Record<string, string>> {
    const override: Record<string, string> = {};
    const sketch = await this.sketchServiceClient.currentSketch();
    if (CurrentSketch.isValid(sketch)) {
      for (const editor of this.editorManager.all) {
        const uri = editor.editor.uri;
        if (Saveable.isDirty(editor) && Sketch.isInSketch(uri, sketch)) {
          override[uri.toString()] = editor.editor.document.getText();
        }
      }
    }
    return override;
  }

  /**
   * Defaults to `directories.user` if defined and not CLI config errors were detected.
   * Otherwise, the URI of the user home directory.
   */
  protected async defaultUri(): Promise<URI> {
    const errors = this.configService.tryGetMessages();
    let defaultUri = this.configService.tryGetSketchDirUri();
    if (!defaultUri || errors?.length) {
      // Fall back to user home when the `directories.user` is not available or there are known CLI config errors
      defaultUri = new URI(await this.envVariableServer.getHomeDirUri());
    }
    return defaultUri;
  }

  protected async defaultPath(): Promise<string> {
    const defaultUri = await this.defaultUri();
    return this.fileService.fsPath(defaultUri);
  }
}

@injectable()
export abstract class CoreServiceContribution extends SketchContribution {
  @inject(BoardsDataStore)
  protected readonly boardsDataStore: BoardsDataStore;

  @inject(BoardsServiceProvider)
  protected readonly boardsServiceProvider: BoardsServiceProvider;

  @inject(CoreService)
  private readonly coreService: CoreService;

  @inject(ClipboardService)
  private readonly clipboardService: ClipboardService;

  @inject(ResponseServiceClient)
  private readonly responseService: ResponseServiceClient;

  @inject(NotificationManager)
  private readonly notificationManager: NotificationManager;

  /**
   * This is the internal (Theia) ID of the notification that is currently visible.
   * It's stored here as a field to be able to close it before executing any new core command (such as verify, upload, etc.)
   */
  private visibleNotificationId: string | undefined;

  protected clearVisibleNotification(): void {
    if (this.visibleNotificationId) {
      this.notificationManager.clear(this.visibleNotificationId);
      this.visibleNotificationId = undefined;
    }
  }

  protected handleError(error: unknown): void {
    this.tryToastErrorMessage(error);
  }

  private tryToastErrorMessage(error: unknown): void {
    let message: undefined | string = undefined;
    if (CoreError.is(error)) {
      message = error.message;
    } else if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    } else {
      try {
        message = JSON.stringify(error);
      } catch {}
    }
    if (message) {
      if (message.includes('Missing FQBN (Fully Qualified Board Name)')) {
        message = nls.localize(
          'arduino/coreContribution/noBoardSelected',
          'No board selected. Please select your Arduino board from the Tools > Board menu.'
        );
      }
      const copyAction = nls.localize(
        'arduino/coreContribution/copyError',
        'Copy error messages'
      );
      this.visibleNotificationId = this.notificationId(message, copyAction);
      this.messageService.error(message, copyAction).then(async (action) => {
        if (action === copyAction) {
          const content = await this.outputChannelManager.contentOfChannel(
            'Arduino'
          );
          if (content) {
            this.clipboardService.writeText(content);
          }
        }
      });
    } else {
      throw error;
    }
  }

  protected async doWithProgress<T>(options: {
    progressText: string;
    keepOutput?: boolean;
    task: (progressId: string, coreService: CoreService) => Promise<T>;
  }): Promise<T> {
    const { progressText, keepOutput, task } = options;
    this.outputChannelManager
      .getChannel('Arduino')
      .show({ preserveFocus: true });
    const result = await ExecuteWithProgress.doWithProgress({
      messageService: this.messageService,
      responseService: this.responseService,
      progressText,
      run: ({ progressId }) => task(progressId, this.coreService),
      keepOutput,
    });
    return result;
  }

  private notificationId(message: string, ...actions: string[]): string {
    return this.notificationManager.getMessageId({
      text: message,
      actions,
      type: MessageType.Error,
    });
  }
}

export namespace Contribution {
  export function configure(
    bind: interfaces.Bind,
    serviceIdentifier: typeof Contribution
  ): void {
    bind(serviceIdentifier).toSelf().inSingletonScope();
    bind(CommandContribution).toService(serviceIdentifier);
    bind(MenuContribution).toService(serviceIdentifier);
    bind(KeybindingContribution).toService(serviceIdentifier);
    bind(TabBarToolbarContribution).toService(serviceIdentifier);
    bind(FrontendApplicationContribution).toService(serviceIdentifier);
  }
}
