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
import { WindowServiceExt } from '../core/window-service-ext';

@injectable()
export class WorkspaceService extends TheiaWorkspaceService {
  @inject(SketchesService)
  private readonly sketchesService: SketchesService;
  @inject(WindowServiceExt)
  private readonly windowServiceExt: WindowServiceExt;
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
    //当打开一个文件而不是目录时，IDE2（和Theia）需要一个工作区JSON文件。
    //如果工作空间文件无效，则什么都不会工作。用户倾向于（参见#964）从`。
    //所以在这里，IDE2尝试通过CLI从主sketch文件的URI加载sketch。
    //如果加载成功，IDE2会启动并使用sketch文件夹作为工作空间的根目录，而不是sketch文件。
    //如果由于无效的名称错误而加载失败，IDE2会加载一个临时草图并保留启动错误，并在以后将草图移动给用户。
    //如果加载失败，创建一个备用sketch，并打开新的临时sketch文件夹作为工作空间的根目录。
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

  public async reloadSetWorkspace(uri: FileStat | undefined) {
    await this.setWorkspace(uri);
    // this.reloadWindow();
  }

  protected override reloadWindow(options?: WorkspaceInput): void {
    // 获取与给定选项相关的任务列表（假设 tasks 函数从选项中提取任务相关信息）
    const tasks = this.tasks(options);
    // 设置窗口的 URL 片段为当前工作区的路径（如果有工作区），否则为空字符串
    this.setURLFragment(this._workspace?.resource.path.toString() || '');
    // 重新加载窗口，并传入任务列表作为参数（假设 windowServiceExt 是一个窗口服务扩展对象，用于执行窗口相关操作）
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

  protected override updateTitle(): void {
    // NOOP. IDE2 handles the `window.title` updates solely via the customized `WindowTitleUpdater`.
  }

  /**
   * 获取启动任务列表。
   *
   * @param options - 可选的工作区输入参数。
   * @returns 启动任务数组。
   */
  private tasks(options?: WorkspaceInput): StartupTask[] {
    // 获取所有贡献者的任务列表，并将它们合并为一个数组
    const tasks = this.providers
      .getContributions()
      .map((contribution) => contribution.tasks())
      .reduce((prev, curr) => prev.concat(curr), []);
    // 如果有传入的启动任务选项且不为空，则将选项中的任务添加到任务列表中
    if (hasStartupTasks(options)) {
      tasks.push(...options.tasks);
    }
    return tasks;
  }

  override open(uri: URI, options?: WorkspaceInput): void {
    this.doOpen(uri, options);
  }

  protected override async doOpen(
    uri: URI,
    options?: WorkspaceInput
  ): Promise<URI | undefined> {
    // 将URI转换为文件状态
    const stat = await this.toFileStat(uri);
    if (stat) {
      // 判断当前文件是否为目录，如果不是目录且不是工作区文件
      if (!stat.isDirectory && !this.isWorkspaceFile(stat)) {
        // 构造错误信息
        const message = `Not a valid workspace: ${uri.path.toString()}`;
        // 调用messageService的error方法，显示错误信息
        this.messageService.error(message);
        // 抛出错误
        throw new Error(message);
      }
      // The same window has to be preserved too (instead of opening a new one), if the workspace root is not yet available and we are setting it for the first time.
      // Option passed as parameter has the highest priority (for api developers), then the preference, then the default.
      // 等待roots
      await this.roots;
      // 获取preserveWindow的值，如果preferences中没有设置，则默认为!this.opened
      const { preserveWindow } = {
        preserveWindow:
          this.preferences['workspace.preserveWindow'] || !this.opened,
        ...options,
      };
      // 设置最近使用的workspace
      await this.server.setMostRecentlyUsedWorkspace(uri.toString());
      // 如果preserveWindow为true，则将stat赋值给this._workspace
      if (preserveWindow) {
        this._workspace = stat;
      }
      // 打开窗口
      this.openWindow(stat, Object.assign(options ?? {}, { preserveWindow }));
      // 返回
      return;
    }
    // 抛出错误
    throw new Error('无效的工作区根URI。期望一个现有的目录或工作空间文件。');
  }
}
