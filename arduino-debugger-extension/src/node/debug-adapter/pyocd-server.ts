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

import { AbstractServer } from './abstract-server';
import { PortScanner } from './port-scanner';

const LAUNCH_REGEX = /GDB server started/;
const ERROR_REGEX = /:ERROR:gdbserver:/;
const PERCENT_MULTIPLIER = 100 / 40; // pyOCD outputs 40 markers for progress

export class PyocdServer extends AbstractServer {

    protected portScanner = new PortScanner();
    protected progress = 0;

    protected async resolveServerArguments(serverArguments?: string[]): Promise<string[]> {
        if (!serverArguments) {
            serverArguments = [];
        }

        const telnetPort = await this.portScanner.findFreePort(4444);

        if (!telnetPort) {
            return serverArguments;
        }

        return [
            ...serverArguments,
            '--telnet-port',
            telnetPort.toString()
        ];
    }

    protected onStdout(chunk: string | Buffer) {
        super.onStdout(chunk);
        const buffer = typeof chunk === 'string' ? chunk : chunk.toString('utf8');
        const match = buffer.match(/=/g);

        if (match) {
            this.progress += match.length;
            const percent = Math.round(this.progress * PERCENT_MULTIPLIER);
            this.emit('progress', percent);
        }
    }

    protected serverStarted(data: string): boolean {
        return LAUNCH_REGEX.test(data);
    }

    protected serverError(data: string): boolean {
        return ERROR_REGEX.test(data);
    }
}
