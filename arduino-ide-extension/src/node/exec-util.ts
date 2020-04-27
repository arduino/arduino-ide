import * as os from 'os';
import * as which from 'which';
import * as semver from 'semver';
import { join } from 'path';
import { spawn } from 'child_process';

export async function getExecPath(commandName: string, onError: (error: Error) => void = (error) => console.log(error), versionArg?: string, inBinDir?: boolean): Promise<string> {
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
    const buildVersion = await spawnCommand(`"${buildCommand}"`, [versionArg], onError);
    const buildShortVersion = (buildVersion.match(versionRegexp) || [])[0];
    const pathCommand = await new Promise<string | undefined>(resolve => which(execName, (error, path) => resolve(error ? undefined : path)));
    if (!pathCommand) {
        return buildCommand;
    }
    const pathVersion = await spawnCommand(`"${pathCommand}"`, [versionArg], onError);
    const pathShortVersion = (pathVersion.match(versionRegexp) || [])[0];
    if (semver.gt(pathShortVersion, buildShortVersion)) {
        return pathCommand;
    }
    return buildCommand;
}

export function spawnCommand(command: string, args: string[], onError: (error: Error) => void = (error) => console.log(error)): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const cp = spawn(command, args, { windowsHide: true, shell: true });
        const outBuffers: Buffer[] = [];
        const errBuffers: Buffer[] = [];
        cp.stdout.on('data', (b: Buffer) => outBuffers.push(b));
        cp.stderr.on('data', (b: Buffer) => errBuffers.push(b));
        cp.on('error', error => {
            onError(error);
            reject(error);
        });
        cp.on('exit', (code, signal) => {
            if (code === 0) {
                const result = Buffer.concat(outBuffers).toString('utf8').trim()
                resolve(result);
                return;
            }
            if (errBuffers.length > 0) {
                const message = Buffer.concat(errBuffers).toString('utf8').trim();
                const error = new Error(`Error executing ${command} ${args.join(' ')}: ${message}`);
                onError(error)
                reject(error);
                return;
            }
            if (signal) {
                const error = new Error(`Process exited with signal: ${signal}`);
                onError(error);
                reject(error);
                return;
            }
            if (code) {
                const error = new Error(`Process exited with exit code: ${code}`);
                onError(error);
                reject(error);
                return;
            }
        });
    });
}
