import { injectable } from 'inversify';
import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { OutlineViewContribution as TheiaOutlineViewContribution } from '@theia/outline-view/lib/browser/outline-view-contribution';

@injectable()
export class OutlineViewContribution extends TheiaOutlineViewContribution {

    constructor() {
        super();
        this.options.defaultWidgetOptions = {
            area: 'left',
            rank: 500
        };
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        // NOOP
    }

}

