import * as remote from '@theia/core/electron-shared/@electron/remote';
import { injectable, inject } from '@theia/core/shared/inversify';
import URI from '@theia/core/lib/common/uri';
import { EditorWidget } from '@theia/editor/lib/browser';
import { LabelProvider } from '@theia/core/lib/browser/label-provider';
import { MessageService } from '@theia/core/lib/common/message-service';
import { ApplicationServer } from '@theia/core/lib/common/application-protocol';
import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { FocusTracker, Widget } from '@theia/core/lib/browser';
import { DEFAULT_WINDOW_HASH } from '@theia/core/lib/common/window';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import {
  WorkspaceInput,
  WorkspaceService as TheiaWorkspaceService,
} from '@theia/workspace/lib/browser/workspace-service';
import { ConfigService } from '../../../common/protocol/config-service';
import {
  SketchesService,
  Sketch,
} from '../../../common/protocol/sketches-service';
import { BoardsServiceProvider } from '../../boards/boards-service-provider';
import { BoardsConfig } from '../../boards/boards-config';
import { Command } from '@theia/core';

interface WorkspaceOptions extends WorkspaceInput {
  commands: Command[];
}

@injectable()
export class WorkspaceService extends TheiaWorkspaceService {
  @inject(SketchesService)
  protected readonly sketchService: SketchesService;

  @inject(ConfigService)
  protected readonly configService: ConfigService;

  @inject(LabelProvider)
  protected override readonly labelProvider: LabelProvider;

  @inject(MessageService)
  protected override readonly messageService: MessageService;

  @inject(ApplicationServer)
  protected readonly applicationServer: ApplicationServer;

  @inject(FrontendApplicationStateService)
  protected readonly appStateService: FrontendApplicationStateService;

  @inject(BoardsServiceProvider)
  protected readonly boardsServiceProvider: BoardsServiceProvider;

  private version?: string;

  async onStart(application: FrontendApplication): Promise<void> {
    const info = await this.applicationServer.getApplicationInfo();
    this.version = info?.version;
    application.shell.onDidChangeCurrentWidget(
      this.onCurrentWidgetChange.bind(this)
    );
    const newValue = application.shell.currentWidget
      ? application.shell.currentWidget
      : null;
    this.onCurrentWidgetChange({ newValue, oldValue: null });
  }

  // Was copied from the Theia implementation.
  // Unlike the default behavior, IDE2 does not check the existence of the workspace before open.
  protected override async doGetDefaultWorkspaceUri(): Promise<
    string | undefined
  > {
    // If an empty window is explicitly requested do not restore a previous workspace.
    // Note: `window.location.hash` includes leading "#" if non-empty.
    if (window.location.hash === `#${DEFAULT_WINDOW_HASH}`) {
      window.location.hash = '';
      return undefined;
    }

    // Prefer the workspace path specified as the URL fragment, if present.
    if (window.location.hash.length > 1) {
      // Remove the leading # and decode the URI.
      const wpPath = decodeURI(window.location.hash.substring(1));
      const workspaceUri = new URI().withPath(wpPath).withScheme('file');
      // ### Customization! Here, we do no check if the workspace exists.
      return workspaceUri.toString();
    } else {
      // Else, ask the server for its suggested workspace (usually the one
      // specified on the CLI, or the most recent).
      // ### Customization! the default workspace server will create a new sketch and will return with its URI if no recent workspaces are available.
      return this.server.getMostRecentlyUsedWorkspace();
    }
  }

  /*
    This method mostly duplicates super.doOpen and super.openWindow because they didn't let pass any custom
    option to openNewWindow
  */
  async openWithCommands(uri: URI, options?: WorkspaceOptions): Promise<void> {
    const stat = await this.toFileStat(uri);
    if (stat) {
      if (!stat.isDirectory && !this.isWorkspaceFile(stat)) {
        const message = `Not a valid workspace: ${uri.path.toString()}`;
        this.messageService.error(message);
        throw new Error(message);
      }
      // The same window has to be preserved too (instead of opening a new one), if the workspace root is not yet available and we are setting it for the first time.
      // Option passed as parameter has the highest priority (for api developers), then the preference, then the default.
      await this.roots;
      const { preserveWindow } = {
        preserveWindow:
          this.preferences['workspace.preserveWindow'] || !this.opened,
        ...options,
      };
      await this.server.setMostRecentlyUsedWorkspace(uri.toString());
      if (preserveWindow) {
        this._workspace = stat;
      }

      const workspacePath = stat.resource.path.toString();

      if (this.shouldPreserveWindow(options)) {
        this.reloadWindow();
      } else {
        try {
          this.openNewWindow(workspacePath, options);
          return;
        } catch (error) {
          // Fall back to reloading the current window in case the browser has blocked the new window
          this._workspace = stat;
          this.logger.error(error.toString()).then(() => this.reloadWindow());
        }
      }
    }
    throw new Error(
      'Invalid workspace root URI. Expected an existing directory or workspace file.'
    );
  }

  protected override openNewWindow(
    workspacePath: string,
    options?: WorkspaceOptions
  ): void {
    const { boardsConfig } = this.boardsServiceProvider;
    const url = BoardsConfig.Config.setConfig(
      boardsConfig,
      new URL(window.location.href)
    ); // Set the current boards config for the new browser window.
    url.hash = workspacePath;
    if (options?.commands) {
      url.searchParams.set(
        'commands',
        encodeURIComponent(JSON.stringify(options.commands))
      );
    }

    this.windowService.openNewWindow(url.toString());
  }

  protected onCurrentWidgetChange({
    newValue,
  }: FocusTracker.IChangedArgs<Widget>): void {
    if (newValue instanceof EditorWidget) {
      const { uri } = newValue.editor;
      const currentWindow = remote.getCurrentWindow();
      currentWindow.setRepresentedFilename(uri.path.toString());
      if (Sketch.isSketchFile(uri.toString())) {
        this.updateTitle();
      } else {
        const title = this.workspaceTitle;
        const fileName = this.labelProvider.getName(uri);
        document.title = this.formatTitle(
          title ? `${title} - ${fileName}` : fileName
        );
      }
    } else {
      this.updateTitle();
    }
  }

  protected override formatTitle(title?: string): string {
    const version = this.version ? ` ${this.version}` : '';
    const name = `${this.applicationName} ${version}`;
    return title ? `${title} | ${name}` : name;
  }

  protected get workspaceTitle(): string | undefined {
    if (this.workspace) {
      return this.labelProvider.getName(this.workspace.resource);
    }
  }
}
