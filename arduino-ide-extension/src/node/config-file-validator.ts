import * as Ajv from 'ajv';
import * as fs from './fs-extra';
import { injectable } from 'inversify';
import { CLI_CONFIG_SCHEMA_PATH, DefaultCliConfig } from './cli-config';

@injectable()
export class ConfigFileValidator {

    protected readonly function = new Ajv().compile(JSON.parse(fs.readFileSync(CLI_CONFIG_SCHEMA_PATH, 'utf8')));

    async validate(pathOrObject: string | object): Promise<boolean> {
        return this.doValidate(typeof pathOrObject === 'string' ? fs.readFileSync(pathOrObject) : pathOrObject);
    }

    protected async doValidate(object: object): Promise<boolean> {
        const valid = this.function(object);
        if (!valid) {
            return false;
        }
        if (!DefaultCliConfig.is(object)) {
            return false;
        }

        const { directories: { data, downloads, user } } = object;
        for (const path of [data, downloads, user]) {
            const validPath = await this.isValidPath(path);
            if (!validPath) {
                return false;
            }
        }


        const port = typeof object.daemon.port === 'string' ? Number.parseInt(object.daemon.port, 10) : object.daemon.port;
        if (Number.isNaN(port) || port <= 0) {
            return false;
        }
        return true;
    }

    protected async isValidPath(path: string): Promise<boolean> {
        try {
            if (!path.trim()) {
                return false;
            }
            const exists = await fs.exists(path);
            if (!exists) {
                await fs.mkdirp(path);
            }
            return true;
        } catch {
            return false;
        }
    }

}
