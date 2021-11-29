import { ViewContainer } from '@theia/core/lib/browser/view-container';
import { injectable } from '@theia/core/shared/inversify';

import {
  SearchInWorkspaceFactory as TheiaSearchInWorkspaceFactory,
  SEARCH_VIEW_CONTAINER_TITLE_OPTIONS,
} from '@theia/search-in-workspace/lib/browser/search-in-workspace-factory';

@injectable()
export class SearchInWorkspaceFactory extends TheiaSearchInWorkspaceFactory {
  async createWidget(): Promise<ViewContainer> {
    const viewContainer = await super.createWidget();
    viewContainer.setTitleOptions({
      ...SEARCH_VIEW_CONTAINER_TITLE_OPTIONS,
      iconClass: 'fa fa-arduino-search',
    });
    return viewContainer;
  }
}
