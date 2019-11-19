import { injectable, inject } from 'inversify';
import { DebugAdapterContribution, DebugAdapterExecutable, DebugAdapterSessionFactory } from '@theia/debug/lib/common/debug-model';
import { DebugConfiguration } from "@theia/debug/lib/common/debug-configuration";
import { MaybePromise } from "@theia/core/lib/common/types";
import { IJSONSchema, IJSONSchemaSnippet } from "@theia/core/lib/common/json-schema";
import * as path from 'path';
import { BoardsService } from 'arduino-ide-extension/lib/common/protocol/boards-service';
import { CoreService } from 'arduino-ide-extension/lib/common/protocol/core-service';
import { FileSystem } from '@theia/filesystem/lib/common';

@injectable()
export class ArduinoDebugAdapterContribution implements DebugAdapterContribution {
    @inject(BoardsService)
    protected readonly boardsService: BoardsService;

    @inject(CoreService)
    protected readonly coreService: CoreService;

    @inject(FileSystem)
    protected readonly fileSystem: FileSystem;

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
                    "sketch": {
                        "type": "string",
                        "description": "path to the sketch root ino file",
                        "default": "${file}",
                    },
                    "runToMain": {
                        "description": "If enabled the debugger will run until the start of the main function.",
                        "type": "boolean",
                        "default": false
                    },
                    "fqbn": {
                        "type": "string",
                        "description": "Fully-qualified board name to debug on",
                        "default": ""
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
        return [
            <DebugConfiguration>{
                name: this.label,
                type: this.type,
                request: "launch",
                
                sketch: "${file}",

                verbose: true,
                runToMain: true,
            },
            <DebugConfiguration>{
                name: this.label + " (explicit)",
                type: this.type,
                request: "launch",
                
                program: "${sketchBinary}",
                objdump: "${boardTools:objdump}",
                gdb: "${boardTools:gdb}",
                gdbServer: "${boardTools:openocd}",
                gdbServerArguments: ["-s", "${boardTools:openocd-scripts}", "--file", "${board:openocd-debug-file}"],
                
                verbose: true,
                runToMain: true,
            }
        ];
    }

    async resolveDebugConfiguration?(config: DebugConfiguration, workspaceFolderUri?: string): Promise<DebugConfiguration> {
        // if program is present we expect to have an explicit config here
        if (!!config.program) {
            return config;
        }

        let sketchBinary = "${sketchBinary}"
        if (config.sketch !== "${file}") {
            sketchBinary = "${sketchBinary:" + config.sketch + "}";
        }
        const res: ActualDebugConfig = {
            ...config,

            objdump: "${boardTools:objdump}",
            gdb: "${boardTools:gdb}",
            gdbServer: "${boardTools:openocd}",
            gdbServerArguments: ["-s", "${boardTools:openocd-scripts}", "--file", "${board:openocd-debug-file}"],
            program: sketchBinary
        }
        return res;
    }

}

interface ActualDebugConfig extends DebugConfiguration {
    // path to the program to be launched
    program: string
    // path to gdb
    gdb: string
    // additional arguments to pass to GDB command line
    gdbArguments?: string[]
    // path to the gdb server
    gdbServer: string
    // additional arguments to pass to GDB server
    gdbServerArguments: string[]
    // path to objdump executable
    objdump: string
    // extra gdb commands to run after initialisation
    initCommands?: string[]
}