import { CompositeTreeNode } from '@theia/core/lib/browser/tree/tree';
import { injectable } from '@theia/core/shared/inversify';
import { PreferenceTreeGenerator as TheiaPreferenceTreeGenerator } from '@theia/preferences/lib/browser/util/preference-tree-generator';

@injectable()
export class PreferenceTreeGenerator extends TheiaPreferenceTreeGenerator {
  protected async init(): Promise<void> {
    // Noop
  }
  generateTree(): CompositeTreeNode {
    this._root = this.createRootNode();
    return this._root;
  }
}
