import * as os from 'os';
import * as which from 'which';
import * as semver from 'semver';
import { spawn } from 'child_process';
import { join } from 'path';
import { ILogger } from '@theia/core';

export async function getExecPath(commandName: string, logger: ILogger, versionArg?: string, inBinDir?: boolean): Promise<string> {
    const execName = `${commandName}${os.platform() === 'win32' ? '.exe' : ''}`;
    const relativePath = ['..', '..', 'build'];
    if (inBinDir) {
        relativePath.push('bin');
    }
    const buildCommand = join(__dirname, ...relativePath, execName);
    if (!versionArg) {
        return buildCommand;
    }
    const versionRegexp = /\d+\.\d+\.\d+/;
    const buildVersion = await spawnCommand(`"${buildCommand}"`, [versionArg], logger);
    const buildShortVersion = (buildVersion.match(versionRegexp) || [])[0];
    const pathCommand = await new Promise<string | undefined>(resolve => which(execName, (error, path) => resolve(error ? undefined : path)));
    if (!pathCommand) {
        return buildCommand;
    }
    const pathVersion = await spawnCommand(`"${pathCommand}"`, [versionArg], logger);
    const pathShortVersion = (pathVersion.match(versionRegexp) || [])[0];
    if (semver.gt(pathShortVersion, buildShortVersion)) {
        return pathCommand;
    }
    return buildCommand;
}

export function spawnCommand(command: string, args: string[], logger: ILogger): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const cp = spawn(command, args, { windowsHide: true, shell: true });
        const buffers: Buffer[] = [];
        cp.stdout.on('data', (b: Buffer) => buffers.push(b));
        cp.on('error', error => {
            logger.error(`Error executing ${command} with args: ${JSON.stringify(args)}.`, error);
            reject(error);
        });
        cp.on('exit', (code, signal) => {
            if (code === 0) {
                const result = Buffer.concat(buffers).toString('utf8').trim()
                resolve(result);
                return;
            }
            if (signal) {
                logger.error(`Unexpected signal '${signal}' when executing ${command} with args: ${JSON.stringify(args)}.`);
                reject(new Error(`Process exited with signal: ${signal}`));
                return;
            }
            if (code) {
                logger.error(`Unexpected exit code '${code}' when executing ${command} with args: ${JSON.stringify(args)}.`);
                reject(new Error(`Process exited with exit code: ${code}`));
                return;
            }
        });
    });
}
