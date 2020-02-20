import * as mi from 'cdt-gdb-adapter/dist/mi';
import { DebugProtocol } from 'vscode-debugprotocol';
import { GDBDebugSession, LaunchRequestArguments } from 'cdt-gdb-adapter/dist/GDBDebugSession';
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

    protected launchRequest(response: DebugProtocol.LaunchResponse, args: LaunchRequestArguments): Promise<void> {
        const additionalCommands = [
            '-interpreter-exec console "monitor reset halt"'
        ];
        if (!args.initCommands) {
            args.initCommands = additionalCommands;
        } else {
            args.initCommands.push(...additionalCommands);
        }
        return super.launchRequest(response, args);
    }

    protected async configurationDoneRequest(response: DebugProtocol.ConfigurationDoneResponse): Promise<void> {
        try {
            await mi.sendExecContinue(this.gdb);
            this.sendResponse(response);
        } catch (err) {
            this.sendErrorResponse(response, 100, err.message);
        }
    }

}
