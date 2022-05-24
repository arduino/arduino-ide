import { CompositeTreeNode } from '@theia/core/lib/browser/tree/tree';
import { injectable } from '@theia/core/shared/inversify';
import { PreferenceTreeGenerator as TheiaPreferenceTreeGenerator } from '@theia/preferences/lib/browser/util/preference-tree-generator';

@injectable()
export class PreferenceTreeGenerator extends TheiaPreferenceTreeGenerator {
  protected override async init(): Promise<void> {
    // The IDE2 does not use the default Theia preferences UI.
    // There is no need to create and keep the the tree model synchronized when there is no UI for it.
  }

  // Just returns with the empty root.
  override generateTree(): CompositeTreeNode {
    this._root = this.createRootNode();
    return this._root;
  }
}
