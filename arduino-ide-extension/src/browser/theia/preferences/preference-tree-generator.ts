import {
  FrontendApplicationState,
  FrontendApplicationStateService,
} from '@theia/core/lib/browser/frontend-application-state';
import { CompositeTreeNode } from '@theia/core/lib/browser/tree/tree';
import { inject, injectable } from '@theia/core/shared/inversify';
import { PreferenceTreeGenerator as TheiaPreferenceTreeGenerator } from '@theia/preferences/lib/browser/util/preference-tree-generator';

@injectable()
export class PreferenceTreeGenerator extends TheiaPreferenceTreeGenerator {
  private shouldHandleChangedSchemaOnReady = false;
  private state: FrontendApplicationState | undefined;

  @inject(FrontendApplicationStateService)
  private readonly appStateService: FrontendApplicationStateService;

  protected override async init(): Promise<void> {
    this.appStateService.onStateChanged((state) => {
      this.state = state;
      // manually trigger a model (and UI) refresh if it was requested during the startup phase.
      if (this.state === 'ready' && this.shouldHandleChangedSchemaOnReady) {
        this.doHandleChangedSchema();
      }
    });
    return super.init();
  }

  override doHandleChangedSchema(): void {
    if (this.state === 'ready') {
      super.doHandleChangedSchema();
    }
    // don't do anything until the app is `ready`, then invoke `doHandleChangedSchema`.
    this.shouldHandleChangedSchemaOnReady = true;
  }

  override generateTree(): CompositeTreeNode {
    if (this.state === 'ready') {
      return super.generateTree();
    }
    // always create an empty root when the app is not ready.
    this._root = this.createRootNode();
    return this._root;
  }
}
