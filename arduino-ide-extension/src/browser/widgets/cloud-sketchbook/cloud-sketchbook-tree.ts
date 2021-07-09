import { inject, injectable } from 'inversify';
import URI from '@theia/core/lib/common/uri';
import { MaybePromise } from '@theia/core/lib/common/types';
import { FileStat } from '@theia/filesystem/lib/common/files';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FileStatNode } from '@theia/filesystem/lib/browser/file-tree';
import { Command } from '@theia/core/lib/common/command';
import { WidgetDecoration } from '@theia/core/lib/browser/widget-decoration';
import { DecoratedTreeNode } from '@theia/core/lib/browser/tree/tree-decorator';
import {
  FileNode,
  DirNode,
} from '@theia/filesystem/lib/browser/file-tree/file-tree';
import { TreeNode, CompositeTreeNode } from '@theia/core/lib/browser/tree';
import {
  PreferenceService,
  PreferenceScope,
} from '@theia/core/lib/browser/preferences/preference-service';
import { MessageService } from '@theia/core/lib/common/message-service';
import { REMOTE_ONLY_FILES } from './../../create/create-fs-provider';
import { posix } from '../../create/create-paths';
import { Create, CreateApi } from '../../create/create-api';
import { CreateUri } from '../../create/create-uri';
import {
  CloudSketchbookTreeModel,
  CreateCache,
} from './cloud-sketchbook-tree-model';
import { LocalCacheUri } from '../../local-cache/local-cache-fs-provider';
import { CloudSketchbookCommands } from './cloud-sketchbook-contributions';
import { DoNotAskAgainConfirmDialog } from '../../dialogs.ts/dialogs';
import { SketchbookTree } from '../sketchbook/sketchbook-tree';
import { firstToUpperCase } from '../../../common/utils';
import { ArduinoPreferences } from '../../arduino-preferences';
import { SketchesServiceClientImpl } from '../../../common/protocol/sketches-service-client-impl';

const MESSAGE_TIMEOUT = 5 * 1000;
const deepmerge = require('deepmerge').default;

@injectable()
export class CloudSketchbookTree extends SketchbookTree {
  @inject(FileService)
  protected readonly fileService: FileService;

  @inject(ArduinoPreferences)
  protected readonly arduinoPreferences: ArduinoPreferences;

  @inject(PreferenceService)
  protected readonly preferenceService: PreferenceService;

  @inject(MessageService)
  protected readonly messageService: MessageService;

  @inject(SketchesServiceClientImpl)
  protected readonly sketchServiceClient: SketchesServiceClientImpl;

  @inject(CreateApi)
  protected readonly createApi: CreateApi;

  async pushPublicWarn(
    node: CloudSketchbookTree.CloudSketchDirNode
  ): Promise<boolean> {
    const warn =
      node.isPublic && this.arduinoPreferences['arduino.cloud.pushpublic.warn'];

    if (warn) {
      const ok = await new DoNotAskAgainConfirmDialog({
        ok: 'Continue',
        cancel: 'Cancel',
        title: 'Push Sketch',
        msg: 'This is a Public Sketch. Before pushing, make sure any sensitive information is defined in arduino_secrets.h files. You can make a Sketch private from the Share panel.',
        maxWidth: 400,
        onAccept: () =>
          this.preferenceService.set(
            'arduino.cloud.pushpublic.warn',
            false,
            PreferenceScope.User
          ),
      }).open();
      if (!ok) {
        return false;
      }
      return true;
    } else {
      return true;
    }
  }

  async pull(arg: any): Promise<void> {
    const {
      model,
      node,
    }: {
      model: CloudSketchbookTreeModel;
      node: CloudSketchbookTree.CloudSketchDirNode;
    } = arg;

    const warn =
      node.synced && this.arduinoPreferences['arduino.cloud.pull.warn'];

    if (warn) {
      const ok = await new DoNotAskAgainConfirmDialog({
        ok: 'Pull',
        cancel: 'Cancel',
        title: 'Pull Sketch',
        msg: 'Pulling this Sketch from the Cloud will overwrite its local version. Are you sure you want to continue?',
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
    this.runWithState(node, 'pulling', async (node) => {
      const commandsCopy = node.commands;
      node.commands = [];

      // check if the sketch dir already exist
      if (node.synced) {
        const filesToPull = (
          await this.createApi.readDirectory(node.uri.path.toString(), {
            secrets: true,
          })
        ).filter((file: any) => !REMOTE_ONLY_FILES.includes(file.name));

        await Promise.all(
          filesToPull.map((file: any) => {
            const uri = CreateUri.toUri(file);
            this.fileService.copy(uri, LocalCacheUri.root.resolve(uri.path), {
              overwrite: true,
            });
          })
        );

        // open the pulled files in the current workspace
        const currentSketch = await this.sketchServiceClient.currentSketch();

        if (
          currentSketch &&
          node.underlying &&
          currentSketch.uri === node.underlying.toString()
        ) {
          filesToPull.forEach(async (file) => {
            const localUri = LocalCacheUri.root.resolve(
              CreateUri.toUri(file).path
            );
            const underlying = await this.fileService.toUnderlyingResource(
              localUri
            );

            model.open(underlying);
          });
        }
      } else {
        await this.fileService.copy(
          node.uri,
          LocalCacheUri.root.resolve(node.uri.path),
          { overwrite: true }
        );
      }

      node.commands = commandsCopy;
      this.messageService.info(`Done pulling ‘${node.fileStat.name}’.`, {
        timeout: MESSAGE_TIMEOUT,
      });
    });
  }

  async push(node: CloudSketchbookTree.CloudSketchDirNode): Promise<void> {
    if (!node.synced) {
      throw new Error('Cannot push to Cloud. It is not yet pulled.');
    }

    const pushPublic = await this.pushPublicWarn(node);
    if (!pushPublic) {
      return;
    }

    const warn = this.arduinoPreferences['arduino.cloud.push.warn'];

    if (warn) {
      const ok = await new DoNotAskAgainConfirmDialog({
        ok: 'Push',
        cancel: 'Cancel',
        title: 'Push Sketch',
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
    this.runWithState(node, 'pushing', async (node) => {
      if (!node.synced) {
        throw new Error(
          'You have to pull first to be able to push to the Cloud.'
        );
      }
      const commandsCopy = node.commands;
      node.commands = [];

      // delete every first level file, then push everything
      const result = await this.fileService.copy(
        LocalCacheUri.root.resolve(node.uri.path),
        node.uri,
        { overwrite: true }
      );
      node.commands = commandsCopy;
      this.messageService.info(`Done pushing ‘${result.name}’.`, {
        timeout: MESSAGE_TIMEOUT,
      });
    });
  }

  async refresh(
    node?: CompositeTreeNode
  ): Promise<CompositeTreeNode | undefined> {
    if (node && CloudSketchbookTree.CloudSketchDirNode.is(node)) {
      const localUri = await this.localUri(node);
      if (localUri) {
        node.synced = true;
        if (
          node.commands?.indexOf(CloudSketchbookCommands.PUSH_SKETCH) === -1
        ) {
          node.commands.splice(1, 0, CloudSketchbookCommands.PUSH_SKETCH);
        }
        // remove italic from synced nodes
        if (
          'decorationData' in node &&
          'fontData' in (node as any).decorationData
        ) {
          delete (node as any).decorationData.fontData;
        }
      }
    }
    return super.refresh(node);
  }

  private async runWithState<T>(
    node: CloudSketchbookTree.CloudSketchDirNode & Partial<DecoratedTreeNode>,
    state: CloudSketchbookTree.CloudSketchDirNode.State,
    task: (node: CloudSketchbookTree.CloudSketchDirNode) => MaybePromise<T>
  ): Promise<T> {
    const decoration: WidgetDecoration.TailDecoration = {
      data: `${firstToUpperCase(state)}...`,
      fontData: {
        color: 'var(--theia-list-highlightForeground)',
      },
    };
    try {
      node.state = state;
      this.mergeDecoration(node, { tailDecorations: [decoration] });
      await this.refresh(node);
      const result = await task(node);
      return result;
    } finally {
      delete node.state;
      // TODO: find a better way to attach and detach decorators. Do we need a proper `TreeDecorator` instead?
      const index = node.decorationData?.tailDecorations?.findIndex(
        (candidate) => JSON.stringify(decoration) === JSON.stringify(candidate)
      );
      if (typeof index === 'number' && index !== -1) {
        node.decorationData?.tailDecorations?.splice(index, 1);
      }
      await this.refresh(node);
    }
  }

  protected async resolveFileStat(
    node: FileStatNode
  ): Promise<FileStat | undefined> {
    if (
      CreateUri.is(node.uri) &&
      CloudSketchbookTree.CloudRootNode.is(this.root)
    ) {
      const resource = this.root.cache[node.uri.path.toString()];
      if (!resource) {
        return undefined;
      }
      return CloudSketchbookTree.toFileStat(resource, this.root.cache, 1);
    }
    return super.resolveFileStat(node);
  }

  protected readonly notInSyncDecoration: WidgetDecoration.Data = {
    fontData: {
      color: 'var(--theia-activityBar-inactiveForeground)',
    },
  };
  protected async toNodes(
    fileStat: FileStat,
    parent: CompositeTreeNode
  ): Promise<CloudSketchbookTree.CloudSketchTreeNode[]> {
    const children = await super.toNodes(fileStat, parent);
    for (const child of children.filter(FileStatNode.is)) {
      if (!CreateFileStat.is(child.fileStat)) {
        continue;
      }

      const localUri = await this.localUri(child);
      let underlying = null;
      if (localUri) {
        underlying = await this.fileService.toUnderlyingResource(localUri);
        Object.assign(child, { underlying });
      }

      if (CloudSketchbookTree.CloudSketchDirNode.is(child)) {
        if (child.fileStat.sketchId) {
          child.sketchId = child.fileStat.sketchId;
          child.isPublic = child.fileStat.isPublic;
        }
        const commands = [CloudSketchbookCommands.PULL_SKETCH];

        if (underlying) {
          child.synced = true;
          commands.push(CloudSketchbookCommands.PUSH_SKETCH);
        } else {
          this.mergeDecoration(child, this.notInSyncDecoration);
        }

        commands.push(CloudSketchbookCommands.OPEN_SKETCHBOOKSYNC_CONTEXT_MENU);

        Object.assign(child, { commands });
        if (!this.showAllFiles) {
          delete (child as any).expanded;
        }
      } else if (CloudSketchbookTree.CloudSketchDirNode.is(parent)) {
        if (!parent.synced) {
          this.mergeDecoration(child, this.notInSyncDecoration);
        } else {
          this.setDecoration(
            child,
            underlying ? undefined : this.notInSyncDecoration
          );
        }
      }
    }
    if (CloudSketchbookTree.SketchDirNode.is(parent) && !this.showAllFiles) {
      return [];
    }
    return children;
  }

  protected toNode(
    fileStat: FileStat,
    parent: CompositeTreeNode
  ): FileNode | DirNode {
    const node = super.toNode(fileStat, parent);
    if (CreateFileStat.is(fileStat)) {
      Object.assign(node, {
        type: fileStat.type,
        isPublic: fileStat.isPublic,
        sketchId: fileStat.sketchId,
      });
    }
    return node;
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

  private setDecoration(
    node: TreeNode,
    decorationData: WidgetDecoration.Data | undefined
  ): void {
    if (!decorationData) {
      delete (node as any).decorationData;
    } else {
      Object.assign(node, { decorationData });
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

  private get showAllFiles(): boolean {
    return this.arduinoPreferences['arduino.sketchbook.showAllFiles'];
  }
}

export interface CreateFileStat extends FileStat {
  type: Create.ResourceType;
  sketchId?: string;
  isPublic?: boolean;
}
export namespace CreateFileStat {
  export function is(
    stat: FileStat & { type?: Create.ResourceType }
  ): stat is CreateFileStat {
    return !!stat.type;
  }
}

export namespace CloudSketchbookTree {
  export const rootResource: Create.Resource = Object.freeze({
    modified_at: '',
    name: '',
    path: posix.sep,
    type: 'folder',
    children: Number.MIN_SAFE_INTEGER,
    size: Number.MIN_SAFE_INTEGER,
    sketchId: '',
  });

  export interface CloudRootNode extends SketchbookTree.RootNode {
    readonly cache: CreateCache;
  }

  export namespace CloudRootNode {
    export function create(
      cache: CreateCache,
      showAllFiles: boolean
    ): CloudRootNode {
      return Object.assign(
        SketchbookTree.RootNode.create(
          toFileStat(rootResource, cache, 1),
          showAllFiles
        ),
        { cache }
      );
    }

    export function is(
      node: (TreeNode & Partial<CloudRootNode>) | undefined
    ): node is CloudRootNode {
      return !!node && !!node.cache && SketchbookTree.RootNode.is(node);
    }
  }

  export interface CloudSketchDirNode extends SketchbookTree.SketchDirNode {
    state?: CloudSketchDirNode.State;
    synced?: true;
    sketchId?: string;
    isPublic?: boolean;
    commands?: Command[];
    underlying?: URI;
  }

  export interface CloudSketchTreeNode extends TreeNode {
    underlying?: URI;
  }

  export namespace CloudSketchDirNode {
    export function is(node: TreeNode): node is CloudSketchDirNode {
      return SketchbookTree.SketchDirNode.is(node);
    }

    export type State = 'syncing' | 'pulling' | 'pushing';
  }

  export function toFileStat(
    resource: Create.Resource,
    cache: CreateCache,
    depth = 0
  ): CreateFileStat {
    return {
      isDirectory: resource.type !== 'file',
      isFile: resource.type === 'file',
      isPublic: resource.isPublic,
      isSymbolicLink: false,
      name: resource.name,
      resource: CreateUri.toUri(resource),
      size: resource.size,
      mtime: Date.parse(resource.modified_at),
      sketchId: resource.sketchId || undefined,
      type: resource.type,
      ...(!!depth && {
        children: CreateCache.childrenOf(resource, cache)?.map(
          (childResource) => toFileStat(childResource, cache, depth - 1)
        ),
      }),
    };
  }
}
