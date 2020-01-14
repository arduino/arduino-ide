import { injectable, inject } from 'inversify';
import { ILogger } from '@theia/core';
import { FileUri } from '@theia/core/lib/node/file-uri';
import { Config } from '../common/protocol/config-service';
import { spawnCommand, getExecPath } from './exec-util';

@injectable()
export class ArduinoCli {

    @inject(ILogger)
    protected logger: ILogger;

    private execPath: string | undefined;

    async getExecPath(): Promise<string> {
        if (this.execPath) {
            return this.execPath;
        }
        const path = await getExecPath('arduino-cli', this.logger, 'version');
        this.execPath = path;
        return path;
    }

    async getVersion(): Promise<string> {
        const execPath = await this.getExecPath();
        return spawnCommand(`"${execPath}"`, ['version'], this.logger);
    }

    async getDefaultConfig(): Promise<Config> {
        const execPath = await this.getExecPath();
        const result = await spawnCommand(`"${execPath}"`, ['config', 'dump', '--format', 'json'], this.logger);
        const { directories } = JSON.parse(result);
        if (!directories) {
            throw new Error(`Could not parse config. 'directories' was missing from: ${result}`);
        }
        const { user, data } = directories;
        if (!user) {
            throw new Error(`Could not parse config. 'user' was missing from: ${result}`);
        }
        if (!data) {
            throw new Error(`Could not parse config. 'data' was missing from: ${result}`);
        }
        return {
            sketchDirUri: FileUri.create(user).toString(),
            dataDirUri: FileUri.create(data).toString()
        };
    }

}
