/*
* CMSIS Debug Adapter
* Copyright (c) 2019 Arm Limited
*
* The MIT License (MIT)
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*/

import { normalize } from 'path';
import { DebugProtocol } from 'vscode-debugprotocol';
import { Logger, logger, InitializedEvent, OutputEvent, Scope, TerminatedEvent } from 'vscode-debugadapter';
import { GDBDebugSession, RequestArguments, FrameVariableReference, FrameReference } from 'cdt-gdb-adapter/dist/GDBDebugSession';
import { GDBBackend } from 'cdt-gdb-adapter/dist/GDBBackend';
import { CmsisBackend } from './cmsis-backend';
// import { PyocdServer } from './pyocd-server';
import { PortScanner } from './port-scanner';
import { SymbolTable } from './symbols';
import * as varMgr from 'cdt-gdb-adapter/dist/varManager';
import * as mi from './mi';
import { OpenocdServer } from './openocd-server';

export interface CmsisRequestArguments extends RequestArguments {
    runToMain?: boolean;
    gdbServer?: string;
    gdbServerArguments?: string[];
    gdbServerPort?: number;
    objdump?: string;
}

const GLOBAL_HANDLE_ID = 0xFE;
const STATIC_HANDLES_START = 0x010000;
const STATIC_HANDLES_FINISH = 0x01FFFF;

export class CmsisDebugSession extends GDBDebugSession {

    protected gdbServer = new OpenocdServer();
    protected portScanner = new PortScanner();
    protected symbolTable!: SymbolTable;
    protected globalHandle!: number;

    constructor() {
        super();
    }

    protected createBackend(): GDBBackend {
        return new CmsisBackend();
    }

    protected async launchRequest(response: DebugProtocol.LaunchResponse, args: CmsisRequestArguments): Promise<void> {
        try {
            await this.runSession(args);
            this.sendResponse(response);
        } catch (err) {
            this.sendErrorResponse(response, 1, err.message);
        }
    }

    protected async attachRequest(response: DebugProtocol.AttachResponse, args: CmsisRequestArguments): Promise<void> {
        try {
            await this.runSession(args);
            this.sendResponse(response);
        } catch (err) {
            this.sendErrorResponse(response, 1, err.message);
        }
    }

    protected async configurationDoneRequest(response: DebugProtocol.ConfigurationDoneResponse): Promise<void> {
        try {
            await mi.sendExecContinue(this.gdb);
            this.sendResponse(response);
        } catch (err) {
            this.sendErrorResponse(response, 100, err.message);
        }
    }

    protected async pauseRequest(response: DebugProtocol.PauseResponse, args: DebugProtocol.PauseArguments): Promise<void> {
        try {
            await mi.sendExecInterrupt(this.gdb, args.threadId);
            this.sendResponse(response);
        } catch (err) {
            this.sendErrorResponse(response, 1, err.message);
        }
    }

    protected async stackTraceRequest(response: DebugProtocol.StackTraceResponse, args: DebugProtocol.StackTraceArguments): Promise<void> {
        try {
            this.globalHandle = this.frameHandles.create({
                threadId: -1,
                frameId: -1
            });

            return super.stackTraceRequest(response, args);
        } catch (err) {
            this.sendErrorResponse(response, 1, err.message);
        }
    }

    protected async setBreakPointsRequest(response: DebugProtocol.SetBreakpointsResponse, args: DebugProtocol.SetBreakpointsArguments): Promise<void> {
        await super.setBreakPointsRequest(response, args);
        return;
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
                    new Scope('Static', STATIC_HANDLES_START + parseInt(args.frameId as any, 10), false)
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
                variables: new Array<DebugProtocol.Variable>()
            };

            const ref = this.variableHandles.get(args.variablesReference);

            if (args.variablesReference === GLOBAL_HANDLE_ID) {
                // Use hardcoded global handle to load and store global variables
                response.body.variables = await this.getGlobalVariables(this.globalHandle);
            } else if (args.variablesReference >= STATIC_HANDLES_START && args.variablesReference <= STATIC_HANDLES_FINISH) {
                // Use STATIC_HANDLES_START to shift the framehandles back
                const frameHandle = args.variablesReference - STATIC_HANDLES_START;
                response.body.variables = await this.getStaticVariables(frameHandle);
            } else if (ref && ref.type === 'frame') {
                // List variables for current frame
                response.body.variables = await this.handleVariableRequestFrame(ref);
            } else if (ref && ref.varobjName === '__pins') {
                response.body.variables = await this.handlePinStatusRequest();
            } else if (ref && ref.type === 'object') {
                // List data under any variable
                response.body.variables = await this.handleVariableRequestObject(ref);
            }

            this.sendResponse(response);
        } catch (err) {
            this.sendErrorResponse(response, 1, err.message);
        }
    }

    protected async evaluateRequest(response: DebugProtocol.EvaluateResponse, args: DebugProtocol.EvaluateArguments): Promise<void> {
        try {
            if (args.context === 'repl') {
                const command = args.expression;
                const output = await mi.sendUserInput(this.gdb, command);
                if (typeof output === 'undefined') {
                    response.body = {
                        result: '',
                        variablesReference: 0
                    };
                } else {
                    response.body = {
                        result: JSON.stringify(output),
                        variablesReference: 0
                    };
                }

                this.sendResponse(response);
            } else {
                return super.evaluateRequest(response, args);
            }
        } catch (err) {
            this.sendErrorResponse(response, 1, err.message);
        }
    }

    protected async disconnectRequest(response: DebugProtocol.DisconnectResponse, args: DebugProtocol.DisconnectArguments): Promise<void> {
        try {
            this.stopSession();
            if (!args || !args.restart) {
                this.sendEvent(new TerminatedEvent());
            }
            this.sendResponse(response);
        } catch (err) {
            this.sendErrorResponse(response, 1, err.message);
        }
    }

    private async runSession(args: CmsisRequestArguments): Promise<void> {
        logger.setup(args.verbose ? Logger.LogLevel.Verbose : Logger.LogLevel.Warn, args.logFile || false);

        this.gdb.on('consoleStreamOutput', (output, category) => this.sendEvent(new OutputEvent(output, category)));
        this.gdb.on('execAsync', (resultClass, resultData) => this.handleGDBAsync(resultClass, resultData));
        this.gdb.on('notifyAsync', (resultClass, resultData) => this.handleGDBNotify(resultClass, resultData));

        // gdb server has main info channel on stderr
        this.gdbServer.on('stderr', data => {
            this.sendEvent(new OutputEvent(data, 'stdout'))
        });
        this.gdbServer.on('error', message => {
            this.sendEvent(new TerminatedEvent());
            throw message;
        });

        try {
            this.symbolTable = new SymbolTable(args.program, args.objdump);
            await this.symbolTable.loadSymbols();
        } catch (error) {
            this.sendEvent(new OutputEvent(`Unable to load debug symbols: ${error.message}`));
        }

        const port = await this.portScanner.findFreePort();
        if (!port) {
            throw new Error('Unable to find a free port to use for debugging');
        }
        this.sendEvent(new OutputEvent(`Selected port ${port} for debugging`));

        const remote = `localhost:${port}`;

        // Set gdb arguments
        if (!args.gdbArguments) {
            args.gdbArguments = [];
        }
        args.gdbArguments.push('-q', args.program);

        // Set gdb server arguments
        if (!args.gdbServerArguments) {
            args.gdbServerArguments = [];
        }
        args.gdbServerPort = port;

        // Start gdb client and server
        this.progressEvent(0, 'Starting Debugger');
        this.sendEvent(new OutputEvent(`Starting debugger: ${JSON.stringify(args)}`));
        await this.gdbServer.spawn(args);
        await this.spawn(args);

        // Send commands
        await mi.sendTargetAsyncOn(this.gdb);
        await mi.sendTargetSelectRemote(this.gdb, remote);
        await mi.sendMonitorResetHalt(this.gdb);
        this.sendEvent(new OutputEvent(`Attached to debugger on port ${port}`));

        // Download image
        const progressListener = (percent: number) => this.progressEvent(percent, 'Loading Image');
        progressListener(0);
        this.gdbServer.on('progress', progressListener);
        await mi.sendTargetDownload(this.gdb);
        this.gdbServer.off('progress', progressListener);
        progressListener(100);

        // Halt after image download
        await mi.sendMonitorResetHalt(this.gdb);
        await this.gdb.sendEnablePrettyPrint();

        if (args.runToMain === true) {
            await mi.sendBreakOnFunction(this.gdb);
        }

        this.sendEvent(new OutputEvent(`Image loaded: ${args.program}`));
        this.sendEvent(new InitializedEvent());
    }

    private async getGlobalVariables(frameHandle: number): Promise<DebugProtocol.Variable[]> {
        const frame = this.frameHandles.get(frameHandle);
        const symbolInfo = this.symbolTable.getGlobalVariables();
        const variables: DebugProtocol.Variable[] = [];

        for (const symbol of symbolInfo) {
            const name = `global_var_${symbol.name}`;
            const variable = await this.getVariables(frame, name, symbol.name, -1);
            variables.push(variable);
        }

        return variables;
    }

    private async handlePinStatusRequest(): Promise<DebugProtocol.Variable[]> {
        const variables: DebugProtocol.Variable[] = [];
        variables.push({
            name: "D2",
            type: "gpio",
            value: "0x00",
            variablesReference: 0
        })
        return variables;
    }

    private async getStaticVariables(frameHandle: number): Promise<DebugProtocol.Variable[]> {
        const frame = this.frameHandles.get(frameHandle);
        const result = await mi.sendStackInfoFrame(this.gdb, frame.threadId, frame.frameId);
        const file = normalize(result.frame.file || '');
        const symbolInfo = this.symbolTable.getStaticVariables(file);
        const variables: DebugProtocol.Variable[] = [];

        // Fetch stack depth to obtain frameId/threadId/depth tuple
        const stackDepth = await mi.sendStackInfoDepth(this.gdb, { maxDepth: 100 });
        const depth = parseInt(stackDepth.depth, 10);

        for (const symbol of symbolInfo) {
            const name = `${file}_static_var_${symbol.name}`;
            const variable = await this.getVariables(frame, name, symbol.name, depth);
            variables.push(variable);
        }

        return variables;
    }

    private async getVariables(frame: FrameReference, name: string, expression: string, depth: number): Promise<DebugProtocol.Variable> {
        let global = varMgr.getVar(frame.frameId, frame.threadId, depth, name);

        if (global) {
            // Update value if it is already loaded
            const vup = await mi.sendVarUpdate(this.gdb, { name });
            const update = vup.changelist[0];
            if (update && update.in_scope === 'true' && update.name === global.varname) {
                global.value = update.value;
            }
        } else {
            // create var in GDB and store it in the varMgr
            const varCreateResponse = await mi.sendVarCreate(this.gdb, {
                name,
                frame: 'current',
                expression,
            });

            global = varMgr.addVar(frame.frameId, frame.threadId, depth, name, true, false, varCreateResponse);
        }

        return {
            name: expression,
            value: (global.value === void 0) ? '<unknown>' : global.value,
            type: global.type,
            variablesReference: parseInt(global.numchild, 10) > 0
                ? this.variableHandles.create({
                    frameHandle: this.globalHandle,
                    type: 'object',
                    varobjName: global.varname,
                })
                : 0,
        };
    }

    private progressEvent(percent: number, message: string) {
        this.sendEvent(new OutputEvent('progress', 'telemetry', {
            percent,
            message
        }));
    }

    protected async stopSession() {
        // Pause debugging
        if (this.isRunning) {
            // Need to pause first
            const waitPromise = new Promise(resolve => this.waitPaused = resolve);
            this.gdb.pause();
            await waitPromise;
        }

        // Detach
        if ((this.gdb as CmsisBackend).isRunning) {
            try {
                await mi.sendTargetDetach(this.gdb);
            } catch (e) {
                // Need to catch here as the command result being returned will never exist as it's detached
            }
        }

        // Stop gdb client and server - we give GDB five seconds to exit orderly before we kill the GDB server
        setTimeout(() => this.gdbServer.kill(), 5000);
        try {
            await this.gdb.sendGDBExit();
        } catch (e) {
            // Need to catch here in case the connection has already been closed
        }
    }

    public async shutdown() {
        await this.stopSession();
        super.shutdown();
    }
}
