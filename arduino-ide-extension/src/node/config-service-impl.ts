import * as fs from './fs-extra';
import { injectable, inject, postConstruct } from 'inversify';
import URI from '@theia/core/lib/common/uri';
import { FileUri } from '@theia/core/lib/node/file-uri';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { ConfigService, Config } from '../common/protocol/config-service';
import { ArduinoCli } from './arduino-cli';

@injectable()
export class ConfigServiceImpl implements ConfigService {

    @inject(ArduinoCli)
    protected readonly cli: ArduinoCli;
    protected readonly config: Deferred<Config> = new Deferred();

    @postConstruct()
    protected async init(): Promise<void> {
        try {
            const config = await this.cli.getDefaultConfig();
            const { dataDirUri, sketchDirUri } = config;
            for (const uri of [dataDirUri, sketchDirUri]) {
                const path = FileUri.fsPath(uri);
                if (!fs.existsSync(path)) {
                    await fs.mkdirp(path);
                }
            }
            this.config.resolve(config);
        } catch (err) {
            this.config.reject(err);
        }
    }

    getConfiguration(): Promise<Config> {
        return this.config.promise;
    }

    getVersion(): Promise<string> {
        return this.cli.getVersion();
    }

    isInDataDir(uri: string): Promise<boolean> {
        return this.getConfiguration().then(({ dataDirUri }) => new URI(dataDirUri).isEqualOrParent(new URI(uri)));
    }

    isInSketchDir(uri: string): Promise<boolean> {
        return this.getConfiguration().then(({ sketchDirUri }) => new URI(sketchDirUri).isEqualOrParent(new URI(uri)));
    }

}
