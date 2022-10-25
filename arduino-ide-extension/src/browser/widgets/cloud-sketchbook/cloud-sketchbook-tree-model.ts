import {
  inject,
  injectable,
  postConstruct,
} from '@theia/core/shared/inversify';
import { CompositeTreeNode, TreeNode } from '@theia/core/lib/browser/tree';
import { posixSegments, splitSketchPath } from '../../create/create-paths';
import { CreateApi } from '../../create/create-api';
import { CloudSketchbookTree } from './cloud-sketchbook-tree';
import { AuthenticationClientService } from '../../auth/authentication-client-service';
import { SketchbookTreeModel } from '../sketchbook/sketchbook-tree-model';
import { WorkspaceNode } from '@theia/navigator/lib/browser/navigator-tree';
import { CreateUri } from '../../create/create-uri';
import { FileChangesEvent, FileStat } from '@theia/filesystem/lib/common/files';
import {
  LocalCacheFsProvider,
  LocalCacheUri,
} from '../../local-cache/local-cache-fs-provider';
import URI from '@theia/core/lib/common/uri';
import { SketchCache } from './cloud-sketch-cache';
import { Create } from '../../create/typings';
import { nls } from '@theia/core/lib/common/nls';
import { Deferred } from '@theia/core/lib/common/promise-util';

export function sketchBaseDir(sketch: Create.Sketch): FileStat {
  // extract the sketch path
  const [, path] = splitSketchPath(sketch.path);
  const dirs = posixSegments(path);

  const mtime = Date.parse(sketch.modified_at);
  const ctime = Date.parse(sketch.created_at);
  const createPath = CreateUri.toUri(dirs[0]);
  const baseDir: FileStat = {
    name: dirs[0],
    isDirectory: true,
    isFile: false,
    isSymbolicLink: false,
    resource: createPath,
    mtime,
    ctime,
  };
  return baseDir;
}

export function sketchesToFileStats(sketches: Create.Sketch[]): FileStat[] {
  const sketchesBaseDirs: Record<string, FileStat> = {};

  for (const sketch of sketches) {
    const sketchBaseDirFileStat = sketchBaseDir(sketch);
    sketchesBaseDirs[sketchBaseDirFileStat.resource.toString()] =
      sketchBaseDirFileStat;
  }

  return Object.keys(sketchesBaseDirs).map(
    (dirUri) => sketchesBaseDirs[dirUri]
  );
}

@injectable()
export class CloudSketchbookTreeModel extends SketchbookTreeModel {
  @inject(CreateApi)
  private readonly createApi: CreateApi;
  @inject(AuthenticationClientService)
  private readonly authenticationService: AuthenticationClientService;
  @inject(LocalCacheFsProvider)
  private readonly localCacheFsProvider: LocalCacheFsProvider;
  @inject(SketchCache)
  private readonly sketchCache: SketchCache;

  private _localCacheFsProviderReady: Deferred<void> | undefined;

  @postConstruct()
  protected override init(): void {
    super.init();
    this.toDispose.push(
      this.authenticationService.onSessionDidChange(() => this.updateRoot())
    );
  }

  override *getNodesByUri(uri: URI): IterableIterator<TreeNode> {
    if (uri.scheme === LocalCacheUri.scheme) {
      const workspace = this.root;
      const { session } = this.authenticationService;
      if (session && WorkspaceNode.is(workspace)) {
        const currentUri = this.localCacheFsProvider.to(uri);
        if (currentUri) {
          const rootPath = this.localCacheFsProvider
            .toUri(session)
            .path.toString();
          const currentPath = currentUri.path.toString();
          if (rootPath === currentPath) {
            return workspace;
          }
          if (currentPath.startsWith(rootPath)) {
            const id = currentPath.substring(rootPath.length);
            const node = this.getNode(id);
            if (node) {
              yield node;
            }
          }
        }
      }
    }
  }

  protected override isRootAffected(changes: FileChangesEvent): boolean {
    return changes.changes
      .map(({ resource }) => resource)
      .some(
        (uri) => uri.parent.toString().startsWith(LocalCacheUri.root.toString()) // all files under the root might affect the tree
      );
  }

  override async refresh(
    parent?: Readonly<CompositeTreeNode>
  ): Promise<CompositeTreeNode | undefined> {
    if (parent) {
      return super.refresh(parent);
    }
    await this.updateRoot();
    return super.refresh();
  }

  override async createRoot(): Promise<TreeNode | undefined> {
    const { session } = this.authenticationService;
    if (!session) {
      this.tree.root = undefined;
      return;
    }
    this.createApi.init(this.authenticationService, this.arduinoPreferences);
    this.sketchCache.init();
    const [sketches] = await Promise.all([
      this.createApi.sketches(),
      this.ensureLocalFsProviderReady(),
    ]);
    const rootFileStats = sketchesToFileStats(sketches);
    if (this.workspaceService.opened) {
      const workspaceNode = WorkspaceNode.createRoot(
        nls.localize('arduino/cloud/remote', 'Remote')
      );
      for await (const stat of rootFileStats) {
        workspaceNode.children.push(
          await this.tree.createWorkspaceRoot(stat, workspaceNode)
        );
      }
      return workspaceNode;
    }
  }

  sketchbookTree(): CloudSketchbookTree {
    return this.tree as CloudSketchbookTree;
  }

  protected override recursivelyFindSketchRoot(
    node: TreeNode
  ): TreeNode | false {
    if (node && CloudSketchbookTree.CloudSketchDirNode.is(node)) {
      return node;
    }

    if (node && node.parent) {
      return this.recursivelyFindSketchRoot(node.parent);
    }

    // can't find a root, return false
    return false;
  }

  override async revealFile(uri: URI): Promise<TreeNode | undefined> {
    await this.localCacheFsProvider.ready.promise;
    // we use remote uris as keys for the tree
    // convert local URIs
    const remoteUri = this.localCacheFsProvider.from(uri);
    if (remoteUri) {
      return super.revealFile(remoteUri);
    } else {
      return super.revealFile(uri);
    }
  }

  private async ensureLocalFsProviderReady(): Promise<void> {
    if (this._localCacheFsProviderReady) {
      return this._localCacheFsProviderReady.promise;
    }
    this._localCacheFsProviderReady = new Deferred();
    this.fileService
      .access(LocalCacheUri.root)
      .then(() => this._localCacheFsProviderReady?.resolve());
    return this._localCacheFsProviderReady.promise;
  }
}
