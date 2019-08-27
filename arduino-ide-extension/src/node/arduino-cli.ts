import * as os from 'os';
import * as which from 'which';
import * as cp from 'child_process';
import { join, delimiter } from 'path';
import { injectable, inject } from 'inversify';
import { ILogger } from '@theia/core';
import { FileUri } from '@theia/core/lib/node/file-uri';
import { Config } from '../common/protocol/config-service';

@injectable()
export class ArduinoCli {

    @inject(ILogger)
    protected logger: ILogger;

    async getExecPath(): Promise<string> {
        const build = join(__dirname, '..', '..', 'build');
        return new Promise<string>((resolve, reject) => {
            which(`arduino-cli${os.platform() === 'win32' ? '.exe' : ''}`, { path: `${process.env.PATH}${delimiter}${build}` }, (err, path) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(path);
            });
        });
    }

    async getDefaultConfig(): Promise<Config> {
        const command = await this.getExecPath();
        return new Promise<Config>((resolve, reject) => {
            cp.execFile(
                command,
                ['config', 'dump', '--format', 'json'],
                { encoding: 'utf8' },
                (error, stdout, stderr) => {

                    if (error) {
                        throw error;
                    }

                    if (stderr) {
                        throw new Error(stderr);
                    }

                    // const { sketchbook_path: sketchDirPath, arduino_data: dataDirPath } = JSON.parse(raw);

                    // https://github.com/arduino/arduino-cli/issues/342
                    // XXX: this is a hack. The CLI provides a non-valid JSON.
                    const config: Partial<Config> = {};
                    const raw = stdout.trim();
                    for (const line of raw.split(/\r?\n/) || []) {
                        // TODO: Named capture groups are avail from ES2018.
                        // const pair = line.match(/(?<key>[^:]+):(?<value>[^,]+),?/);
                        const index = line.indexOf(':');
                        if (index !== -1) {
                            const key = line.substr(0, index).trim();
                            const value = line.substr(index + 1, line.length).trim();
                            if (!!key && !!value) {
                                if (key === 'sketchbook_path') {
                                    config.sketchDirUri = FileUri.create(value).toString();
                                } else if (key === 'arduino_data') {
                                    config.dataDirUri = FileUri.create(value).toString();
                                }
                            }
                        }
                    }

                    if (!config.dataDirUri) {
                        reject(new Error(`Could not parse config. 'arduino_data' was missing from: ${stdout}`));
                        return;
                    }

                    if (!config.sketchDirUri) {
                        reject(new Error(`Could not parse config. 'sketchbook_path' was missing from: ${stdout}`));
                        return;
                    }

                    this.logger.info(`Retrieved the default configuration from the CLI: ${JSON.stringify(config)}`);

                    resolve({ sketchDirUri: config.sketchDirUri, dataDirUri: config.dataDirUri });
                });
        });
    }

}