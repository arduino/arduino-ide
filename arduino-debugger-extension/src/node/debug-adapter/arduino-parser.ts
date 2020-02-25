import { ChildProcessWithoutNullStreams } from 'child_process';
import { Readable } from 'stream';
import { MIParser } from "cdt-gdb-adapter/dist/MIParser";

const READY_TIMEOUT = 7000;
const LINE_REGEX = /(.*)(\r?\n)/;

export class ArduinoParser extends MIParser {

    parseFull(proc: ChildProcessWithoutNullStreams): Promise<void> {
        return new Promise((resolve, reject) => {
            proc.on('error', reject);
            let ready = false;
            proc.on('exit', () => {
                if (!ready) {
                    reject(new Error('The gdb debugger terminated unexpectedly.'));
                }
            });

            const timeout = setTimeout(() => {
                reject(new Error(`No response from gdb after ${READY_TIMEOUT} ms.`));
            }, READY_TIMEOUT);
            this.waitReady = () => {
                ready = true;
                clearTimeout(timeout);
                resolve();
            }
            this.readInputStream(proc.stdout);
            this.readErrorStream(proc.stderr, reject);
        });
    }

    private readInputStream(stream: Readable) {
        let buff = '';
        stream.on('data', chunk => {
            buff += chunk.toString();
            let regexArray = LINE_REGEX.exec(buff);
            while (regexArray) {
                this.line = regexArray[1];
                this.pos = 0;
                this.handleLine();
                buff = buff.substring(regexArray[1].length + regexArray[2].length);
                regexArray = LINE_REGEX.exec(buff);
            }
        });
    }

    private readErrorStream(stream: Readable, reject: (reason?: any) => void) {
        let buff = '';
        stream.on('data', chunk => {
            buff += chunk.toString();
            let regexArray = LINE_REGEX.exec(buff);
            while (regexArray) {
                const line = regexArray[1];
                this.gdb.emit('consoleStreamOutput', line + '\n', 'stderr');
                if (line.toLowerCase().startsWith('error')) {
                    reject(new Error(line));
                }
                buff = buff.substring(regexArray[1].length + regexArray[2].length);
                regexArray = LINE_REGEX.exec(buff);
            }
        });
    }

}
