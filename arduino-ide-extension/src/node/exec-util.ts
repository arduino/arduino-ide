import { spawn } from 'node:child_process';
import os from 'node:os';
import { join } from 'node:path';

export type ArduinoBinaryName =
  | 'arduino-cli'
  | 'arduino-fwuploader'
  | 'arduino-language-server';
export type ClangBinaryName = 'clangd' | 'clang-format';
export type BinaryName = ArduinoBinaryName | ClangBinaryName;

export function getExecPath(binaryName: BinaryName): string {
  const filename = `${binaryName}${os.platform() === 'win32' ? '.exe' : ''}`;
  return join(__dirname, '..', '..', 'build', filename);
}

export function spawnCommand(
  command: string,
  args: string[],
  onError: (error: Error) => void = (error) => console.log(error),
  stdIn?: string
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const cp = spawn(command, args, { windowsHide: true });
    const outBuffers: Buffer[] = [];
    const errBuffers: Buffer[] = [];
    cp.stdout.on('data', (b: Buffer) => outBuffers.push(b));
    cp.stderr.on('data', (b: Buffer) => errBuffers.push(b));
    cp.on('error', (error) => {
      onError(error);
      reject(error);
    });
    cp.on('exit', (code, signal) => {
      if (code === 0) {
        const result = Buffer.concat(outBuffers).toString('utf8');
        resolve(result);
        return;
      }
      if (errBuffers.length > 0) {
        const message = Buffer.concat(errBuffers).toString('utf8').trim();
        const error = new Error(
          `Error executing ${command} ${args.join(' ')}: ${message}`
        );
        onError(error);
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
    if (stdIn !== undefined) {
      cp.stdin.write(stdIn);
      cp.stdin.end();
    }
  });
}
