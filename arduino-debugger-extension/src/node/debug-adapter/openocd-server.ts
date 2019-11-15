import { AbstractServer } from './abstract-server';
import { PortScanner } from './port-scanner';

const LAUNCH_REGEX = /GDB server started/;
const ERROR_REGEX = /:ERROR:gdbserver:/;
const PERCENT_MULTIPLIER = 100 / 40; // pyOCD outputs 40 markers for progress

export class OpenocdServer extends AbstractServer {

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
