import { DebugConfigurationManager } from "@theia/debug/lib/browser/debug-configuration-manager";
import { injectable } from "inversify";

@injectable()
export class ArduinoDebugConfigurationManager extends DebugConfigurationManager {

    async addConfiguration() {
        const { model } = this;
        if (!model) {
            return;
        }
        await this.doCreate(model);
        await this.updateModels();
    }

}