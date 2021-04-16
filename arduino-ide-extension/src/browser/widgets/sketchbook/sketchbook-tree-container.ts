import { interfaces, Container } from 'inversify';
import { createTreeContainer, Tree, TreeImpl, TreeModel, TreeModelImpl, TreeWidget } from '@theia/core/lib/browser/tree';
import { SketchbookTree } from './sketchbook-tree';
import { SketchbookTreeModel } from './sketchbook-tree-model';
import { SketchbookTreeWidget } from './sketchbook-tree-widget';

export function createSketchbookTreeContainer(parent: interfaces.Container): Container {
    const child = createTreeContainer(parent);

    child.unbind(TreeImpl);
    child.bind(SketchbookTree).toSelf();
    child.rebind(Tree).toService(SketchbookTree);

    child.unbind(TreeModelImpl);
    child.bind(SketchbookTreeModel).toSelf();
    child.rebind(TreeModel).toService(SketchbookTreeModel);

    child.bind(SketchbookTreeWidget).toSelf();
    child.rebind(TreeWidget).toService(SketchbookTreeWidget);

    return child;
}

export function createSketchbookTreeWidget(parent: interfaces.Container): SketchbookTreeWidget {
    return createSketchbookTreeContainer(parent).get(SketchbookTreeWidget);
}
