import { CompositeTreeNode } from '@theia/core/lib/browser/tree';
import { Progress } from '@theia/core/lib/common/message-service-protocol';
import { nls } from '@theia/core/lib/common/nls';
import { injectable } from '@theia/core/shared/inversify';
import { CreateUri } from '../create/create-uri';
import { isConflict } from '../create/typings';
import {
  TaskFactoryImpl,
  WorkspaceInputDialogWithProgress,
} from '../theia/workspace/workspace-input-dialog';
import { CloudSketchbookTree } from '../widgets/cloud-sketchbook/cloud-sketchbook-tree';
import { CloudSketchbookTreeModel } from '../widgets/cloud-sketchbook/cloud-sketchbook-tree-model';
import {
  CloudSketchContribution,
  pullingSketch,
  pushingSketch,
  sketchAlreadyExists,
  synchronizingSketchbook,
} from './cloud-contribution';
import { Command, CommandRegistry, Sketch, URI } from './contribution';

export interface RenameCloudSketchParams {
  readonly cloudUri: URI;
  readonly sketch: Sketch;
}

@injectable()
export class RenameCloudSketch extends CloudSketchContribution {
  override registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(RenameCloudSketch.Commands.RENAME_CLOUD_SKETCH, {
      execute: (params: RenameCloudSketchParams) =>
        this.renameSketch(params, true),
    });
  }

  private async renameSketch(
    params: RenameCloudSketchParams,
    skipShowErrorMessageOnOpen: boolean,
    initValue: string = params.sketch.name
  ): Promise<string | undefined> {
    const treeModel = await this.treeModel();
    if (treeModel) {
      const posixPath = params.cloudUri.path.toString();
      const node = treeModel.getNode(posixPath);
      const parentNode = node?.parent;
      if (
        CloudSketchbookTree.CloudSketchDirNode.is(node) &&
        CompositeTreeNode.is(parentNode)
      ) {
        return this.openWizard(
          params,
          node,
          parentNode,
          treeModel,
          skipShowErrorMessageOnOpen,
          initValue
        );
      }
    }
    return undefined;
  }

  private async openWizard(
    params: RenameCloudSketchParams,
    node: CloudSketchbookTree.CloudSketchDirNode,
    parentNode: CompositeTreeNode,
    treeModel: CloudSketchbookTreeModel,
    skipShowErrorMessageOnOpen: boolean,
    initialValue?: string | undefined
  ): Promise<string | undefined> {
    const parentUri = CloudSketchbookTree.CloudSketchDirNode.is(parentNode)
      ? parentNode.uri
      : CreateUri.root;
    const existingNames = parentNode.children
      .filter(CloudSketchbookTree.CloudSketchDirNode.is)
      .map(({ fileStat }) => fileStat.name);
    const taskFactory = new TaskFactoryImpl((value) =>
      this.renameSketchWithProgress(params, node, treeModel, value)
    );
    try {
      const dialog = new WorkspaceInputDialogWithProgress(
        {
          title: '云草图的新名称',
          parentUri,
          initialValue,
          validate: (input) => {
            if (existingNames.includes(input)) {
              return sketchAlreadyExists(input);
            }
            return Sketch.validateCloudSketchFolderName(input) ?? '';
          },
        },
        this.labelProvider,
        taskFactory
      );
      await dialog.open(skipShowErrorMessageOnOpen);
      return dialog.taskResult;
    } catch (err) {
      if (isConflict(err)) {
        await treeModel.refresh();
        return this.renameSketch(
          params,
          false,
          taskFactory.value ?? initialValue
        );
      }
      throw err;
    }
  }

  private renameSketchWithProgress(
    params: RenameCloudSketchParams,
    node: CloudSketchbookTree.CloudSketchDirNode,
    treeModel: CloudSketchbookTreeModel,
    value: string
  ): (progress: Progress) => Promise<string | undefined> {
    return async (progress: Progress) => {
      const fromName = params.cloudUri.path.name;
      const fromPosixPath = params.cloudUri.path.toString();
      const toPosixPath = params.cloudUri.parent.resolve(value).path.toString();
      // push
      progress.report({ message: pushingSketch(params.sketch.name) });
      await treeModel.sketchbookTree().push(node, true);

      // rename
      progress.report({
        message: nls.localize(
          'arduino/cloudSketch/renaming',
          "Renaming cloud sketch from '{0}' to '{1}'...",
          fromName,
          value
        ),
      });
      await this.createApi.rename(fromPosixPath, toPosixPath);

      // sync
      progress.report({
        message: synchronizingSketchbook,
      });
      this.createApi.sketchCache.init(); // invalidate the cache
      await this.createApi.sketches(); // IDE2 must pull all sketches to find the new one
      const sketch = this.createApi.sketchCache.getSketch(toPosixPath);
      if (!sketch) {
        return undefined;
      }
      await treeModel.refresh();

      // pull
      progress.report({ message: pullingSketch(sketch.name) });
      const pulledNode = await this.pull(sketch);
      return pulledNode
        ? node.uri.parent.resolve(sketch.name).toString()
        : undefined;
    };
  }
}
export namespace RenameCloudSketch {
  export namespace Commands {
    export const RENAME_CLOUD_SKETCH: Command = {
      id: 'lingzhi-rename-cloud-sketch',
    };
  }
}
