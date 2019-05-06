import * as os from 'os';
import { exec } from 'child_process';
import { join, resolve } from 'path';
import { inject, injectable, named } from 'inversify';
import { ILogger } from '@theia/core/lib/common/logger';
import { BackendApplicationContribution } from '@theia/core/lib/node';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { DaemonLog } from './daemon-log';
import { ToolOutputServiceServer } from '../common/protocol/tool-output-service';

const EXECUTABLE_PATH = resolve(join(__dirname, '..', '..', 'build', `arduino-cli.${os.platform()}`))

@injectable()
export class ArduinoDaemon implements BackendApplicationContribution {

    @inject(ILogger)
    @named('daemon')
    protected readonly logger: ILogger

    @inject(ToolOutputServiceServer)
    protected readonly toolOutputService: ToolOutputServiceServer;

    protected isReady = new Deferred<boolean>();

    async onStart() {
        try {
            const daemon = exec(`${EXECUTABLE_PATH} --debug daemon`, (err, stdout, stderr) => {
                if (err || stderr) {
                    console.log(err || new Error(stderr));
                    return;
                }
                console.log(stdout);
            });
            if (daemon.stdout) {
                daemon.stdout.on('data', data => {
                    this.toolOutputService.publishNewOutput("daeomn", data.toString());
                    DaemonLog.log(this.logger, data.toString());
                });
            }
            if (daemon.stderr) {
                daemon.stderr.on('data', data => {
                    this.toolOutputService.publishNewOutput("daeomn error", data.toString());
                    DaemonLog.log(this.logger, data.toString());
                });
            }
            if (daemon.stderr) {
                daemon.on('exit', (code, signal) => DaemonLog.log(this.logger, `Daemon exited with code: ${code}. Signal was: ${signal}.`));
            }
            await new Promise((resolve, reject) => setTimeout(resolve, 2000));
            this.isReady.resolve();
        } catch (error) {
            this.isReady.reject(error || new Error('failed to start arduino-cli'));
        }
    }

}
