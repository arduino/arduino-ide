/*
* CMSIS Debug Adapter
* Copyright (c) 2017-2019 Marcel Ball
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

import { spawnSync } from 'child_process';
import { platform, EOL } from 'os';
import { dirname, normalize, basename } from 'path';

export enum SymbolType {
    Function,
    File,
    Object,
    Normal
}

export enum SymbolScope {
    Local,
    Global,
    Neither,
    Both
}

export interface SymbolInformation {
    address: number;
    length: number;
    name: string;
    section: string;
    type: SymbolType;
    scope: SymbolScope;
    file?: string;
    hidden: boolean;
}

const DEFAULT_OBJDUMP = platform() !== 'win32' ? 'arm-none-eabi-objdump' : 'arm-none-eabi-objdump.exe';
const SYMBOL_REGEX = /^([0-9a-f]{8})\s([lg\ !])([w\ ])([C\ ])([W\ ])([I\ ])([dD\ ])([FfO\ ])\s([^\s]+)\s([0-9a-f]+)\s(.*)\r?$/;

const TYPE_MAP: { [id: string]: SymbolType } = {
    'F': SymbolType.Function,
    'f': SymbolType.File,
    'O': SymbolType.Object,
    ' ': SymbolType.Normal
};

const SCOPE_MAP: { [id: string]: SymbolScope } = {
    'l': SymbolScope.Local,
    'g': SymbolScope.Global,
    ' ': SymbolScope.Neither,
    '!': SymbolScope.Both
};

export class SymbolTable {

    private symbols: SymbolInformation[] = [];

    constructor(private program: string, private objdump: string = DEFAULT_OBJDUMP) {
    }

    public async loadSymbols(): Promise<void> {
        const results = await this.execute();
        const output = results.toString();
        const lines = output.split(EOL);
        let currentFile: string | undefined;

        for (const line of lines) {
            const match = line.match(SYMBOL_REGEX);
            if (match) {
                if (match[7] === 'd' && match[8] === 'f') {
                    currentFile = match[11].trim();
                }
                const type = TYPE_MAP[match[8]];
                const scope = SCOPE_MAP[match[2]];
                let name = match[11].trim();
                let hidden = false;

                if (name.startsWith('.hidden')) {
                    name = name.substring(7).trim();
                    hidden = true;
                }

                this.symbols.push({
                    address: parseInt(match[1], 16),
                    type: type,
                    scope: scope,
                    section: match[9].trim(),
                    length: parseInt(match[10], 16),
                    name: name,
                    file: scope === SymbolScope.Local ? currentFile : undefined,
                    hidden: hidden
                });
            }
        }
    }

    public getGlobalVariables(): SymbolInformation[] {
        const matches = this.symbols.filter(s => s.type === SymbolType.Object && s.scope === SymbolScope.Global);
        return matches;
    }

    public getStaticVariables(file: string): SymbolInformation[] {
        return this.symbols.filter(s =>
            s.type === SymbolType.Object                                                            // Only load objects
            && s.scope === SymbolScope.Local                                                        // Scoped to this file
            && !s.name.startsWith('.')                                                              // Ignore names beginning with '.'
            && (normalize(s.file || '') === normalize(file) || normalize(s.file || '') === basename(file)));    // Match full path or file name
    }

    private execute(): Promise<string> {
        return new Promise((resolve, reject) => {
            try {
                const { stdout, stderr } = spawnSync(this.objdump, [
                    '--syms',
                    this.program
                ], {
                    cwd: dirname(this.objdump),
                    windowsHide: true
                });

                const error = stderr.toString('utf8');
                if (error) {
                    return reject(new Error(error));
                }

                resolve(stdout.toString('utf8'));
            } catch (error) {
                return reject(new Error(error));
            }
        });
    }
}
