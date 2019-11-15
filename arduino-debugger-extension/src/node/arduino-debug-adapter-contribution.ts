import { injectable } from 'inversify';
import { DebugAdapterContribution, DebugAdapterExecutable, DebugAdapterSessionFactory } from '@theia/debug/lib/common/debug-model';
import { DebugConfiguration } from "@theia/debug/lib/common/debug-configuration";
import { MaybePromise } from "@theia/core/lib/common/types";
import { IJSONSchema, IJSONSchemaSnippet } from "@theia/core/lib/common/json-schema";
import * as path from 'path';

@injectable()
export class ArduinoDebugAdapterContribution implements DebugAdapterContribution {
    type = "arduino";

    label = "Arduino";

    languages = ["c", "cpp", "ino"];

    debugAdapterSessionFactory?: DebugAdapterSessionFactory;

    getSchemaAttributes?(): MaybePromise<IJSONSchema[]> {
        return [
            {
                "required": [
                    "program"
                ],
                "properties": {
                    "program": {
                        "type": "string",
                        "description": "Path to the program to be launched",
                        "default": "${workspaceFolder}/${command:askProgramPath}"
                    },
                    "sketch": {
                        "type": "string",
                        "description": "Path to the sketch folder",
                        "default": "${workspaceFolder}"
                    },
                    "fbqn": {
                        "type": "string",
                        "description": "Fully qualified board name of the debugging target",
                        "default": "unknown"
                    },
                    "runToMain": {
                        "description": "If enabled the debugger will run until the start of the main function.",
                        "type": "boolean",
                        "default": false
                    },
                    "gdb": {
                        "type": "string",
                        "description": "Path to gdb",
                        "default": "arm-none-eabi-gdb"
                    },
                    "gdbArguments": {
                        "description": "Additional arguments to pass to GDB command line",
                        "type": "array",
                        "default": []
                    },
                    "gdbServer": {
                        "type": "string",
                        "description": "Path to gdb server",
                        "default": "pyocd"
                    },
                    "gdbServerArguments": {
                        "description": "Additional arguments to pass to GDB server",
                        "type": "array",
                        "default": []
                    },
                    "objdump": {
                        "type": "string",
                        "description": "Path to objdump executable",
                        "default": "arm-none-eabi-objdump"
                    },
                    "initCommands": {
                        "description": "Extra gdb commands to run after initialisation",
                        "type": "array",
                        "default": []
                    },
                    "verbose": {
                        "type": "boolean",
                        "description": "Produce verbose log output",
                        "default": "false"
                    },
                    "debugDebugAdapter": {
                        "type": "boolean",
                        "description": "Start the debug adapter in debug mode (with --inspect-brk)",
                        "default": "false"
                    },
                }
            }
        ]
    }

    getConfigurationSnippets?(): MaybePromise<IJSONSchemaSnippet[]> {
        return []
    }

    provideDebugAdapterExecutable(config: DebugConfiguration): MaybePromise<DebugAdapterExecutable> {
        let args: string[] = [];
        if (!!config.debugDebugAdapter) {
            args.push('--inspect-brk')
        }
        args = args.concat([path.join(__dirname, 'debug-adapter', 'index.js')]);

        return {
            command: "node",
            args: args,
        }
    }

    provideDebugConfigurations?(workspaceFolderUri?: string): MaybePromise<DebugConfiguration[]> {
        return [];
    }

    resolveDebugConfiguration?(config: DebugConfiguration, workspaceFolderUri?: string): MaybePromise<DebugConfiguration> {
        return config;
    }

}