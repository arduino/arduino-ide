import { interfaces, Container } from '@theia/core/shared/inversify';
import { CloudSketchbookTreeWidget } from './cloud-sketchbook-tree-widget';
import { CloudSketchbookTree } from './cloud-sketchbook-tree';
import { CloudSketchbookTreeModel } from './cloud-sketchbook-tree-model';
import { createSketchbookTreeContainer } from '../sketchbook/sketchbook-tree-container';
import { SketchbookTree } from '../sketchbook/sketchbook-tree';
import { SketchbookTreeModel } from '../sketchbook/sketchbook-tree-model';
import { SketchbookTreeWidget } from '../sketchbook/sketchbook-tree-widget';

function createCloudSketchbookTreeContainer(
  parent: interfaces.Container
): Container {
  const child = createSketchbookTreeContainer(parent);
  child.bind(CloudSketchbookTree).toSelf();
  child.rebind(SketchbookTree).toService(CloudSketchbookTree);
  child.bind(CloudSketchbookTreeModel).toSelf();
  child.rebind(SketchbookTreeModel).toService(CloudSketchbookTreeModel);
  child.bind(CloudSketchbookTreeWidget).toSelf();
  child.rebind(SketchbookTreeWidget).toService(CloudSketchbookTreeWidget);
  return child;
}

export function createCloudSketchbookTreeWidget(
  parent: interfaces.Container
): CloudSketchbookTreeWidget {
  return createCloudSketchbookTreeContainer(parent).get(
    CloudSketchbookTreeWidget
  );
}
