/*
* CMSIS Debug Adapter
* Copyright (c) 2016 Zoujie
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

import { exec } from 'child_process';

const maxBuffer = 2 * 1024 * 1024;

export class PortScanner {

    public async findFreePort(start: number = 50000, length: number = 100): Promise<number | undefined> {
        const fn = this.getFunction().bind(this);

        for (let i = start; i <= start + length; i++) {
            try {
                // Try to find pid of port
                await fn(i);
            } catch (_e) {
                // Port is free when pid not found
                return i;
            }
        }

        return undefined;
    }

    private getFunction(): (port: number) => Promise<number> {
        switch (process.platform) {
            case 'darwin':
            case 'freebsd':
            case 'sunos': {
                return this.darwin;
                break;
            }
            case 'linux': {
                return this.linux;
                break;
            }
            case 'win32': {
                return this.windows;
                break;
            }
        }

        return () => Promise.resolve(0);
    }

    private async darwin(port: number): Promise<number> {
        const result = await this.execute('netstat -anv -p TCP && netstat -anv -p UDP');

        // Replace header
        const data = this.stripLine(result.toString(), 2);

        const found = this.extractColumns(data, [0, 3, 8], 10)
        .filter(row => !!String(row[0]).match(/^(udp|tcp)/))
        .find(row => {
            const matches = String(row[1]).match(/\.(\d+)$/);
            return (matches && matches[1] === String(port));
        });

        if (found && found[2].length) {
            return parseInt(found[2], 10);
        }

        throw new Error(`pid of port (${port}) not found`);
    }

    private async linux(port: number): Promise<number> {
        // netstat -p ouputs warning if user is no-root
        const result = await this.execute('netstat -tunlp');

        // Replace header
        const data = this.stripLine(result.toString(), 2);

        const columns = this.extractColumns(data, [3, 6], 7)
        .find(column => {
            const matches = String(column[0]).match(/:(\d+)$/);
            return (matches && matches[1] === String(port));
        });

        if (columns && columns[1]) {
            const pid = columns[1].split('/', 1)[0];

            if (pid.length) {
                return parseInt(pid, 10);
            }
        }

        throw new Error(`pid of port (${port}) not found`);
    }

    private async windows(port: number): Promise<number> {
        const result = await this.execute('netstat -ano');

        // Replace header
        const data = this.stripLine(result.toString(), 4);

        const columns = this.extractColumns(data, [1, 4], 5)
        .find(column => {
            const matches = String(column[0]).match(/:(\d+)$/);
            return (matches && matches[1] === String(port));
        });

        if (columns && columns[1].length && parseInt(columns[1], 10) > 0) {
            return parseInt(columns[1], 10);
        }

        throw new Error(`pid of port (${port}) not found`);
    }

    private execute(cmd: string): Promise<string> {
        return new Promise((resolve, reject) => {
            exec(cmd, {
                maxBuffer,
                windowsHide: true
            }, (error: Error | null, stdout: string) => {
                if (error) {
                    return reject(error);
                }

                return resolve(stdout);
            });
        });
    }

    private stripLine(text: string, num: number): string {
        let idx = 0;

        while (num-- > 0) {
            const nIdx = text.indexOf('\n', idx);
            if (nIdx >= 0) {
                idx = nIdx + 1;
            }
        }

        return idx > 0 ? text.substring(idx) : text;
    }

    private extractColumns(text: string, idxes: number[], max: number): string[][] {
        const lines = text.split(/(\r\n|\n|\r)/);
        const columns: string[][] = [];

        if (!max) {
            max = Math.max.apply(null, idxes) + 1;
        }

        lines.forEach(line => {
            const cols = this.split(line, max);
            const column: string[] = [];

            idxes.forEach(idx => {
                column.push(cols[idx] || '');
            });

            columns.push(column);
        });

        return columns;
    }

    private split(line: string, max: number): string[] {
        const cols = line.trim().split(/\s+/);

        if (cols.length > max) {
            cols[max - 1] = cols.slice(max - 1).join(' ');
        }

        return cols;
    }
}
