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
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
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
} from '../../common/protocol/sketches-service-client-impl';
import {
  SketchesService,
  ConfigService,
  FileSystemExt,
  Sketch,
  CoreService,
  CoreError,
} from '../../common/protocol';
import { ArduinoPreferences } from '../arduino-preferences';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import { CoreErrorHandler } from './core-error-handler';
import { nls } from '@theia/core';
import { OutputChannelManager } from '../theia/output/output-channel';
import { ClipboardService } from '@theia/core/lib/browser/clipboard-service';

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

  @inject(FrontendApplicationStateService)
  protected readonly appStateService: FrontendApplicationStateService;

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

  @inject(ConfigService)
  protected readonly configService: ConfigService;

  @inject(SketchesService)
  protected readonly sketchService: SketchesService;

  @inject(OpenerService)
  protected readonly openerService: OpenerService;

  @inject(SketchesServiceClientImpl)
  protected readonly sketchServiceClient: SketchesServiceClientImpl;

  @inject(ArduinoPreferences)
  protected readonly preferences: ArduinoPreferences;

  @inject(EditorManager)
  protected readonly editorManager: EditorManager;

  @inject(OutputChannelManager)
  protected readonly outputChannelManager: OutputChannelManager;

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
}

@injectable()
export class CoreServiceContribution extends SketchContribution {
  @inject(CoreService)
  protected readonly coreService: CoreService;

  @inject(CoreErrorHandler)
  protected readonly coreErrorHandler: CoreErrorHandler;

  @inject(ClipboardService)
  private readonly clipboardService: ClipboardService;

  protected handleError(error: unknown): void {
    this.coreErrorHandler.tryHandle(error);
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
      const copyAction = nls.localize(
        'arduino/coreContribution/copyError',
        'Copy error messages'
      );
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
