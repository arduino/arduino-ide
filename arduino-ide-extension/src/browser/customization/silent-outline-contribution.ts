import { injectable } from 'inversify';
import { OutlineViewContribution } from '@theia/outline-view/lib/browser/outline-view-contribution';
import { FrontendApplication } from '@theia/core/lib/browser';

@injectable()
export class SilentOutlineViewContribution extends OutlineViewContribution {

    async initializeLayout(app: FrontendApplication): Promise<void> {
    }

}

