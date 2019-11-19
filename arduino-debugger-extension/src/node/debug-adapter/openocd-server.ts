import { AbstractServer } from './abstract-server';
import { PortScanner } from './port-scanner';
import { CmsisRequestArguments } from './cmsis-debug-session';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

const LAUNCH_REGEX = /GDB server started/;
const ERROR_REGEX = /:ERROR:gdbserver:/;
const PERCENT_MULTIPLIER = 100 / 40; // pyOCD outputs 40 markers for progress

export class OpenocdServer extends AbstractServer {
    protected portScanner = new PortScanner();
    protected progress = 0;

    protected async resolveServerArguments(req: CmsisRequestArguments): Promise<string[]> {
        let sessionConfigFile = `gdb_port ${req.gdbServerPort!}${"\n"}`;
        const telnetPort = await this.portScanner.findFreePort(4444);
        if (!!telnetPort) {
            sessionConfigFile += `telnet_port ${telnetPort}${"\n"}`
        }
        sessionConfigFile += `echo "GDB server started"${"\n"}`
        
        const tmpdir = await fs.mkdtemp(path.join(os.tmpdir(), "arduino-debugger"));
        const sessionCfgPath = path.join(tmpdir, "gdb.cfg");
        await fs.writeFile(sessionCfgPath, sessionConfigFile);

        let serverArguments = req.gdbServerArguments || [];
        serverArguments.push("--file", sessionCfgPath);
        
        return serverArguments;
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
