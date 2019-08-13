import { join } from 'path';
import { exec, spawn, SpawnOptions } from 'child_process';
import { inject, injectable, named } from 'inversify';
import { ILogger } from '@theia/core/lib/common/logger';
import { BackendApplicationContribution } from '@theia/core/lib/node';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { environment } from '@theia/application-package/lib/environment';
import { DaemonLog } from './daemon-log';
import { ToolOutputServiceServer } from '../common/protocol/tool-output-service';
import { ArduinoCliContribution } from './arduino-cli-contribution';
import { ArduinoCli } from './arduino-cli';

@injectable()
export class ArduinoDaemon implements BackendApplicationContribution {

    @inject(ILogger)
    @named('daemon')
    protected readonly logger: ILogger

    @inject(ArduinoCli)
    protected readonly cli: ArduinoCli;

    @inject(ArduinoCliContribution)
    protected readonly cliContribution: ArduinoCliContribution;

    @inject(ToolOutputServiceServer)
    protected readonly toolOutputService: ToolOutputServiceServer;

    protected isReady = new Deferred<boolean>();

    async onStart() {
        try {
            if (!this.cliContribution.debugCli) {
                const executable = await this.cli.getExecPath();
                this.logger.info(`>>> Starting 'arduino-cli' daemon... [${executable}]`);
                const daemon = exec(`${executable} --debug daemon`, (err, stdout, stderr) => {
                    if (err || stderr) {
                        console.log(err || new Error(stderr));
                        return;
                    }
                    console.log(stdout);
                });
                const options: SpawnOptions = {
                    env: environment.electron.runAsNodeEnv(),
                    detached: true,
                    stdio: 'ignore'
                }
                const command = process.execPath;
                const cp = spawn(command, [join(__dirname, 'daemon-watcher.js'), String(process.pid), String(daemon.pid)], options);
                cp.unref();

                if (daemon.stdout) {
                    daemon.stdout.on('data', data => {
                        this.toolOutputService.publishNewOutput('daemon', DaemonLog.toPrettyString(data.toString()));
                        DaemonLog.log(this.logger, data.toString());
                    });
                }
                if (daemon.stderr) {
                    daemon.stderr.on('data', data => {
                        this.toolOutputService.publishNewOutput('daemon error', DaemonLog.toPrettyString(data.toString()));
                        DaemonLog.log(this.logger, data.toString());
                    });
                }
                if (daemon.stderr) {
                    daemon.on('exit', (code, signal) => DaemonLog.log(this.logger, `Daemon exited with code: ${code}. Signal was: ${signal}.`));
                }
            }

            await new Promise(resolve => setTimeout(resolve, 2000));
            this.isReady.resolve();
            if (!this.cliContribution.debugCli) {
                this.logger.info(`<<< The 'arduino-cli' daemon is up an running.`);
            } else {
                this.logger.info(`Assuming the 'arduino-cli' already runs in debug mode.`);
            }
        } catch (error) {
            this.isReady.reject(error || new Error('failed to start arduino-cli'));
        }
    }

}
