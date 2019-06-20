import { injectable, inject } from "inversify";
import { FrontendApplication } from "@theia/core/lib/browser";
import { ArduinoFrontendContribution } from "../arduino-frontend-contribution";
import URI from "@theia/core/lib/common/uri";

@injectable()
export class CustomFrontendApplication extends FrontendApplication {

    @inject(ArduinoFrontendContribution)
    protected readonly frontendContribution: ArduinoFrontendContribution;

    protected async initializeLayout(): Promise<void> {
        const location = new URI(window.location.href);
        this.frontendContribution.openSketchFiles(decodeURIComponent(location.query));
    }
}