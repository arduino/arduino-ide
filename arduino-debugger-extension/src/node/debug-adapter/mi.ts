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

import { MIFrameInfo } from 'cdt-gdb-adapter/dist/mi';
import { GDBBackend } from 'cdt-gdb-adapter/dist/GDBBackend';

export function sendTargetAsyncOn(gdb: GDBBackend) {
    const set = 'target-async on';
    return gdb.sendGDBSet(set);
}

export function sendMonitorResetHalt(gdb: GDBBackend) {
    const command = '-interpreter-exec console "monitor reset halt"';
    return gdb.sendCommand(command);
}

export function sendTargetSelectRemote(gdb: GDBBackend, remote: string) {
    const command = `-target-select extended-remote ${remote}`;
    return gdb.sendCommand(command);
}

export function sendTargetDownload(gdb: GDBBackend) {
    const command = '-target-download';
    return gdb.sendCommand(command);
}

export function sendBreakOnFunction(gdb: GDBBackend, fn: string = 'main') {
    const command = `-break-insert -t --function ${fn}`;
    return gdb.sendCommand(command);
}

export function sendExecInterrupt(gdb: GDBBackend, threadId?: number) {
    let command = '-exec-interrupt';
    if (threadId) {
        command += ` --thread ${threadId}`;
    }
    return gdb.sendCommand(command);
}

export function sendStackInfoFrame(gdb: GDBBackend, threadId: number, frameId: number): Promise<{frame: MIFrameInfo}> {
    const command = `-stack-info-frame --thread ${threadId} --frame ${frameId}`;
    return gdb.sendCommand(command);
}

export function sendUserInput(gdb: GDBBackend, command: string): Promise<any> {
    if (!command.startsWith('-')) {
        command = `interpreter-exec console "${command}"`;
    }

    return gdb.sendCommand(command);
}

export function sendTargetDetach(gdb: GDBBackend) {
    const command = '-target-detach';
    return gdb.sendCommand(command);
}

export * from 'cdt-gdb-adapter/dist/mi';
