import { DebugProtocol } from 'vscode-debugprotocol';
import { GDBDebugSession, FrameVariableReference } from 'cdt-gdb-adapter/dist/GDBDebugSession';
import { GDBBackend } from 'cdt-gdb-adapter/dist/GDBBackend';
import * as mi from 'cdt-gdb-adapter/dist/mi';
import { ArduinoGDBBackend } from './arduino-gdb-backend';
import { ArduinoVariableHandler } from './arduino-variable-handler';
import { Scope, OutputEvent } from 'vscode-debugadapter';

export interface ArduinoLaunchRequestArguments extends DebugProtocol.LaunchRequestArguments {
    arduinoCli?: string;
    sketch?: string;
    fqbn?: string;
    uploadPort?: string;
}

const GLOBAL_HANDLE_ID = 0xFE;
const STATIC_HANDLES_START = 0x010000;
const STATIC_HANDLES_FINISH = 0x01FFFF;

export class ArduinoDebugSession extends GDBDebugSession {

    private _variableHandler: ArduinoVariableHandler;

    get arduinoBackend(): ArduinoGDBBackend {
        return this.gdb as ArduinoGDBBackend;
    }

    protected get variableHandler() {
        if (this._variableHandler) {
            return this._variableHandler;
        }
        if (!this.gdb) {
            throw new Error("GDB backend is not ready.");
        }
        const handler = new ArduinoVariableHandler(this, this.frameHandles, this.variableHandles);
        this._variableHandler = handler;
        return handler;
    }

    protected createBackend(): GDBBackend {
        return new ArduinoGDBBackend();
    }

    protected async configurationDoneRequest(response: DebugProtocol.ConfigurationDoneResponse): Promise<void> {
        try {
            await this.gdb.sendCommand('-interpreter-exec console "monitor reset halt"')
            await mi.sendExecContinue(this.gdb);
            this.sendResponse(response);
        } catch (err) {
            this.sendErrorResponse(response, 100, err.message);
        }
    }

    protected pauseRequest(response: DebugProtocol.PauseResponse, args: DebugProtocol.PauseArguments): Promise<void> {
        if (process.platform === 'win32') {
            const message = 'Pause is not supported on Windows. Please stop the debug session and set a breakpoint instead.';
            this.sendEvent(new OutputEvent(message));
            this.sendErrorResponse(response, 1, message);
            return Promise.resolve();
        }
        return super.pauseRequest(response, args);
    }

    protected async disconnectRequest(response: DebugProtocol.DisconnectResponse): Promise<void> {
        try {
            if (this.isRunning) {
                if (process.platform === 'win32') {
                    // We cannot pause on Windows
                    this.arduinoBackend.kill();
                    this.sendResponse(response);
                    return;
                }
                // Need to pause first
                const waitPromise = new Promise(resolve => this.waitPaused = resolve);
                this.gdb.pause();
                await waitPromise;
            }
            await this.gdb.sendGDBExit();
            this.sendResponse(response);
        } catch (err) {
            this.sendErrorResponse(response, 1, err.message);
        }
    }

    protected scopesRequest(response: DebugProtocol.ScopesResponse, args: DebugProtocol.ScopesArguments): void {
        try {
            const frame: FrameVariableReference = {
                type: 'frame',
                frameHandle: args.frameId,
            };
            // const pins: ObjectVariableReference = {
            //     type: "object",
            //     varobjName: "__pins",
            //     frameHandle: 42000,
            // }

            response.body = {
                scopes: [
                    // new Scope('Pins', this.variableHandles.create(pins), false),
                    new Scope('Local', this.variableHandles.create(frame), false),
                    new Scope('Global', GLOBAL_HANDLE_ID, false),
                    // new Scope('Static', STATIC_HANDLES_START + parseInt(args.frameId as any, 10), false)
                ],
            };

            this.sendResponse(response);
        } catch (err) {
            this.sendErrorResponse(response, 1, err.message);
        }
    }

    protected async variablesRequest(response: DebugProtocol.VariablesResponse, args: DebugProtocol.VariablesArguments): Promise<void> {
        try {
            response.body = {
                variables: [] as DebugProtocol.Variable[]
            };
            const ref = this.variableHandles.get(args.variablesReference);
            if (args.variablesReference === GLOBAL_HANDLE_ID) {
                // Use hardcoded global handle to load and store global variables
                response.body.variables = await this.variableHandler.getGlobalVariables();
            } else if (args.variablesReference >= STATIC_HANDLES_START && args.variablesReference <= STATIC_HANDLES_FINISH) {
                // Use STATIC_HANDLES_START to shift the framehandles back
                const frameHandle = args.variablesReference - STATIC_HANDLES_START;
                response.body.variables = await this.variableHandler.getStaticVariables(frameHandle);
            } else if (ref && ref.type === 'frame') {
                // List variables for current frame
                response.body.variables = await this.handleVariableRequestFrame(ref);
            } else if (ref && ref.varobjName === '__pins') {
                response.body.variables = await this.variableHandler.handlePinStatusRequest();
            } else if (ref && ref.type === 'object') {
                // List data under any variable
                response.body.variables = await this.handleVariableRequestObject(ref);
            }
            this.sendResponse(response);
        } catch (err) {
            this.sendErrorResponse(response, 1, err.message);
        }
    }

}
