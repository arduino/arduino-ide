import { injectable } from '@theia/core/shared/inversify';
import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { OutlineViewContribution as TheiaOutlineViewContribution } from '@theia/outline-view/lib/browser/outline-view-contribution';

@injectable()
export class OutlineViewContribution extends TheiaOutlineViewContribution {
  constructor() {
    super();
    this.options.defaultWidgetOptions = {
      area: 'left',
      rank: 500,
    };
  }

  override async initializeLayout(app: FrontendApplication): Promise<void> {
    // NOOP
  }
}
