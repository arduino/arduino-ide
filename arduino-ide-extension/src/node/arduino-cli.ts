import * as os from 'os';
import * as which from 'which';
import * as cp from 'child_process';
import { join, delimiter } from 'path';
import { injectable } from 'inversify';

@injectable()
export class ArduinoCli {

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

    async getDefaultConfig(): Promise<ArduinoCli.Config> {
        const command = await this.getExecPath();
        return new Promise<ArduinoCli.Config>((resolve, reject) => {
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
                    const config: Partial<ArduinoCli.Config> = {};
                    const raw = stdout.trim();
                    for (const line of raw.split(/\r?\n/) || []) {
                        // TODO: Named capture groups are avail from ES2018.
                        // const pair = line.match(/(?<key>[^:]+):(?<value>[^,]+),?/);
                        const pair = line.split(':').map(entry => entry.trim());
                        if (pair[0] === 'sketchbook_path') {
                            config.sketchDirPath = pair[1];
                        } else if (pair[0] === 'arduino_data') {
                            config.dataDirPath = pair[1];
                        }
                    }

                    if (!config.dataDirPath) {
                        reject(new Error(`Could not parse config. 'arduino_data' was missing from: ${stdout}`));
                        return;
                    }

                    if (!config.sketchDirPath) {
                        reject(new Error(`Could not parse config. 'sketchbook_path' was missing from: ${stdout}`));
                        return;
                    }

                    resolve({ sketchDirPath: config.sketchDirPath, dataDirPath: config.dataDirPath });
                });
        });
    }

}

export namespace ArduinoCli {
    export interface Config {
        sketchDirPath: string;
        dataDirPath: string;
    }
}
