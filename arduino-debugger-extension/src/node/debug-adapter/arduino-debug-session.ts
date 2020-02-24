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

    protected get arduinoBackend(): ArduinoGDBBackend {
        return this.gdb as ArduinoGDBBackend;
    }

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

    protected async disconnectRequest(response: DebugProtocol.DisconnectResponse): Promise<void> {
        try {
            if (this.isRunning) {
                // Need to pause first
                const waitPromise = new Promise(resolve => this.waitPaused = resolve);
                this.gdb.pause();
                await waitPromise;
            }
            try {
                await this.arduinoBackend.sendTargetDetach();
            } catch (e) {
                // Need to catch here as the command result being returned will never exist as it's detached
            }
            await this.gdb.sendGDBExit();
            this.sendResponse(response);
        } catch (err) {
            this.sendErrorResponse(response, 1, err.message);
        }
    }

}
