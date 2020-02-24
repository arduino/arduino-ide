import * as path from 'path';
import * as fs from 'arduino-ide-extension/lib/node/fs-extra'
import { spawn } from 'child_process';
import { GDBBackend } from 'cdt-gdb-adapter/dist/GDBBackend';
import { MIFrameInfo } from 'cdt-gdb-adapter/dist/mi';
import { ArduinoLaunchRequestArguments } from './arduino-debug-session';

export class ArduinoGDBBackend extends GDBBackend {

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
            sketchDir
        ];
        const proc = spawn(command, args);
        this.proc = proc;
        this.out = proc.stdin;
        return this.parser.parse(proc.stdout);
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

    sendStackInfoFrame(gdb: GDBBackend, threadId: number, frameId: number): Promise<{ frame: MIFrameInfo }> {
        const command = `-stack-info-frame --thread ${threadId} --frame ${frameId}`;
        return gdb.sendCommand(command);
    }

    sendTargetDetach(): Promise<void> {
        return this.sendCommand('-target-detach');
    }

}
