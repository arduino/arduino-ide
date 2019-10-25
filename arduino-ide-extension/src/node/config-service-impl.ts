import { mkdirpSync, existsSync } from 'fs-extra';
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
    protected init(): void {
        this.cli.getDefaultConfig().then(config => {
            const { dataDirUri, sketchDirUri } = config;
            for (const uri of [dataDirUri, sketchDirUri]) {
                const path = FileUri.fsPath(uri);
                if (!existsSync(path)) {
                    mkdirpSync(path);
                }
            }
            this.config.resolve(config);
        });
    }

    async getConfiguration(): Promise<Config> {
        return this.config.promise;
    }

    async getVersion(): Promise<string> {
        return this.cli.getVersion();
    }

    async isInDataDir(uri: string): Promise<boolean> {
        return this.getConfiguration().then(({ dataDirUri }) => new URI(dataDirUri).isEqualOrParent(new URI(uri)));
    }

    async isInSketchDir(uri: string): Promise<boolean> {
        return this.getConfiguration().then(({ sketchDirUri }) => new URI(sketchDirUri).isEqualOrParent(new URI(uri)));
    }

}
