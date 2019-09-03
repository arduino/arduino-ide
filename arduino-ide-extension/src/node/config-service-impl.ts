import { injectable, inject } from "inversify";
import { ConfigService, Config } from "../common/protocol/config-service";
import { ArduinoCli } from "./arduino-cli";

@injectable()
export class ConfigServiceImpl implements ConfigService {

    @inject(ArduinoCli)
    protected readonly cli: ArduinoCli;

    async getConfiguration(): Promise<Config> {
        return this.cli.getDefaultConfig();
    }
}