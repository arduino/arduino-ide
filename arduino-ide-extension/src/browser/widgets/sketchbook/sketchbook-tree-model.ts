import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import URI from '@theia/core/lib/common/uri';
import { FileNode, FileTreeModel } from '@theia/filesystem/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { ConfigService } from '../../../common/protocol';
import { SketchbookTree } from './sketchbook-tree';
import { ArduinoPreferences } from '../../arduino-preferences';
import {
  CompositeTreeNode,
  ExpandableTreeNode,
  SelectableTreeNode,
  TreeNode,
} from '@theia/core/lib/browser/tree';
import { SketchbookCommands } from './sketchbook-commands';
import { OpenerService, open } from '@theia/core/lib/browser';
import { CurrentSketch, SketchesServiceClientImpl } from '../../../common/protocol/sketches-service-client-impl';
import { CommandRegistry } from '@theia/core/lib/common/command';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import { ProgressService } from '@theia/core/lib/common/progress-service';
import {
  WorkspaceNode,
  WorkspaceRootNode,
} from '@theia/navigator/lib/browser/navigator-tree';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { Disposable } from '@theia/core/lib/common/disposable';

@injectable()
export class SketchbookTreeModel extends FileTreeModel {
  @inject(FileService)
  protected override readonly fileService: FileService;

  @inject(ArduinoPreferences)
  protected readonly arduinoPreferences: ArduinoPreferences;

  @inject(CommandRegistry)
  public readonly commandRegistry: CommandRegistry;

  @inject(ConfigService)
  protected readonly configService: ConfigService;

  @inject(OpenerService)
  protected readonly openerService: OpenerService;

  @inject(SketchesServiceClientImpl)
  protected readonly sketchServiceClient: SketchesServiceClientImpl;

  @inject(SketchbookTree) protected override readonly tree: SketchbookTree;
  @inject(WorkspaceService)
  protected readonly workspaceService: WorkspaceService;
  @inject(FrontendApplicationStateService)
  protected readonly applicationState: FrontendApplicationStateService;

  @inject(ProgressService)
  protected readonly progressService: ProgressService;

  @postConstruct()
  protected override init(): void {
    super.init();
    this.reportBusyProgress();
    this.initializeRoot();
  }

  protected readonly pendingBusyProgress = new Map<string, Deferred<void>>();
  protected reportBusyProgress(): void {
    this.toDispose.push(
      this.onDidChangeBusy((node) => {
        const pending = this.pendingBusyProgress.get(node.id);
        if (pending) {
          if (!node.busy) {
            pending.resolve();
            this.pendingBusyProgress.delete(node.id);
          }
          return;
        }
        if (node.busy) {
          const progress = new Deferred<void>();
          this.pendingBusyProgress.set(node.id, progress);
          this.progressService.withProgress(
            '',
            'explorer',
            () => progress.promise
          );
        }
      })
    );
    this.toDispose.push(
      Disposable.create(() => {
        for (const pending of this.pendingBusyProgress.values()) {
          pending.resolve();
        }
        this.pendingBusyProgress.clear();
      })
    );
  }

  protected async initializeRoot(): Promise<void> {
    await Promise.all([
      this.applicationState.reachedState('initialized_layout'),
      this.workspaceService.roots,
    ]);
    await this.updateRoot();
    if (this.toDispose.disposed) {
      return;
    }
    this.toDispose.push(
      this.workspaceService.onWorkspaceChanged(() => this.updateRoot())
    );
    this.toDispose.push(
      this.workspaceService.onWorkspaceLocationChanged(() => this.updateRoot())
    );
    this.toDispose.push(
      this.arduinoPreferences.onPreferenceChanged(({ preferenceName }) => {
        if (preferenceName === 'arduino.sketchbook.showAllFiles') {
          this.updateRoot();
        }
      })
    );

    if (this.selectedNodes.length) {
      return;
    }
    const root = this.root;
    if (CompositeTreeNode.is(root) && root.children.length === 1) {
      const child = root.children[0];
      if (
        SelectableTreeNode.is(child) &&
        !child.selected &&
        ExpandableTreeNode.is(child)
      ) {
        this.selectNode(child);
        this.expandNode(child);
      }
    }
  }

  previewNode(node: TreeNode): void {
    if (FileNode.is(node)) {
      open(this.openerService, node.uri, {
        mode: 'reveal',
        preview: true,
      });
    }
  }

  override *getNodesByUri(uri: URI): IterableIterator<TreeNode> {
    const workspace = this.root;
    if (WorkspaceNode.is(workspace)) {
      for (const root of workspace.children) {
        const id = this.tree.createId(root, uri);
        const node = this.getNode(id);
        if (node) {
          yield node;
        }
      }
    }
  }

  public async updateRoot(): Promise<void> {
    this.root = await this.createRoot();
  }

  protected async createRoot(): Promise<TreeNode | undefined> {
    const config = await this.configService.getConfiguration();
    const rootFileStats = await this.fileService.resolve(
      new URI(config.sketchDirUri)
    );

    if (this.workspaceService.opened && rootFileStats.children) {
      // filter out libraries and hardware

      if (this.workspaceService.opened) {
        const workspaceNode = WorkspaceNode.createRoot();
        workspaceNode.children.push(
          await this.tree.createWorkspaceRoot(rootFileStats, workspaceNode)
        );

        return workspaceNode;
      }
    }
  }

  /**
   * Move the given source file or directory to the given target directory.
   */
  override async move(source: TreeNode, target: TreeNode): Promise<URI | undefined> {
    if (source.parent && WorkspaceRootNode.is(source)) {
      // do not support moving a root folder
      return undefined;
    }
    return super.move(source, target);
  }

  /**
   * Reveals node in the navigator by given file uri.
   *
   * @param uri uri to file which should be revealed in the navigator
   * @returns file tree node if the file with given uri was revealed, undefined otherwise
   */
  async revealFile(uri: URI): Promise<TreeNode | undefined> {
    if (!uri.path.isAbsolute) {
      return undefined;
    }
    let node = this.getNodeClosestToRootByUri(uri);

    // success stop condition
    // we have to reach workspace root because expanded node could be inside collapsed one
    if (WorkspaceRootNode.is(node)) {
      if (ExpandableTreeNode.is(node)) {
        if (!node.expanded) {
          node = await this.expandNode(node);
        }
        return node;
      }
      // shouldn't happen, root node is always directory, i.e. expandable
      return undefined;
    }

    // fail stop condition
    if (uri.path.isRoot) {
      // file system root is reached but workspace root wasn't found, it means that
      // given uri is not in workspace root folder or points to not existing file.
      return undefined;
    }

    if (await this.revealFile(uri.parent)) {
      if (node === undefined) {
        // get node if it wasn't mounted into navigator tree before expansion
        node = this.getNodeClosestToRootByUri(uri);
      }
      if (ExpandableTreeNode.is(node) && !node.expanded) {
        node = await this.expandNode(node);
      }
      return node;
    }
    return undefined;
  }

  protected getNodeClosestToRootByUri(uri: URI): TreeNode | undefined {
    const nodes = [...this.getNodesByUri(uri)];
    return nodes.length > 0
      ? nodes.reduce(
          (
            node1,
            node2 // return the node closest to the workspace root
          ) => (node1.id.length >= node2.id.length ? node1 : node2)
        )
      : undefined;
  }

  // selectNode gets called when the user single-clicks on an item
  // when this happens, we want to open the file if it belongs to the currently open sketch
  override async selectNode(node: Readonly<SelectableTreeNode>): Promise<void> {
    super.selectNode(node);
    if (FileNode.is(node) && (await this.isFileInsideCurrentSketch(node))) {
      this.open(node.uri);
    }
  }

  public open(uri: URI): void {
    open(this.openerService, uri, {
      mode: 'reveal',
      preview: false,
    });
  }

  protected override async doOpenNode(node: TreeNode): Promise<void> {
    // if it's a sketch dir, or a file from another sketch, open in new window
    if (!(await this.isFileInsideCurrentSketch(node))) {
      const sketchRoot = this.recursivelyFindSketchRoot(node);
      if (sketchRoot) {
        this.commandRegistry.executeCommand(
          SketchbookCommands.OPEN_NEW_WINDOW.id,
          { node: sketchRoot }
        );
      }
      return;
    }

    if (node.visible === false) {
      return;
    } else if (FileNode.is(node)) {
      this.open(node.uri);
    } else {
      super.doOpenNode(node);
    }
  }

  private async isFileInsideCurrentSketch(node: TreeNode): Promise<boolean> {
    // it's a directory, not a file
    if (!FileNode.is(node)) {
      return false;
    }

    // check if the node is a file that belongs to another sketch
    const sketch = await this.sketchServiceClient.currentSketch();
    if (
      CurrentSketch.isValid(sketch) &&
      node.uri.toString().indexOf(sketch.uri) !== 0
    ) {
      return false;
    }
    return true;
  }

  protected recursivelyFindSketchRoot(node: TreeNode): TreeNode | false {
    if (node && SketchbookTree.SketchDirNode.is(node)) {
      return node;
    }

    if (node && node.parent) {
      return this.recursivelyFindSketchRoot(node.parent);
    }

    // can't find a root, return false
    return false;
  }
}
