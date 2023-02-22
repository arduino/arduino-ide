import { CompositeTreeNode } from '@theia/core/lib/browser/tree';
import { nls } from '@theia/core/lib/common/nls';
import { inject, injectable } from '@theia/core/shared/inversify';
import { CreateApi } from '../create/create-api';
import { CreateFeatures } from '../create/create-features';
import { CreateUri } from '../create/create-uri';
import { Create, isNotFound } from '../create/typings';
import { CloudSketchbookTree } from '../widgets/cloud-sketchbook/cloud-sketchbook-tree';
import { CloudSketchbookTreeModel } from '../widgets/cloud-sketchbook/cloud-sketchbook-tree-model';
import { CloudSketchbookTreeWidget } from '../widgets/cloud-sketchbook/cloud-sketchbook-tree-widget';
import { SketchbookWidget } from '../widgets/sketchbook/sketchbook-widget';
import { SketchbookWidgetContribution } from '../widgets/sketchbook/sketchbook-widget-contribution';
import { SketchContribution } from './contribution';

export function sketchAlreadyExists(input: string): string {
  return nls.localize(
    'arduino/cloudSketch/alreadyExists',
    "Cloud sketch '{0}' already exists.",
    input
  );
}
export function sketchNotFound(input: string): string {
  return nls.localize(
    'arduino/cloudSketch/notFound',
    "Could not pull the cloud sketch '{0}'. It does not exist.",
    input
  );
}
export const synchronizingSketchbook = nls.localize(
  'arduino/cloudSketch/synchronizingSketchbook',
  'Synchronizing sketchbook...'
);
export function pullingSketch(input: string): string {
  return nls.localize(
    'arduino/cloudSketch/pulling',
    "Synchronizing sketchbook, pulling '{0}'...",
    input
  );
}
export function pushingSketch(input: string): string {
  return nls.localize(
    'arduino/cloudSketch/pushing',
    "Synchronizing sketchbook, pushing '{0}'...",
    input
  );
}

@injectable()
export abstract class CloudSketchContribution extends SketchContribution {
  @inject(SketchbookWidgetContribution)
  private readonly widgetContribution: SketchbookWidgetContribution;
  @inject(CreateApi)
  protected readonly createApi: CreateApi;
  @inject(CreateFeatures)
  protected readonly createFeatures: CreateFeatures;

  protected async treeModel(): Promise<
    (CloudSketchbookTreeModel & { root: CompositeTreeNode }) | undefined
  > {
    const { enabled, session } = this.createFeatures;
    if (enabled && session) {
      const widget = await this.widgetContribution.widget;
      const treeModel = this.treeModelFrom(widget);
      if (treeModel) {
        const root = treeModel.root;
        if (CompositeTreeNode.is(root)) {
          return treeModel as CloudSketchbookTreeModel & {
            root: CompositeTreeNode;
          };
        }
      }
    }
    return undefined;
  }

  protected async pull(
    sketch: Create.Sketch
  ): Promise<CloudSketchbookTree.CloudSketchDirNode | undefined> {
    const treeModel = await this.treeModel();
    if (!treeModel) {
      return undefined;
    }
    const id = CreateUri.toUri(sketch).path.toString();
    const node = treeModel.getNode(id);
    if (!node) {
      throw new Error(
        `Could not find cloud sketchbook tree node with ID: ${id}.`
      );
    }
    if (!CloudSketchbookTree.CloudSketchDirNode.is(node)) {
      throw new Error(
        `Cloud sketchbook tree node expected to represent a directory but it did not. Tree node ID: ${id}.`
      );
    }
    try {
      await treeModel.sketchbookTree().pull({ node });
      return node;
    } catch (err) {
      if (isNotFound(err)) {
        await treeModel.refresh();
        this.messageService.error(sketchNotFound(sketch.name));
        return undefined;
      }
      throw err;
    }
  }

  private treeModelFrom(
    widget: SketchbookWidget
  ): CloudSketchbookTreeModel | undefined {
    for (const treeWidget of widget.getTreeWidgets()) {
      if (treeWidget instanceof CloudSketchbookTreeWidget) {
        const model = treeWidget.model;
        if (model instanceof CloudSketchbookTreeModel) {
          return model;
        }
      }
    }
    return undefined;
  }
}
