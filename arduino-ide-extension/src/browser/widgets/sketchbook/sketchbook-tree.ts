import { inject, injectable } from 'inversify';
import { LabelProvider } from '@theia/core/lib/browser/label-provider';
import { Command } from '@theia/core/lib/common/command';
import { CompositeTreeNode, TreeNode } from '@theia/core/lib/browser/tree';
import { DirNode, FileStatNode } from '@theia/filesystem/lib/browser/file-tree';
import { SketchesService } from '../../../common/protocol';
import { FileStat } from '@theia/filesystem/lib/common/files';
import { SketchbookCommands } from './sketchbook-commands';
import {
  FileNavigatorTree,
  WorkspaceNode,
} from '@theia/navigator/lib/browser/navigator-tree';
import { ArduinoPreferences } from '../../arduino-preferences';

@injectable()
export class SketchbookTree extends FileNavigatorTree {
  @inject(LabelProvider)
  protected readonly labelProvider: LabelProvider;

  @inject(SketchesService)
  protected readonly sketchesService: SketchesService;

  @inject(ArduinoPreferences)
  protected readonly arduinoPreferences: ArduinoPreferences;

  async resolveChildren(parent: CompositeTreeNode): Promise<TreeNode[]> {
    const showAllFiles =
      this.arduinoPreferences['arduino.sketchbook.showAllFiles'];

    const children = (
      await Promise.all(
        (
          await super.resolveChildren(parent)
        ).map((node) => this.maybeDecorateNode(node, showAllFiles))
      )
    ).filter((node) => {
      // filter out hidden nodes
      if (DirNode.is(node) || FileStatNode.is(node)) {
        return node.fileStat.name.indexOf('.') !== 0;
      }
      return true;
    });

    // filter out hardware and libraries
    if (WorkspaceNode.is(parent.parent)) {
      return children
        .filter(DirNode.is)
        .filter(
          (node) =>
            ['libraries', 'hardware'].indexOf(
              this.labelProvider.getName(node)
            ) === -1
        );
    }

    // return the Arduino directory containing all user sketches
    if (WorkspaceNode.is(parent)) {
      return children;
    }

    return children;
    // return this.filter.filter(super.resolveChildren(parent));
  }

  protected async maybeDecorateNode(
    node: TreeNode,
    showAllFiles: boolean
  ): Promise<TreeNode> {
    if (DirNode.is(node)) {
      const sketch = await this.sketchesService.maybeLoadSketch(
        node.uri.toString()
      );
      if (sketch) {
        Object.assign(node, {
          type: 'sketch',
          commands: [SketchbookCommands.OPEN_SKETCHBOOK_CONTEXT_MENU],
        });
        if (!showAllFiles) {
          delete (node as any).expanded;
          node.children = [];
        } else {
          node.expanded = false;
        }
        return node;
      }
    }
    return node;
  }
}

export namespace SketchbookTree {
  export interface RootNode extends DirNode {
    readonly showAllFiles: boolean;
  }
  export namespace RootNode {
    export function is(node: TreeNode & Partial<RootNode>): node is RootNode {
      return typeof node.showAllFiles === 'boolean';
    }

    export function create(
      fileStat: FileStat,
      showAllFiles: boolean
    ): RootNode {
      return Object.assign(DirNode.createRoot(fileStat), {
        showAllFiles,
        visible: false,
      });
    }
  }

  export interface SketchDirNode extends DirNode {
    readonly type: 'sketch';
    readonly commands?: Command[];
  }
  export namespace SketchDirNode {
    export function is(
      node: (TreeNode & Partial<SketchDirNode>) | undefined
    ): node is SketchDirNode {
      return !!node && node.type === 'sketch' && DirNode.is(node);
    }
  }
}
