import { injectable } from "inversify";
import { DebugFrontendApplicationContribution } from '@theia/debug/lib/browser/debug-frontend-application-contribution';
import { DebugSessionOptions } from "@theia/debug/lib/browser/debug-session-options";

@injectable()
export class ArduinoDebugFrontendApplicationContribution extends DebugFrontendApplicationContribution {

    async start(noDebug?: boolean, debugSessionOptions?: DebugSessionOptions): Promise<void> {
        let current = debugSessionOptions ? debugSessionOptions : this.configurations.current;
        // If no configurations are currently present, create the `launch.json` and prompt users to select the config.
        if (!current) {
            await this.configurations.addConfiguration();
            await this.configurations.load()
            current = this.configurations.current;
        }
        if (current) {
            if (noDebug !== undefined) {
                current = {
                    ...current,
                    configuration: {
                        ...current.configuration,
                        noDebug
                    }
                };
            }
            await this.manager.start(current);
        }
    }

}