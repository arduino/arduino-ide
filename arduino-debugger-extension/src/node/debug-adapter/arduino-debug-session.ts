import { DebugProtocol } from 'vscode-debugprotocol';
import { GDBDebugSession } from 'cdt-gdb-adapter/dist/GDBDebugSession';
import { GDBBackend } from 'cdt-gdb-adapter/dist/GDBBackend';
import { ArduinoGDBBackend } from './arduino-gdb-backend';

export interface ArduinoLaunchRequestArguments extends DebugProtocol.LaunchRequestArguments {
    arduinoCli?: string;
    sketch?: string;
    fqbn?: string;
    uploadPort?: string;
}

export class ArduinoDebugSession extends GDBDebugSession {

    protected createBackend(): GDBBackend {
        return new ArduinoGDBBackend();
    }

}
