import { injectable, inject } from "inversify";
import { FrontendApplication } from "@theia/core/lib/browser";
import { ArduinoFrontendContribution } from "../arduino-frontend-contribution";

@injectable()
export class CustomFrontendApplication extends FrontendApplication {

    @inject(ArduinoFrontendContribution)
    protected readonly frontendContribution: ArduinoFrontendContribution;

    protected async initializeLayout(): Promise<void> {
        await super.initializeLayout();
        const location = new URL(window.location.href);
        const sketchPath = location.searchParams.get('sketch');
        if (sketchPath) {
            this.frontendContribution.openSketchFiles(decodeURIComponent(sketchPath));
        }
    }
}