import { inject, injectable, postConstruct } from 'inversify';
import { TreeNode } from '@theia/core/lib/browser/tree';
import { posixSegments, splitSketchPath } from '../../create/create-paths';
import { CreateApi } from '../../create/create-api';
import { CloudSketchbookTree } from './cloud-sketchbook-tree';
import { AuthenticationClientService } from '../../auth/authentication-client-service';
import { SketchbookTreeModel } from '../sketchbook/sketchbook-tree-model';
import { ArduinoPreferences } from '../../arduino-preferences';
import { WorkspaceNode } from '@theia/navigator/lib/browser/navigator-tree';
import { CreateUri } from '../../create/create-uri';
import { FileStat } from '@theia/filesystem/lib/common/files';
import { LocalCacheFsProvider } from '../../local-cache/local-cache-fs-provider';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import URI from '@theia/core/lib/common/uri';
import { SketchCache } from './cloud-sketch-cache';
import { Create } from '../../create/typings';

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
  @inject(FileService)
  protected readonly fileService: FileService;

  @inject(AuthenticationClientService)
  protected readonly authenticationService: AuthenticationClientService;

  @inject(CreateApi)
  protected readonly createApi: CreateApi;

  @inject(CloudSketchbookTree)
  protected readonly cloudSketchbookTree: CloudSketchbookTree;

  @inject(ArduinoPreferences)
  protected readonly arduinoPreferences: ArduinoPreferences;

  @inject(LocalCacheFsProvider)
  protected readonly localCacheFsProvider: LocalCacheFsProvider;

  @inject(SketchCache)
  protected readonly sketchCache: SketchCache;

  @postConstruct()
  protected init(): void {
    super.init();
    this.toDispose.push(
      this.authenticationService.onSessionDidChange(() => this.updateRoot())
    );
  }

  async createRoot(): Promise<TreeNode | undefined> {
    const { session } = this.authenticationService;
    if (!session) {
      this.tree.root = undefined;
      return;
    }
    this.createApi.init(this.authenticationService, this.arduinoPreferences);
    this.sketchCache.init();
    const sketches = await this.createApi.sketches();
    const rootFileStats = sketchesToFileStats(sketches);
    if (this.workspaceService.opened) {
      const workspaceNode = WorkspaceNode.createRoot('Remote');
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

  protected recursivelyFindSketchRoot(node: TreeNode): any {
    if (node && CloudSketchbookTree.CloudSketchDirNode.is(node)) {
      return node;
    }

    if (node && node.parent) {
      return this.recursivelyFindSketchRoot(node.parent);
    }

    // can't find a root, return false
    return false;
  }

  async revealFile(uri: URI): Promise<TreeNode | undefined> {
    // we use remote uris as keys for the tree
    // convert local URIs
    const remoteuri = this.localCacheFsProvider.from(uri);
    if (remoteuri) {
      return super.revealFile(remoteuri);
    } else {
      return super.revealFile(uri);
    }
  }
}
