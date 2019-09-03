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

                    const { sketchbook_path, arduino_data } = JSON.parse(stdout.trim());

                    if (!sketchbook_path) {
                        reject(new Error(`Could not parse config. 'sketchbook_path' was missing from: ${stdout}`));
                        return;
                    }

                    if (!arduino_data) {
                        reject(new Error(`Could not parse config. 'arduino_data' was missing from: ${stdout}`));
                        return;
                    }

                    resolve({
                        sketchDirUri: FileUri.create(sketchbook_path).toString(),
                        dataDirUri: FileUri.create(arduino_data).toString()
                    });
                });
        });
    }

}
