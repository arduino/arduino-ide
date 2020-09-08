import * as path from 'path';
import * as fs from 'arduino-ide-extension/lib/node/fs-extra'
import { spawn } from 'child_process';
import { GDBBackend } from 'cdt-gdb-adapter/dist/GDBBackend';
import { MIFrameInfo } from 'cdt-gdb-adapter/dist/mi';
import { ArduinoLaunchRequestArguments } from './arduino-debug-session';
import { ArduinoParser } from './arduino-parser';

export class ArduinoGDBBackend extends GDBBackend {

    constructor() {
        super();
        this.parser = new ArduinoParser(this);
    }

    spawn(requestArgs: ArduinoLaunchRequestArguments): Promise<void> {
        if (!requestArgs.sketch) {
            throw new Error('Missing argument: sketch');
        }
        if (!requestArgs.fqbn) {
            throw new Error('Missing argument: fqbn')
        }
        const sketchFS = fs.statSync(requestArgs.sketch);
        const sketchDir = sketchFS.isFile() ? path.dirname(requestArgs.sketch) : requestArgs.sketch;
        const command = requestArgs.arduinoCli || 'arduino-cli';
        const args = [
            'debug',
            '-p', requestArgs.uploadPort || 'none',
            '-b', requestArgs.fqbn,
            '--interpreter', 'mi2',
            sketchDir
        ];
        console.log('Starting debugger:', command, JSON.stringify(args));
        const proc = spawn(command, args);
        this.proc = proc;
        this.out = proc.stdin;
        return (this.parser as ArduinoParser).parseFull(proc);
    }

    sendFileExecAndSymbols(): Promise<void> {
        // The program file is already sent by `arduino-cli`
        return Promise.resolve();
    }

    sendExecInterrupt(threadId?: number) {
        let command = '-exec-interrupt';
        if (threadId) {
            command += ` --thread ${threadId}`;
        }
        return this.sendCommand(command);
    }

    sendStackInfoFrame(threadId: number, frameId: number): Promise<{ frame: MIFrameInfo }> {
        const command = `-stack-info-frame --thread ${threadId} --frame ${frameId}`;
        return this.sendCommand(command);
    }

    sendTargetDetach(): Promise<void> {
        return this.sendCommand('-target-detach');
    }

    kill(): void {
        if (!this.proc) {
            return;
        }
        if (process.platform === 'win32') {
            spawn('taskkill', ['/pid', this.proc.pid.toString(), '/f', '/t']);
        } else {
            this.proc.kill('SIGKILL');
        }
    }

}
