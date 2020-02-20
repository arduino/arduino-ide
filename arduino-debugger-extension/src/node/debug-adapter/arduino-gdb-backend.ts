import * as path from 'path';
import * as fs from 'arduino-ide-extension/lib/node/fs-extra'
import * as mi from './mi';
import { spawn } from 'child_process';
import { GDBBackend } from 'cdt-gdb-adapter/dist/GDBBackend';
import { ArduinoLaunchRequestArguments } from './arduino-debug-session';

export class ArduinoGDBBackend extends GDBBackend {

    public spawn(requestArgs: ArduinoLaunchRequestArguments) {
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

    public pause() {
        mi.sendExecInterrupt(this);
        return true;
    }

}
