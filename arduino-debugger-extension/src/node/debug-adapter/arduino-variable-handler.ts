import * as path from 'path';
import { DebugProtocol } from "vscode-debugprotocol";
import { Handles } from 'vscode-debugadapter/lib/handles';
import { FrameReference, VariableReference } from "cdt-gdb-adapter/dist/GDBDebugSession";
import { VarManager } from 'cdt-gdb-adapter/dist/varManager';
import * as mi from 'cdt-gdb-adapter/dist/mi';
import { ArduinoDebugSession } from "./arduino-debug-session";
import { ArduinoGDBBackend } from './arduino-gdb-backend';

export class ArduinoVariableHandler {

    protected readonly gdb: ArduinoGDBBackend;
    protected readonly varMgr: VarManager;

    protected globalHandle: number;

    constructor(protected readonly session: ArduinoDebugSession,
        protected frameHandles: Handles<FrameReference>,
        protected variableHandles: Handles<VariableReference>) {
        this.gdb = session.arduinoBackend;
        this.varMgr = new VarManager(this.gdb);
    }

    createGlobalHandle() {
        this.globalHandle = this.frameHandles.create({
            threadId: -1,
            frameId: -1
        });
    }

    /** TODO */
    async getGlobalVariables(): Promise<DebugProtocol.Variable[]> {
        throw new Error('Global variables are not supported yet.');
        const frame = this.frameHandles.get(this.globalHandle);
        const symbolInfo: any[] = [] // this.symbolTable.getGlobalVariables();
        const variables: DebugProtocol.Variable[] = [];

        for (const symbol of symbolInfo) {
            const name = `global_var_${symbol.name}`;
            const variable = await this.getVariables(frame, name, symbol.name, -1);
            variables.push(variable);
        }

        return variables;
    }

    /** TODO */
    async getStaticVariables(frameHandle: number): Promise<DebugProtocol.Variable[]> {
        throw new Error('Static variables are not supported yet.');
        const frame = this.frameHandles.get(frameHandle);
        const result = await this.gdb.sendStackInfoFrame(frame.threadId, frame.frameId);
        const file = path.normalize(result.frame.file || '');
        const symbolInfo: any[] = [] // this.symbolTable.getStaticVariables(file);
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
        let global = this.varMgr.getVar(frame.frameId, frame.threadId, depth, name);

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

            global = this.varMgr.addVar(frame.frameId, frame.threadId, depth, name, true, false, varCreateResponse);
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

    async handlePinStatusRequest(): Promise<DebugProtocol.Variable[]> {
        const variables: DebugProtocol.Variable[] = [];
        variables.push({
            name: "D2",
            type: "gpio",
            value: "0x00",
            variablesReference: 0
        })
        return variables;
    }

}
