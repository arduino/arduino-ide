import { injectable } from 'inversify';
import { FileNavigatorContribution } from '@theia/navigator/lib/browser/navigator-contribution';
import { FrontendApplication } from '@theia/core/lib/browser';

@injectable()
export class SilentNavigatorContribution extends FileNavigatorContribution {

    async initializeLayout(app: FrontendApplication): Promise<void> {
    }

}
