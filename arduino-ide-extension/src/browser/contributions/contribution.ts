import { ClipboardService } from '@theia/core/lib/browser/clipboard-service';
import {
  FrontendApplication,
  FrontendApplicationContribution,
} from '@theia/core/lib/browser/frontend-application';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import {
  KeybindingContribution,
  KeybindingRegistry,
} from '@theia/core/lib/browser/keybinding';
import { LabelProvider } from '@theia/core/lib/browser/label-provider';
import { OpenerService, open } from '@theia/core/lib/browser/opener-service';
import { Saveable } from '@theia/core/lib/browser/saveable';
import { ApplicationShell } from '@theia/core/lib/browser/shell/application-shell';
import {
  TabBarToolbarContribution,
  TabBarToolbarRegistry,
} from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { CancellationToken } from '@theia/core/lib/common/cancellation';
import {
  Command,
  CommandContribution,
  CommandRegistry,
  CommandService,
} from '@theia/core/lib/common/command';
import {
  Disposable,
  DisposableCollection,
} from '@theia/core/lib/common/disposable';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { ILogger } from '@theia/core/lib/common/logger';
import {
  MenuContribution,
  MenuModelRegistry,
} from '@theia/core/lib/common/menu';
import { MessageService } from '@theia/core/lib/common/message-service';
import { MessageType } from '@theia/core/lib/common/message-service-protocol';
import { nls } from '@theia/core/lib/common/nls';
import { MaybePromise, isObject } from '@theia/core/lib/common/types';
import URI from '@theia/core/lib/common/uri';
import {
  inject,
  injectable,
  interfaces,
  postConstruct,
} from '@theia/core/shared/inversify';
import { EditorManager } from '@theia/editor/lib/browser/editor-manager';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { NotificationManager } from '@theia/messages/lib/browser/notifications-manager';
import { OutputChannelSeverity } from '@theia/output/lib/browser/output-channel';
import { MainMenuManager } from '../../common/main-menu-manager';
import { userAbort } from '../../common/nls';
import {
  CoreError,
  CoreService,
  FileSystemExt,
  ResponseServiceClient,
  Sketch,
  SketchesService,
} from '../../common/protocol';
import {
  ExecuteWithProgress,
  UserAbortApplicationError,
} from '../../common/protocol/progressible';
import { ArduinoPreferences } from '../arduino-preferences';
import { BoardsDataStore } from '../boards/boards-data-store';
import { BoardsServiceProvider } from '../boards/boards-service-provider';
import { ConfigServiceClient } from '../config/config-service-client';
import { DialogService } from '../dialog-service';
import { SettingsService } from '../dialogs/settings/settings';
import {
  CurrentSketch,
  SketchesServiceClientImpl,
} from '../sketches-service-client-impl';
import { ApplicationConnectionStatusContribution } from '../theia/core/connection-status-service';
import { OutputChannelManager } from '../theia/output/output-channel';
import { WorkspaceService } from '../theia/workspace/workspace-service';

export {
  Command,
  CommandRegistry,
  KeybindingRegistry,
  MenuModelRegistry,
  Sketch,
  TabBarToolbarRegistry,
  URI,
  open,
};

@injectable()
export abstract class Contribution
  implements
  CommandContribution,
  MenuContribution,
  KeybindingContribution,
  TabBarToolbarContribution,
  FrontendApplicationContribution {
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

  @inject(DialogService)
  protected readonly dialogService: DialogService;

  @postConstruct()
  protected init(): void {
    this.appStateService.reachedState('ready').then(() => this.onReady());
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function, unused-imports/no-unused-vars
  onStart(app: FrontendApplication): MaybePromise<void> { }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function, unused-imports/no-unused-vars
  registerCommands(registry: CommandRegistry): void { }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function, unused-imports/no-unused-vars
  registerMenus(registry: MenuModelRegistry): void { }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function, unused-imports/no-unused-vars
  registerKeybindings(registry: KeybindingRegistry): void { }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function, unused-imports/no-unused-vars
  registerToolbarItems(registry: TabBarToolbarRegistry): void { }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onReady(): MaybePromise<void> { }
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

  @inject(ApplicationConnectionStatusContribution)
  protected readonly connectionStatusService: ApplicationConnectionStatusContribution;

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
    // 获取配置服务中的错误信息
    const errors = this.configService.tryGetMessages();
    // 尝试获取 Sketch 目录的 URI
    let defaultUri = this.configService.tryGetSketchDirUri();
    if (!defaultUri || errors?.length) {
      // 如果默认 URI 未定义或者存在 CLI 配置错误，则回退到用户主目录
      defaultUri = new URI(await this.envVariableServer.getHomeDirUri());
    }
    return defaultUri;
  }

  /**
   * 获取默认路径。
   * 先调用 defaultUri 方法获取默认的 URI，然后将其转换为文件系统路径并返回。
   */
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

  @inject(ApplicationShell)
  private readonly shell: ApplicationShell;

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
    if (isObject(error) && UserAbortApplicationError.is(error)) {
      this.outputChannelManager
        .getChannel('Arduino')
        .appendLine(userAbort, OutputChannelSeverity.Warning);
      return;
    }
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
      } catch { }
    }
    if (message) {
      if (message.includes('Missing FQBN (Fully Qualified Board Name)')) {
        message = '没有选择板。请从代码页面中选择Lingzhi板';
      }
      const copyAction = nls.localize(
        'arduino/coreContribution/copyError',
        '复制错误信息'
      );
      this.visibleNotificationId = this.notificationId(message, copyAction);
      // this.messageService.error(message, copyAction).then(async (action) => {
      //   if (action === copyAction) {
      //     const content = await this.outputChannelManager.contentOfChannel(
      //       'Arduino'
      //     );
      //     if (content) {
      //       this.clipboardService.writeText(content);
      //     }
      //   }
      // });
      message = message.includes(
        "Cannot read properties of undefined (reading 'board')"
      )
        ? '无法读取未定义的属性（读取‘板子’）'
        : message;
      // const chunk = `${message}\n`;
      // this.responseService.appendToOutput({ chunk });
    } else {
      throw error;
    }
  }

  protected async doWithProgress<T>(options: {
    progressText: string;
    keepOutput?: boolean;
    task: (
      progressId: string,
      coreService: CoreService,
      cancellationToken?: CancellationToken
    ) => Promise<T>;
    // false by default
    cancelable?: boolean;
  }): Promise<T> {
    const toDisposeOnComplete = new DisposableCollection(
      this.maybeActivateMonitorWidget()
    );
    const { progressText, keepOutput, task } = options;
    this.outputChannelManager
      .getChannel('Arduino')
      .show({ preserveFocus: true });
    const result = await ExecuteWithProgress.doWithProgress({
      messageService: this.messageService,
      responseService: this.responseService,
      progressText,
      run: ({ progressId, cancellationToken }) =>
        task(progressId, this.coreService, cancellationToken),
      keepOutput,
      cancelable: options.cancelable,
    });
    toDisposeOnComplete.dispose();
    return result;
  }

  // TODO: cleanup!
  // this dependency does not belong here
  // support core command contribution handlers, the monitor-widget should implement it and register itself as a handler
  // the monitor widget should reveal itself after a successful core command execution
  private maybeActivateMonitorWidget(): Disposable {
    const currentWidget = this.shell.bottomPanel.currentTitle?.owner;
    if (currentWidget?.id === 'serial-monitor') {
      return Disposable.create(() =>
        this.shell.bottomPanel.activateWidget(currentWidget)
      );
    }
    return Disposable.NULL;
  }

  private notificationId(message: string, ...actions: string[]): string {
    return this.notificationManager['getMessageId']({
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
