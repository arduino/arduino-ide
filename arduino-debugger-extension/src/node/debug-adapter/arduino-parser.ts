import { ChildProcessWithoutNullStreams } from 'child_process';
import { Readable } from 'stream';
import { MIParser } from "cdt-gdb-adapter/dist/MIParser";

const LINE_REGEX = /(.*)(\r?\n)/;

export class ArduinoParser extends MIParser {

    protected rejectReady?: (error: Error) => void;

    parseFull(proc: ChildProcessWithoutNullStreams): Promise<void> {
        return new Promise((resolve, reject) => {
            // Detect errors when the child process could not be spawned
            proc.on('error', reject);

            this.waitReady = () => {
                this.rejectReady = undefined;
                resolve();
            }
            this.rejectReady = (error: Error) => {
                this.waitReady = undefined;
                reject(error);
            }
            // Detect unexpected termination
            proc.on('exit', () => {
                if (this.rejectReady) {
                    this.rejectReady(new Error('The gdb debugger terminated unexpectedly.'));
                }
            });
            this.readInputStream(proc.stdout);
            this.readErrorStream(proc.stderr);
        });
    }

    private readInputStream(stream: Readable) {
        let buff = '';
        stream.on('data', chunk => {
            buff += chunk.toString();
            let regexArray = LINE_REGEX.exec(buff);
            while (regexArray) {
                const line = regexArray[1];
                this.line = line;
                this.pos = 0;
                this.handleLine();
                // Detect error emitted as log message
                if (this.rejectReady && line.toLowerCase().startsWith('&"error')) {
                    this.pos = 1;
                    this.rejectReady(new Error(this.handleCString() || regexArray[1]));
                    this.rejectReady = undefined;
                }
                buff = buff.substring(regexArray[1].length + regexArray[2].length);
                regexArray = LINE_REGEX.exec(buff);
            }
        });
    }

    private readErrorStream(stream: Readable) {
        let buff = '';
        stream.on('data', chunk => {
            buff += chunk.toString();
            let regexArray = LINE_REGEX.exec(buff);
            while (regexArray) {
                const line = regexArray[1];
                this.gdb.emit('consoleStreamOutput', line + '\n', 'stderr');
                // Detect error emitted on the stderr stream
                if (this.rejectReady && line.toLowerCase().startsWith('error')) {
                    this.rejectReady(new Error(line));
                    this.rejectReady = undefined;
                }
                buff = buff.substring(regexArray[1].length + regexArray[2].length);
                regexArray = LINE_REGEX.exec(buff);
            }
        });
    }

}
