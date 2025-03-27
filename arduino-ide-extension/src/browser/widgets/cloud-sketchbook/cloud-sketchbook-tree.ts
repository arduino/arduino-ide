import { inject, injectable } from '@theia/core/shared/inversify';
import URI from '@theia/core/lib/common/uri';
import { MaybePromise } from '@theia/core/lib/common/types';
import { FileStatNode } from '@theia/filesystem/lib/browser/file-tree';
import { Command } from '@theia/core/lib/common/command';
import { WidgetDecoration } from '@theia/core/lib/browser/widget-decoration';
import { DecoratedTreeNode } from '@theia/core/lib/browser/tree/tree-decorator';
import {
  DirNode,
  FileNode,
} from '@theia/filesystem/lib/browser/file-tree/file-tree';
import { TreeNode, CompositeTreeNode } from '@theia/core/lib/browser/tree';
import {
  PreferenceService,
  PreferenceScope,
} from '@theia/core/lib/browser/preferences/preference-service';
import { MessageService } from '@theia/core/lib/common/message-service';
import { CreateApi } from '../../create/create-api';
import { CreateUri } from '../../create/create-uri';
import { CloudSketchbookTreeModel } from './cloud-sketchbook-tree-model';
import {
  LocalCacheFsProvider,
  LocalCacheUri,
} from '../../local-cache/local-cache-fs-provider';
import { CloudSketchbookCommands } from './cloud-sketchbook-commands';
import { DoNotAskAgainConfirmDialog } from '../../dialogs/do-not-ask-again-dialog';
import { SketchbookTree } from '../sketchbook/sketchbook-tree';
import { assertUnreachable } from '../../../common/utils';
import { FileStat } from '@theia/filesystem/lib/common/files';
import { WorkspaceNode } from '@theia/navigator/lib/browser/navigator-tree';
import { posix, splitSketchPath } from '../../create/create-paths';
import { Create } from '../../create/typings';
import { nls } from '@theia/core/lib/common';
import { ApplicationConnectionStatusContribution } from '../../theia/core/connection-status-service';
import { ExecuteWithProgress } from '../../../common/protocol/progressible';
import {
  pullingSketch,
  pushingSketch,
} from '../../contributions/cloud-contribution';
import { CloudSketchState, CreateFeatures } from '../../create/create-features';

const MESSAGE_TIMEOUT = 5 * 1000;
const deepmerge = require('deepmerge').default;

type FilesToWrite = { source: URI; dest: URI };
type FilesToSync = {
  filesToWrite: FilesToWrite[];
  filesToDelete: URI[];
};
@injectable()
export class CloudSketchbookTree extends SketchbookTree {
  @inject(LocalCacheFsProvider)
  private readonly localCacheFsProvider: LocalCacheFsProvider;

  @inject(PreferenceService)
  private readonly preferenceService: PreferenceService;

  @inject(MessageService)
  private readonly messageService: MessageService;

  @inject(CreateApi)
  private readonly createApi: CreateApi;

  @inject(ApplicationConnectionStatusContribution)
  private readonly connectionStatus: ApplicationConnectionStatusContribution;

  @inject(CreateFeatures)
  private readonly createFeatures: CreateFeatures;

  protected override init(): void {
    this.toDispose.push(
      this.connectionStatus.onOfflineStatusDidChange(() => this.refresh())
    );
    super.init();
  }

  async pushPublicWarn(
    node: CloudSketchbookTree.CloudSketchDirNode
  ): Promise<boolean> {
    const warn =
      node.isPublic && this.arduinoPreferences['arduino.cloud.pushpublic.warn'];

    if (warn) {
      const ok = await new DoNotAskAgainConfirmDialog({
        ok: nls.localize('arduino/cloud/continue', 'Continue'),
        cancel: nls.localize('vscode/issueMainService/cancel', 'Cancel'),
        title: nls.localize('arduino/cloud/pushSketch', 'Push Sketch'),
        msg: nls.localize(
          'arduino/cloud/pushSketchMsg',
          'This is a Public Sketch. Before pushing, make sure any sensitive information is defined in arduino_secrets.h files. You can make a Sketch private from the Share panel.'
        ),
        maxWidth: 400,
        onAccept: () =>
          this.preferenceService.set(
            'arduino.cloud.pushpublic.warn',
            false,
            PreferenceScope.User
          ),
      }).open();
      return Boolean(ok);
    } else {
      return true;
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
  async pull(arg: any, noProgress = false): Promise<void> {
    const {
      // model,
      node,
    }: {
      model: CloudSketchbookTreeModel;
      node: CloudSketchbookTree.CloudSketchDirNode;
    } = arg;

    const warn =
      CloudSketchbookTree.CloudSketchTreeNode.isSynced(node) &&
      this.arduinoPreferences['arduino.cloud.pull.warn'];

    if (warn) {
      const ok = await new DoNotAskAgainConfirmDialog({
        ok: nls.localize('arduino/cloud/pull', 'Pull'),
        cancel: nls.localize('vscode/issueMainService/cancel', 'Cancel'),
        title: nls.localize('arduino/cloud/pullSketch', 'Pull Sketch'),
        msg: nls.localize(
          'arduino/cloud/pullSketchMsg',
          'Pulling this Sketch from the Cloud will overwrite its local version. Are you sure you want to continue?'
        ),
        maxWidth: 400,
        onAccept: () =>
          this.preferenceService.set(
            'arduino.cloud.pull.warn',
            false,
            PreferenceScope.User
          ),
      }).open();
      if (!ok) {
        return;
      }
    }
    return this.runWithState(
      node,
      'pull',
      async (node) => {
        await this.pullNode(node);
      },
      noProgress
    );
  }

  private async pullNode(node: CloudSketchbookTree.CloudSketchDirNode) {
    const commandsCopy = node.commands;
    node.commands = [];

    const localUri = await this.fileService.toUnderlyingResource(
      LocalCacheUri.root.resolve(node.remoteUri.path)
    );
    await this.sync(node.remoteUri, localUri);

    this.createApi.sketchCache.purgeByPath(node.remoteUri.path.toString());

    node.commands = commandsCopy;
    this.messageService.info(
      nls.localize(
        'arduino/cloud/donePulling',
        "Done pulling '{0}'.",
        node.fileStat.name
      ),
      {
        timeout: MESSAGE_TIMEOUT,
      }
    );
  }

  async push(
    node: CloudSketchbookTree.CloudSketchDirNode,
    noProgress = false,
    ignorePushWarnings = false
  ): Promise<void> {
    if (!CloudSketchbookTree.CloudSketchTreeNode.isSynced(node)) {
      throw new Error(
        nls.localize(
          'arduino/cloud/notYetPulled',
          'Cannot push to Cloud. It is not yet pulled.'
        )
      );
    }

    const pushPublic = await this.pushPublicWarn(node);
    if (!pushPublic) {
      return;
    }

    const warn =
      !ignorePushWarnings && this.arduinoPreferences['arduino.cloud.push.warn'];

    if (warn) {
      const ok = await new DoNotAskAgainConfirmDialog({
        ok: nls.localize('arduino/cloud/push', 'Push'),
        cancel: nls.localize('vscode/issueMainService/cancel', 'Cancel'),
        title: nls.localize('arduino/cloud/pushSketch', 'Push Sketch'),
        msg: 'Pushing this Sketch will overwrite its Cloud version. Are you sure you want to continue?',
        maxWidth: 400,
        onAccept: () =>
          this.preferenceService.set(
            'arduino.cloud.push.warn',
            false,
            PreferenceScope.User
          ),
      }).open();
      if (!ok) {
        return;
      }
    }
    return this.runWithState(
      node,
      'push',
      async (node) => {
        await this.pushNode(node);
      },
      noProgress
    );
  }

  private async pushNode(node: CloudSketchbookTree.CloudSketchDirNode) {
    if (!CloudSketchbookTree.CloudSketchTreeNode.isSynced(node)) {
      throw new Error(
        nls.localize(
          'arduino/cloud/pullFirst',
          'You have to pull first to be able to push to the Cloud.'
        )
      );
    }
    const commandsCopy = node.commands;
    node.commands = [];

    const localUri = await this.fileService.toUnderlyingResource(
      LocalCacheUri.root.resolve(node.remoteUri.path)
    );
    await this.sync(localUri, node.remoteUri);

    this.createApi.sketchCache.purgeByPath(node.remoteUri.path.toString());

    node.commands = commandsCopy;
    this.messageService.info(
      nls.localize(
        'arduino/cloud/donePushing',
        "Done pushing '{0}'.",
        node.fileStat.name
      ),
      {
        timeout: MESSAGE_TIMEOUT,
      }
    );
  }

  private async recursiveURIs(uri: URI): Promise<URI[]> {
    // remote resources can be fetched one-shot via api
    if (CreateUri.is(uri)) {
      const resources = await this.createApi.readDirectory(
        uri.path.toString(),
        { recursive: true, skipSketchCache: true }
      );
      return resources.map((resource) =>
        CreateUri.toUri(splitSketchPath(resource.path)[1])
      );
    }

    const fileStat = await this.fileService.resolve(uri, {
      resolveMetadata: false,
    });

    if (!fileStat.children || !fileStat.isDirectory) {
      return [fileStat.resource];
    }

    let childrenUris: URI[] = [];

    for await (const child of fileStat.children) {
      childrenUris = [
        ...childrenUris,
        ...(await this.recursiveURIs(child.resource)),
      ];
    }

    return [fileStat.resource, ...childrenUris];
  }

  private URIsToMap(uris: URI[], basepath: string): Record<string, URI> {
    return uris.reduce((prev: Record<string, URI>, curr) => {
      const path = curr.toString().split(basepath);

      if (path.length !== 2 || path[1].length === 0) {
        return prev;
      }

      // do not map "do_not_sync" files/directories and their descendants
      const segments = path[1].split(posix.sep) || [];
      if (
        segments.some((segment) => Create.do_not_sync_files.includes(segment))
      ) {
        return prev;
      }

      // skip when the filename is a hidden file (starts with `.`)
      if (segments[segments.length - 1].indexOf('.') === 0) {
        return prev;
      }

      return { ...prev, [path[1]]: curr };
    }, {});
  }

  private async getUrisMap(uri: URI): Promise<Record<string, URI>> {
    const basepath = uri.toString();
    const exists = await this.fileService.exists(uri);
    const uris =
      (exists && this.URIsToMap(await this.recursiveURIs(uri), basepath)) || {};
    return uris;
  }

  private async treeDiff(source: URI, dest: URI): Promise<FilesToSync> {
    const [sourceURIs, destURIs] = await Promise.all([
      this.getUrisMap(source),
      this.getUrisMap(dest),
    ]);

    const destBase = dest.toString();
    const filesToWrite: FilesToWrite[] = [];

    Object.keys(sourceURIs).forEach((path) => {
      const destUri = destURIs[path] || new URI(destBase + path);

      filesToWrite.push({ source: sourceURIs[path], dest: destUri });
      delete destURIs[path];
    });

    const filesToDelete = Object.values(destURIs);

    return { filesToWrite, filesToDelete };
  }

  override async refresh(
    node?: CompositeTreeNode
  ): Promise<CompositeTreeNode | undefined> {
    if (node) {
      const showAllFiles =
        this.arduinoPreferences['arduino.sketchbook.showAllFiles'];
      await this.decorateNode(node, showAllFiles);
    }
    return super.refresh(node);
  }

  private async runWithState<T>(
    node: CloudSketchbookTree.CloudSketchDirNode & Partial<DecoratedTreeNode>,
    state: CloudSketchState,
    task: (node: CloudSketchbookTree.CloudSketchDirNode) => MaybePromise<T>,
    noProgress = false
  ): Promise<T> {
    this.createFeatures.setCloudSketchState(node.remoteUri, state);
    try {
      const result = await (noProgress
        ? task(node)
        : ExecuteWithProgress.withProgress(
            this.taskMessage(state, node.uri.path.name),
            this.messageService,
            async (progress) => {
              progress.report({ work: { done: 0, total: NaN } });
              return task(node);
            }
          ));
      await this.refresh(node);
      return result;
    } finally {
      this.createFeatures.setCloudSketchState(node.remoteUri, undefined);
    }
  }

  private taskMessage(state: CloudSketchState, input: string): string {
    switch (state) {
      case 'pull':
        return pullingSketch(input);
      case 'push':
        return pushingSketch(input);
      default:
        assertUnreachable(state);
    }
  }

  private async sync(source: URI, dest: URI): Promise<void> {
    const { filesToWrite, filesToDelete } = await this.treeDiff(source, dest);
    // Sort by the URIs. The shortest comes first. It's to ensure creating the parent folder for nested resources, for example.
    // When sorting the URIs, it does not matter whether on source or dest, only the URI path and its length matters; they're the same for a source+dest pair
    const uriPathLengthComparator = (left: URI, right: URI) =>
      left.path.toString().length - right.path.toString().length;
    filesToWrite.sort((left, right) =>
      uriPathLengthComparator(left.source, right.source)
    );
    for (const { source, dest } of filesToWrite) {
      const stat = await this.fileService.resolve(source);
      if (stat.isFile) {
        const content = await this.fileService.read(source);
        await this.fileService.write(dest, content.value);
      } else {
        await this.fileService.createFolder(dest);
      }
    }

    // Longes URI paths come first to delete the most nested ones first.
    filesToDelete.sort(uriPathLengthComparator).reverse();
    for (const resource of filesToDelete) {
      await this.fileService.delete(resource, { recursive: true });
    }
  }

  override async resolveChildren(
    parent: CompositeTreeNode
  ): Promise<TreeNode[]> {
    return (await super.resolveChildren(parent)).sort((a, b) => {
      if (
        WorkspaceNode.is(parent) &&
        FileStatNode.is(a) &&
        FileStatNode.is(b)
      ) {
        const syncNodeA =
          CloudSketchbookTree.CloudSketchTreeNode.is(a) &&
          CloudSketchbookTree.CloudSketchTreeNode.isSynced(a);
        const syncNodeB =
          CloudSketchbookTree.CloudSketchTreeNode.is(b) &&
          CloudSketchbookTree.CloudSketchTreeNode.isSynced(b);

        const syncComparison = Number(syncNodeB) - Number(syncNodeA);

        // same sync status, compare on modified time
        if (syncComparison === 0) {
          return (b.fileStat.mtime || 0) - (a.fileStat.mtime || 0);
        }
        return syncComparison;
      }

      return 0;
    });
  }

  /**
   * Retrieve fileStats for the given node, merging the local and remote children
   * Local children take precedence over remote ones
   * @param node
   * @returns
   */
  protected override async resolveFileStat(
    node: FileStatNode
  ): Promise<FileStat | undefined> {
    if (
      CloudSketchbookTree.CloudSketchTreeNode.is(node) &&
      CreateUri.is(node.remoteUri)
    ) {
      let remoteFileStat: FileStat;
      const cacheHit = this.createApi.sketchCache.getItem(
        node.remoteUri.path.toString()
      );
      if (cacheHit) {
        remoteFileStat = cacheHit;
      } else {
        // not found, fetch and add it for future calls
        remoteFileStat = await this.fileService.resolve(node.remoteUri);
        if (remoteFileStat) {
          this.createApi.sketchCache.addItem(remoteFileStat);
        }
      }

      const children: FileStat[] = [...(remoteFileStat?.children || [])];
      const childrenLocalPaths = children.map((child) => {
        return (
          this.localCacheFsProvider.currentUserUri.path.toString() +
          child.resource.path.toString()
        );
      });

      // if the node is in sync, also get local-only children
      if (CloudSketchbookTree.CloudSketchTreeNode.isSynced(node)) {
        const localFileStat = await this.fileService.resolve(node.uri);
        // merge the two children
        for (const child of localFileStat.children || []) {
          if (!childrenLocalPaths.includes(child.resource.path.toString())) {
            children.push(child);
          }
        }
      }

      // add a remote uri for the children. it's used as ID for the nodes
      const childrenWithRemoteUri: FileStat[] = await Promise.all(
        children.map(async (childFs) => {
          let remoteUri: URI = childFs.resource;
          if (!CreateUri.is(childFs.resource)) {
            let refUri = node.fileStat.resource;
            if (node.fileStat.hasOwnProperty('remoteUri')) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              refUri = (node.fileStat as any).remoteUri;
            }
            remoteUri = refUri.resolve(childFs.name);
          }
          return { ...childFs, remoteUri };
        })
      );

      const fileStat = { ...remoteFileStat, children: childrenWithRemoteUri };
      node.fileStat = fileStat;
      return fileStat;
    } else {
      // it's a local-only file
      return super.resolveFileStat(node);
    }
  }

  protected override toNode(
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
    fileStat: any,
    parent: CompositeTreeNode
  ): FileNode | DirNode {
    const uri = fileStat.resource;

    let idUri;
    if (fileStat.remoteUri) {
      idUri = fileStat.remoteUri;
    }

    const id = this.toNodeId(idUri || uri, parent);
    const node = this.getNode(id);
    if (fileStat.isDirectory) {
      if (DirNode.is(node)) {
        node.uri = uri;
        node.fileStat = fileStat;
        return node;
      }
      return <DirNode>{
        id,
        uri,
        fileStat,
        parent,
        expanded: false,
        selected: false,
        children: [],
      };
    }
    if (FileNode.is(node)) {
      node.fileStat = fileStat;
      node.uri = uri;
      return node;
    }
    return <FileNode>{
      id,
      uri,
      fileStat,
      parent,
      selected: false,
    };
  }

  protected readonly notInSyncOfflineDecoration: WidgetDecoration.Data = {
    fontData: {
      color: 'var(--theia-activityBar-inactiveForeground)',
    },
  };

  protected readonly inSyncDecoration: WidgetDecoration.Data = {
    fontData: {},
  };

  /**
   * Add commands available to the given node.
   * In the case the node is a sketch, it also adds sketchId and isPublic flags
   * @param node
   * @returns
   */
  protected override async augmentSketchNode(node: DirNode): Promise<void> {
    const sketch = this.createApi.sketchCache.getSketch(
      node.fileStat.resource.path.toString()
    );

    const commands: Command[] = [];
    if (this.connectionStatus.offlineStatus !== 'internet') {
      commands.push(CloudSketchbookCommands.PULL_SKETCH);
    }

    if (
      CloudSketchbookTree.CloudSketchTreeNode.is(node) &&
      CloudSketchbookTree.CloudSketchTreeNode.isSynced(node) &&
      this.connectionStatus.offlineStatus !== 'internet'
    ) {
      commands.push(CloudSketchbookCommands.PUSH_SKETCH);
    }
    commands.push(CloudSketchbookCommands.OPEN_SKETCHBOOKSYNC_CONTEXT_MENU);

    Object.assign(node, {
      type: 'sketch',
      ...(sketch && {
        isPublic: sketch.is_public,
      }),
      ...(sketch && {
        sketchId: sketch.id,
      }),
      commands,
    });
  }

  protected async nodeLocalUri(node: TreeNode): Promise<TreeNode> {
    if (FileStatNode.is(node) && CreateUri.is(node.uri)) {
      Object.assign(node, { remoteUri: node.uri });
      const localUri = await this.localUri(node);
      if (localUri) {
        // if the node has a local uri, use it
        const underlying = await this.fileService.toUnderlyingResource(
          localUri
        );
        node.uri = underlying;
      }
    }

    // add style decoration for not-in-sync files when offline
    if (
      CloudSketchbookTree.CloudSketchTreeNode.is(node) &&
      !CloudSketchbookTree.CloudSketchTreeNode.isSynced(node) &&
      this.connectionStatus.offlineStatus === 'internet'
    ) {
      this.mergeDecoration(node, this.notInSyncOfflineDecoration);
    } else {
      this.removeDecoration(node, this.notInSyncOfflineDecoration);
    }

    return node;
  }

  protected override async decorateNode(
    node: TreeNode,
    showAllFiles: boolean
  ): Promise<TreeNode> {
    node = await this.nodeLocalUri(node);

    node = await super.decorateNode(node, showAllFiles);
    return node;
  }

  protected override async isSketchNode(node: DirNode): Promise<boolean> {
    if (DirNode.is(node)) {
      const sketch = this.createApi.sketchCache.getSketch(
        node.fileStat.resource.path.toString()
      );
      return !!sketch;
    }
    return false;
  }

  private mergeDecoration(
    node: TreeNode,
    decorationData: WidgetDecoration.Data
  ): void {
    Object.assign(node, {
      decorationData: deepmerge(
        DecoratedTreeNode.is(node) ? node.decorationData : {},
        decorationData
      ),
    });
  }

  private removeDecoration(
    node: TreeNode,
    decorationData: WidgetDecoration.Data
  ): void {
    if (DecoratedTreeNode.is(node)) {
      for (const property of Object.keys(decorationData)) {
        if (node.decorationData.hasOwnProperty(property)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          delete (node.decorationData as any)[property];
        }
      }
    }
  }

  public async localUri(node: FileStatNode): Promise<URI | undefined> {
    const localUri = LocalCacheUri.root.resolve(node.uri.path);
    const exists = await this.fileService.exists(localUri);
    if (exists) {
      return localUri;
    }
    return undefined;
  }
}

export namespace CloudSketchbookTree {
  export interface CloudSketchTreeNode extends FileStatNode {
    remoteUri: URI;
  }

  export namespace CloudSketchTreeNode {
    export function is(node: TreeNode): node is CloudSketchTreeNode {
      return !!node && typeof node.hasOwnProperty('remoteUri') !== 'undefined';
    }

    export function isSynced(node: CloudSketchTreeNode): boolean {
      return node.remoteUri !== node.uri;
    }
  }

  export interface CloudSketchDirNode
    extends Omit<SketchbookTree.SketchDirNode, 'fileStat'>,
      CloudSketchTreeNode {
    state?: CloudSketchState;
    isPublic?: boolean;
    sketchId?: string;
    commands?: Command[];
  }
  export namespace CloudSketchDirNode {
    export function is(node: TreeNode | undefined): node is CloudSketchDirNode {
      return SketchbookTree.SketchDirNode.is(node);
    }
  }
}
