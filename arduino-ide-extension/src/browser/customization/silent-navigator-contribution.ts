import { injectable, postConstruct } from 'inversify';
import { FileNavigatorContribution } from '@theia/navigator/lib/browser/navigator-contribution';
import { FrontendApplication } from '@theia/core/lib/browser';

@injectable()
export class SilentNavigatorContribution extends FileNavigatorContribution {

    @postConstruct()
    protected async init(): Promise<void> {
        // @ts-ignore
        delete this.toggleCommand; // The `Explorer` should not be accessible via command or keybinding. 
        return super.init();
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
    }

}
