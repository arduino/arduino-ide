import * as os from 'os';
import * as which from 'which';
import { spawn } from 'child_process';
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

    async getVersion(): Promise<string> {
        const execPath = await this.getExecPath();
        return this.spawn(`"${execPath}"`, ['version']);
        return new Promise<string>((resolve, reject) => {
            const buffers: Buffer[] = [];
            const cp = spawn(`"${execPath}"`, ['version'], { windowsHide: true, shell: true });
            cp.stdout.on('data', (b: Buffer) => buffers.push(b));
            cp.on('error', error => reject(error));
            cp.on('exit', (code, signal) => {
                if (code === 0) {
                    const result = Buffer.concat(buffers).toString('utf8').trim()
                    resolve(result);
                    return;
                }
                if (signal) {
                    reject(new Error(`Process exited with signal: ${signal}`));
                    return;
                }
                if (code) {
                    reject(new Error(`Process exited with exit code: ${code}`));
                    return;
                }
            });
        });
    }

    async getDefaultConfig(): Promise<Config> {
        const execPath = await this.getExecPath();
        const result = await this.spawn(`"${execPath}"`, ['config', 'dump', '--format', 'json']);
        const { sketchbook_path, arduino_data } = JSON.parse(result);
        if (!sketchbook_path) {
            throw new Error(`Could not parse config. 'sketchbook_path' was missing from: ${result}`);
        }
        if (!arduino_data) {
            throw new Error(`Could not parse config. 'arduino_data' was missing from: ${result}`);
        }
        return {
            sketchDirUri: FileUri.create(sketchbook_path).toString(),
            dataDirUri: FileUri.create(arduino_data).toString()
        };
    }

    private spawn(command: string, args?: string[]): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const buffers: Buffer[] = [];
            const cp = spawn(command, args, { windowsHide: true, shell: true });
            cp.stdout.on('data', (b: Buffer) => buffers.push(b));
            cp.on('error', error => {
                this.logger.error(`Error executing ${command} with args: ${JSON.stringify(args)}.`, error);
                reject(error);
            });
            cp.on('exit', (code, signal) => {
                if (code === 0) {
                    const result = Buffer.concat(buffers).toString('utf8').trim()
                    resolve(result);
                    return;
                }
                if (signal) {
                    this.logger.error(`Unexpected signal '${signal}' when executing ${command} with args: ${JSON.stringify(args)}.`);
                    reject(new Error(`Process exited with signal: ${signal}`));
                    return;
                }
                if (code) {
                    this.logger.error(`Unexpected exit code '${code}' when executing ${command} with args: ${JSON.stringify(args)}.`);
                    reject(new Error(`Process exited with exit code: ${code}`));
                    return;
                }
            });
        });
    }

}
