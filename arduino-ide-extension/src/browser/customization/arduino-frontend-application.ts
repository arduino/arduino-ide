import { injectable, inject } from 'inversify';
import { FileSystem } from '@theia/filesystem/lib/common';
import { FrontendApplication } from '@theia/core/lib/browser';
import { ArduinoFrontendContribution } from '../arduino-frontend-contribution';

@injectable()
export class ArduinoFrontendApplication extends FrontendApplication {

    @inject(ArduinoFrontendContribution)
    protected readonly frontendContribution: ArduinoFrontendContribution;

    @inject(FileSystem)
    protected readonly fileSystem: FileSystem;

    protected async initializeLayout(): Promise<void> {
        await super.initializeLayout();
        const location = new URL(window.location.href);
        const sketchPath = location.searchParams.get('sketch');
        if (sketchPath && await this.fileSystem.exists(sketchPath)) {
            this.frontendContribution.openSketchFiles(decodeURIComponent(sketchPath));
        }
    }

}
