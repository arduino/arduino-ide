import * as remote from '@theia/core/electron-shared/@electron/remote';
import { injectable, inject, named } from '@theia/core/shared/inversify';
import URI from '@theia/core/lib/common/uri';
import { EditorWidget } from '@theia/editor/lib/browser';
import { ApplicationServer } from '@theia/core/lib/common/application-protocol';
import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { FocusTracker, Widget } from '@theia/core/lib/browser';
import {
  DEFAULT_WINDOW_HASH,
  NewWindowOptions,
} from '@theia/core/lib/common/window';
import {
  WorkspaceInput,
  WorkspaceService as TheiaWorkspaceService,
} from '@theia/workspace/lib/browser/workspace-service';
import {
  SketchesService,
  Sketch,
} from '../../../common/protocol/sketches-service';
import { FileStat } from '@theia/filesystem/lib/common/files';
import {
  StartupTask,
  StartupTaskProvider,
} from '../../../electron-common/startup-task';
import { WindowServiceExt } from '../core/window-service-ext';
import { ContributionProvider } from '@theia/core/lib/common/contribution-provider';

@injectable()
export class WorkspaceService extends TheiaWorkspaceService {
  @inject(SketchesService)
  private readonly sketchService: SketchesService;
  @inject(ApplicationServer)
  private readonly applicationServer: ApplicationServer;
  @inject(WindowServiceExt)
  private readonly windowServiceExt: WindowServiceExt;
  @inject(ContributionProvider)
  @named(StartupTaskProvider)
  private readonly providers: ContributionProvider<StartupTaskProvider>;

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

  protected override async toFileStat(
    uri: string | URI | undefined
  ): Promise<FileStat | undefined> {
    const stat = await super.toFileStat(uri);
    if (!stat) {
      const newSketchUri = await this.sketchService.createNewSketch();
      return this.toFileStat(newSketchUri.uri);
    }
    return stat;
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
      // ### The error or missing sketch handling is done in the customized `toFileStat`.
      return workspaceUri.toString();
    } else {
      // Else, ask the server for its suggested workspace (usually the one
      // specified on the CLI, or the most recent).
      // ### Customization! the default workspace server will create a new sketch and will return with its URI if no recent workspaces are available.
      return this.server.getMostRecentlyUsedWorkspace();
    }
  }

  /**
   * Copied from Theia as-is to be able to pass the original `options` down.
   */
  protected override async doOpen(
    uri: URI,
    options?: WorkspaceInput
  ): Promise<URI | undefined> {
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
      this.openWindow(stat, Object.assign(options ?? {}, { preserveWindow })); // Unlike Theia, IDE2 passes the whole `input` downstream and not only { preserveWindow }
      return;
    }
    throw new Error(
      'Invalid workspace root URI. Expected an existing directory or workspace file.'
    );
  }

  /**
   * Copied from Theia. Can pass the `options` further down the chain.
   */
  protected override openWindow(uri: FileStat, options?: WorkspaceInput): void {
    const workspacePath = uri.resource.path.toString();
    if (this.shouldPreserveWindow(options)) {
      this.reloadWindow(options); // Unlike Theia, IDE2 passes the `input` downstream.
    } else {
      try {
        this.openNewWindow(workspacePath, options); // Unlike Theia, IDE2 passes the `input` downstream.
      } catch (error) {
        // Fall back to reloading the current window in case the browser has blocked the new window
        this._workspace = uri;
        this.logger.error(error.toString()).then(() => this.reloadWindow());
      }
    }
  }

  protected override reloadWindow(options?: WorkspaceInput): void {
    const tasks = this.tasks(options);
    this.setURLFragment(this._workspace?.resource.path.toString() || '');
    this.windowServiceExt.reload({ tasks });
  }

  protected override openNewWindow(
    workspacePath: string,
    options?: WorkspaceInput
  ): void {
    const tasks = this.tasks(options);
    const url = new URL(window.location.href);
    url.hash = encodeURI(workspacePath);
    this.windowService.openNewWindow(
      url.toString(),
      Object.assign({} as NewWindowOptions, { tasks })
    );
  }

  private tasks(options?: WorkspaceInput): StartupTask[] {
    const tasks = this.providers
      .getContributions()
      .map((contribution) => contribution.tasks())
      .reduce((prev, curr) => prev.concat(curr), []);
    if (StartupTask.has(options)) {
      tasks.push(...options.tasks);
    }
    return tasks;
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
