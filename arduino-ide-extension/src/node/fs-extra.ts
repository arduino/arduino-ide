import * as fs from 'fs';
import { promisify } from 'util';

export const existsSync = fs.existsSync;
export const lstatSync = fs.lstatSync;
export const readdirSync = fs.readdirSync;
export const statSync = fs.statSync;
export const writeFileSync = fs.writeFileSync;
export const readFileSync = fs.readFileSync;

export const exists = promisify(fs.exists);
export const lstat = promisify(fs.lstat);
export const readdir = promisify(fs.readdir);
export const stat = promisify(fs.stat);
export const writeFile = promisify(fs.writeFile);
export const readFile = promisify(fs.readFile);

export const watchFile = fs.watchFile;
export const unwatchFile = fs.unwatchFile;

export function mkdirp(path: string, timeout: number = 3000): Promise<void> {
    return new Promise((resolve, reject) => {
        let timeoutHandle: NodeJS.Timeout;
        if (timeout > 0) {
            timeoutHandle = setTimeout(() => {
                reject(new Error(`Timeout of ${timeout} ms exceeded while trying to create the directory "${path}"`));
            }, timeout);
        }
        fs.mkdir(path, { recursive: true }, err => {
            clearTimeout(timeoutHandle);
            if (err)
                reject(err);
            else
                resolve();
        });
    });
}

export function mkdirpSync(path: string): void {
    fs.mkdirSync(path, { recursive: true });
}
