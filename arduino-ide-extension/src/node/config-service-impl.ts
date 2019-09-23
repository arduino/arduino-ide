import { injectable, inject } from 'inversify';
import URI from '@theia/core/lib/common/uri';
import { ConfigService, Config } from '../common/protocol/config-service';
import { ArduinoCli } from './arduino-cli';

@injectable()
export class ConfigServiceImpl implements ConfigService {

    @inject(ArduinoCli)
    protected readonly cli: ArduinoCli;

    async getConfiguration(): Promise<Config> {
        return this.cli.getDefaultConfig();
    }

    async isInDataDir(uri: string): Promise<boolean> {
        return this.getConfiguration().then(({ dataDirUri }) => new URI(dataDirUri).isEqualOrParent(new URI(uri)));
    }

    async isInSketchDir(uri: string): Promise<boolean> {
        return this.getConfiguration().then(({ sketchDirUri }) => new URI(sketchDirUri).isEqualOrParent(new URI(uri)));
    }

}
