import {
  inject,
  injectable,
  postConstruct,
} from '@theia/core/shared/inversify';
import { Emitter, Event } from '@theia/core/lib/common/event';
import {
  Disposable,
  DisposableCollection,
} from '@theia/core/lib/common/disposable';
import URI from '@theia/core/lib/common/uri';
import { DiffUris, open, OpenerService } from '@theia/core/lib/browser';
import {
  ScmProvider,
  ScmResource,
  ScmResourceGroup,
  ScmResourceDecorations,
  ScmCommand,
} from '@theia/scm/lib/browser/scm-provider';
import {
  GitFileChange,
  GitFileStatus,
  GitService,
} from '../../common/protocol/git-service';
import { SketchesService } from '../../common/protocol/sketches-service';
import { WorkspaceService } from '../theia/workspace/workspace-service';
import { ArduinoGitResourceUri } from './arduino-git-resource-resolver';
import {
  CurrentSketch,
  SketchesServiceClientImpl,
} from '../sketches-service-client-impl';

@injectable()
export class ArduinoScmProvider implements ScmProvider {
  readonly id = 'arduino-git';
  readonly label = 'Git';

  @inject(GitService)
  private readonly gitService: GitService;

  @inject(SketchesService)
  private readonly sketchesService: SketchesService;

  @inject(SketchesServiceClientImpl)
  private readonly sketchServiceClient: SketchesServiceClientImpl;

  @inject(WorkspaceService)
  private readonly workspaceService: WorkspaceService;

  @inject(OpenerService)
  private readonly openerService: OpenerService;

  private readonly toDispose = new DisposableCollection();
  private readonly onDidChangeEmitter = new Emitter<void>();
  private readonly onDidChangeCommitTemplateEmitter = new Emitter<string>();
  private readonly onDidChangeStatusBarCommandsEmitter = new Emitter<
    ScmCommand[] | undefined
  >();

  private _groups: ScmResourceGroup[] = [];
  private _statusBarCommands: ScmCommand[] = [];
  private _rootUri = '';
  private _branch = '';

  get rootUri(): string {
    return this._rootUri;
  }
  get branch(): string {
    return this._branch;
  }
  get groups(): ScmResourceGroup[] {
    return this._groups;
  }
  get onDidChange(): Event<void> {
    return this.onDidChangeEmitter.event;
  }
  get onDidChangeCommitTemplate(): Event<string> {
    return this.onDidChangeCommitTemplateEmitter.event;
  }
  get statusBarCommands(): ScmCommand[] {
    return this._statusBarCommands;
  }
  get onDidChangeStatusBarCommands(): Event<ScmCommand[] | undefined> {
    return this.onDidChangeStatusBarCommandsEmitter.event;
  }

  readonly acceptInputCommand: ScmCommand = {
    command: 'arduino-git.commit',
    title: 'Commit',
  };

  @postConstruct()
  protected init(): void {
    this.toDispose.push(this.onDidChangeEmitter);
    this.toDispose.push(this.onDidChangeCommitTemplateEmitter);
    this.toDispose.push(this.onDidChangeStatusBarCommandsEmitter);
  }

  async refresh(): Promise<void> {
    const root = this.workspaceService.tryGetRoots()[0];
    if (!root) {
      this._groups = [];
      this._statusBarCommands = [];
      this._branch = '';
      this.onDidChangeEmitter.fire();
      return;
    }

    this._rootUri = root.resource.toString();

    const savedSketch = await this.isSavedSketch(this._rootUri);
    if (!savedSketch) {
      this._groups = [];
      this._statusBarCommands = [];
      this._branch = '';
      this.onDidChangeEmitter.fire();
      this.onDidChangeStatusBarCommandsEmitter.fire(this._statusBarCommands);
      return;
    }

    const isRepo = await this.gitService.isGitRepo(this._rootUri);
    if (!isRepo) {
      this._groups = [];
      this._statusBarCommands = [];
      this._branch = '';
      this.onDidChangeEmitter.fire();
      return;
    }

    const status = await this.gitService.status(this._rootUri);
    this._branch = status.branch;

    // Build the three resource groups
    this._groups = [
      this.buildGroup('index', 'Staged Changes', status.staged, true),
      this.buildGroup('workingTree', 'Changes', status.unstaged, false),
      this.buildGroup('untracked', 'Untracked Files', status.untracked, false),
    ].filter((g) => g.resources.length > 0 || g.id === 'index');

    // Status bar: show branch + ahead/behind
    const aheadBehind =
      status.ahead || status.behind
        ? ` ↑${status.ahead} ↓${status.behind}`
        : '';
    this._statusBarCommands = [
      {
        command: 'arduino-git.checkout',
        title: `$(git-branch) ${status.branch}${aheadBehind}`,
        tooltip: `Current branch: ${status.branch}`,
      },
    ];

    this.onDidChangeEmitter.fire();
    this.onDidChangeStatusBarCommandsEmitter.fire(this._statusBarCommands);
  }

  private async isSavedSketch(rootUri: string): Promise<boolean> {
    const sketch = this.sketchServiceClient.tryGetCurrentSketch();
    if (!CurrentSketch.isValid(sketch) || sketch.uri !== rootUri) {
      return false;
    }
    return !(await this.sketchesService.isTemp(sketch));
  }

  private buildGroup(
    id: string,
    label: string,
    changes: GitFileChange[],
    staged: boolean
  ): ScmResourceGroup {
    const resources: ScmResource[] = [];
    const group: ScmResourceGroup = {
      id,
      label,
      resources,
      provider: this,
      hideWhenEmpty: id !== 'index',
      dispose: Disposable.NULL.dispose,
    };
    // Populate after group is created so resources can reference it
    resources.push(
      ...changes.map((change) => this.toScmResource(change, staged, group))
    );
    return group;
  }

  private toScmResource(
    change: GitFileChange,
    staged: boolean,
    group: ScmResourceGroup
  ): ScmResource {
    const uri = new URI(change.uri);
    const letter = GitFileStatus.toLetter(change.status);
    const label = GitFileStatus.toLabel(change.status);

    const decorations: ScmResourceDecorations = {
      letter,
      tooltip: label,
      color: this.statusColor(change.status),
      strikeThrough: change.status === 'D',
    };

    return {
      sourceUri: uri,
      decorations,
      group,
      open: () => this.open(change, staged, uri),
    };
  }

  private async open(
    change: GitFileChange,
    staged: boolean,
    uri: URI
  ): Promise<void> {
    if (change.status === '?' || change.status === 'U') {
      await open(this.openerService, uri);
      return;
    }

    const empty = ArduinoGitResourceUri.create(
      this._rootUri,
      change.uri,
      'EMPTY'
    );
    const head = ArduinoGitResourceUri.create(
      this._rootUri,
      change.uri,
      'HEAD'
    );
    const index = ArduinoGitResourceUri.create(
      this._rootUri,
      change.uri,
      'INDEX'
    );
    const editableIndex = ArduinoGitResourceUri.create(
      this._rootUri,
      change.uri,
      'INDEX_EDIT'
    );
    const editableWorkingTree = ArduinoGitResourceUri.create(
      this._rootUri,
      change.uri,
      'WORKTREE_EDIT'
    );
    const left = staged ? (change.status === 'A' ? empty : head) : index;
    const right = staged
      ? editableIndex
      : change.status === 'D'
      ? editableWorkingTree
      : uri;
    const diffUri = DiffUris.encode(
      left,
      right,
      `${change.relativePath} (${GitFileStatus.toLabel(change.status)})`
    );
    await open(this.openerService, diffUri);
  }

  private statusColor(status: GitFileStatus): string {
    switch (status) {
      case 'A':
        return 'var(--theia-gitDecoration-addedResourceForeground, #81b88b)';
      case 'D':
      case 'U':
        return 'var(--theia-gitDecoration-deletedResourceForeground, #c74e39)';
      case '?':
        return 'var(--theia-gitDecoration-untrackedResourceForeground, #73c991)';
      default:
        return 'var(--theia-gitDecoration-modifiedResourceForeground, #e2c08d)';
    }
  }

  dispose(): void {
    this.toDispose.dispose();
  }
}

// Make ArduinoScmProvider satisfy ScmResourceGroup where needed
// (groups need provider reference typed as ScmProvider)
export interface ArduinoScmProvider extends ScmProvider, Disposable {}
