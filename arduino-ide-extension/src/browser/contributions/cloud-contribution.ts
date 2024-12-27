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
import { ResponseService } from '../../common/protocol';

export function sketchAlreadyExists(input: string): string {
  return nls.localize(
    'arduino/cloudSketch/alreadyExists',
    '云草图“{0}”已经存在。',
    input
  );
}
export function sketchNotFound(input: string): string {
  return nls.localize(
    'arduino/cloudSketch/notFound',
    '无法拖动云素描‘{0}’。它不存在。',
    input
  );
}
export const synchronizingSketchbook = nls.localize(
  'arduino/cloudSketch/synchronizingSketchbook',
  '同步草图…'
);
export function pullingSketch(input: string): string {
  return nls.localize(
    'arduino/cloudSketch/pulling',
    "同步草图, 拉取 '{0}'...",
    input
  );
}
export function pushingSketch(input: string): string {
  return nls.localize(
    'arduino/cloudSketch/pushing',
    "同步草图, 推送 '{0}'...",
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
  @inject(ResponseService)
  private readonly responseService: ResponseService;

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
      throw new Error(`找不到具有ID的云草图树节点: ${id}.`);
    }
    if (!CloudSketchbookTree.CloudSketchDirNode.is(node)) {
      throw new Error(`云草图树节点期望表示一个目录,但它没有树节点ID: ${id}.`);
    }
    try {
      await treeModel.sketchbookTree().pull({ node }, true);
      return node;
    } catch (err) {
      if (isNotFound(err)) {
        await treeModel.refresh();
        // this.messageService.error(sketchNotFound(sketch.name));
        const chunk = `${sketchNotFound(sketch.name)}\n`;
        this.responseService.appendToOutput({ chunk });
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
