import { ContributionProvider } from '@theia/core/lib/common/contribution-provider';
import URI from '@theia/core/lib/common/uri';
import {
  DEFAULT_WINDOW_HASH,
  NewWindowOptions,
} from '@theia/core/lib/common/window';
import { inject, injectable, named } from '@theia/core/shared/inversify';
import { FileStat } from '@theia/filesystem/lib/common/files';
import {
  WorkspaceInput,
  WorkspaceService as TheiaWorkspaceService,
} from '@theia/workspace/lib/browser/workspace-service';
import {
  SketchesError,
  SketchesService,
} from '../../../common/protocol/sketches-service';
import {
  StartupTaskProvider,
  hasStartupTasks,
  StartupTask,
} from '../../../electron-common/startup-task';

@injectable()
export class WorkspaceService extends TheiaWorkspaceService {
  @inject(SketchesService)
  private readonly sketchesService: SketchesService;
  // @inject(WindowServiceExt)
  // private readonly windowServiceExt: WindowServiceExt;
  @inject(ContributionProvider)
  @named(StartupTaskProvider)
  private readonly providers: ContributionProvider<StartupTaskProvider>;

  private _workspaceError: Error | undefined;

  get workspaceError(): Error | undefined {
    return this._workspaceError;
  }

  protected override async toFileStat(
    uri: string | URI | undefined
  ): Promise<FileStat | undefined> {
    const stat = await super.toFileStat(uri);
    if (!stat) {
      const newSketchUri = await this.sketchesService.createNewSketch();
      return this.toFileStat(newSketchUri.uri);
    }
    // When opening a file instead of a directory, IDE2 (and Theia) expects a workspace JSON file.
    // Nothing will work if the workspace file is invalid. Users tend to start (see #964) IDE2 from the `.ino` files,
    // so here, IDE2 tries to load the sketch via the CLI from the main sketch file URI.
    // If loading the sketch is OK, IDE2 starts and uses the sketch folder as the workspace root instead of the sketch file.
    // If loading fails due to invalid name error, IDE2 loads a temp sketch and preserves the startup error, and offers the sketch move to the user later.
    // If loading the sketch fails, create a fallback sketch and open the new temp sketch folder as the workspace root.
    if (stat.isFile && stat.resource.path.ext === '.ino') {
      try {
        const sketch = await this.sketchesService.loadSketch(
          stat.resource.toString()
        );
        return this.toFileStat(sketch.uri);
      } catch (err) {
        if (SketchesError.InvalidName.is(err)) {
          this._workspaceError = err;
          const newSketchUri = await this.sketchesService.createNewSketch();
          return this.toFileStat(newSketchUri.uri);
        } else if (SketchesError.NotFound.is(err)) {
          this._workspaceError = err;
          const newSketchUri = await this.sketchesService.createNewSketch();
          return this.toFileStat(newSketchUri.uri);
        }
        throw err;
      }
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

  protected override reloadWindow(options?: WorkspaceInput): void {
    const tasks = this.tasks(options);
    this.setURLFragment(this._workspace?.resource.path.toString() || '');
    console.log(tasks);
    // this.windowServiceExt.reload({ tasks });
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

  protected override updateTitle(): void {
    // NOOP. IDE2 handles the `window.title` updates solely via the customized `WindowTitleUpdater`.
  }

  private tasks(options?: WorkspaceInput): StartupTask[] {
    const tasks = this.providers
      .getContributions()
      .map((contribution) => contribution.tasks())
      .reduce((prev, curr) => prev.concat(curr), []);
    if (hasStartupTasks(options)) {
      tasks.push(...options.tasks);
    }
    return tasks;
  }
}
