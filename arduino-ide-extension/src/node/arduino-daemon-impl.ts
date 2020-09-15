import { join } from 'path';
import { inject, injectable, named } from 'inversify';
import { spawn, ChildProcess } from 'child_process';
import { FileUri } from '@theia/core/lib/node/file-uri';
import { ILogger } from '@theia/core/lib/common/logger';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { Disposable, DisposableCollection } from '@theia/core/lib/common/disposable';
import { Event, Emitter } from '@theia/core/lib/common/event';
import { environment } from '@theia/application-package/lib/environment';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { BackendApplicationContribution } from '@theia/core/lib/node/backend-application';
import { ArduinoDaemon, NotificationServiceServer } from '../common/protocol';
import { DaemonLog } from './daemon-log';
import { CLI_CONFIG } from './cli-config';
import { getExecPath, spawnCommand } from './exec-util';

@injectable()
export class ArduinoDaemonImpl implements ArduinoDaemon, BackendApplicationContribution {

    @inject(ILogger)
    @named('daemon')
    protected readonly logger: ILogger

    @inject(EnvVariablesServer)
    protected readonly envVariablesServer: EnvVariablesServer;

    @inject(NotificationServiceServer)
    protected readonly notificationService: NotificationServiceServer;

    protected readonly toDispose = new DisposableCollection();
    protected readonly onDaemonStartedEmitter = new Emitter<void>();
    protected readonly onDaemonStoppedEmitter = new Emitter<void>();

    protected _running = false;
    protected _ready = new Deferred<void>();
    protected _execPath: string | undefined;

    // Backend application lifecycle.

    onStart(): void {
        this.startDaemon();
    }

    // Daemon API

    async isRunning(): Promise<boolean> {
        return Promise.resolve(this._running);
    }

    async startDaemon(): Promise<void> {
        try {
            this.toDispose.dispose(); // This will `kill` the previously started daemon process, if any.
            const cliPath = await this.getExecPath();
            this.onData(`Starting daemon from ${cliPath}...`);
            const daemon = await this.spawnDaemonProcess();
            // Watchdog process for terminating the daemon process when the backend app terminates.
            spawn(process.execPath, [join(__dirname, 'daemon-watcher.js'), String(process.pid), String(daemon.pid)], {
                env: environment.electron.runAsNodeEnv(),
                detached: true,
                stdio: 'ignore',
                windowsHide: true
            }).unref();

            this.toDispose.pushAll([
                Disposable.create(() => daemon.kill()),
                Disposable.create(() => this.fireDaemonStopped()),
            ]);
            this.fireDaemonStarted();
            this.onData('Daemon is running.');
        } catch (err) {
            this.onData('Failed to start the daemon.');
            this.onError(err);
            let i = 5; // TODO: make this better
            while (i) {
                this.onData(`Restarting daemon in ${i} seconds...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                i--;
            }
            this.onData('Restarting daemon now...');
            return this.startDaemon();
        }
    }

    async stopDaemon(): Promise<void> {
        this.toDispose.dispose();
    }

    get onDaemonStarted(): Event<void> {
        return this.onDaemonStartedEmitter.event;
    }

    get onDaemonStopped(): Event<void> {
        return this.onDaemonStoppedEmitter.event;
    }

    get ready(): Promise<void> {
        return this._ready.promise;
    }

    async getExecPath(): Promise<string> {
        if (this._execPath) {
            return this._execPath;
        }
        this._execPath = await getExecPath('arduino-cli', this.onError.bind(this));
        return this._execPath;
    }

    async getVersion(): Promise<string> {
        const execPath = await this.getExecPath();
        return spawnCommand(`"${execPath}"`, ['version'], this.onError.bind(this));
    }

    protected async getSpawnArgs(): Promise<string[]> {
        const configDirUri = await this.envVariablesServer.getConfigDirUri();
        const cliConfigPath = join(FileUri.fsPath(configDirUri), CLI_CONFIG);
        return ['daemon', '--config-file', `"${cliConfigPath}"`, '-v', '--log-format', 'json'];
    }

    protected async spawnDaemonProcess(): Promise<ChildProcess> {
        const [cliPath, args] = await Promise.all([this.getExecPath(), this.getSpawnArgs()]);
        const ready = new Deferred<ChildProcess>();
        const options = { shell: true };
        const daemon = spawn(`"${cliPath}"`, args, options);

        // If the process exists right after the daemon gRPC server has started (due to an invalid port, unknown address, TCP port in use, etc.) 
        // we have no idea about the root cause unless we sniff into the first data package and dispatch the logic on that. Note, we get a exit code 1.
        let grpcServerIsReady = false;

        daemon.stdout.on('data', data => {
            const message = data.toString();
            this.onData(message);
            if (!grpcServerIsReady) {
                const error = DaemonError.parse(message);
                if (error) {
                    ready.reject(error);
                }
                for (const expected of ['Daemon is listening on TCP port', 'Daemon is now listening on 127.0.0.1']) {
                    if (message.includes(expected)) {
                        grpcServerIsReady = true;
                        ready.resolve(daemon);
                    }
                }
            }
        });
        daemon.stderr.on('data', data => {
            const message = data.toString();
            this.onData(data.toString());
            const error = DaemonError.parse(message);
            ready.reject(error ? error : new Error(data.toString().trim()));
        });
        daemon.on('exit', (code, signal) => {
            if (code === 0 || signal === 'SIGINT' || signal === 'SIGKILL') {
                this.onData('Daemon has stopped.');
            } else {
                this.onData(`Daemon exited with ${typeof code === 'undefined' ? `signal '${signal}'` : `exit code: ${code}`}.`);
            }
        });
        daemon.on('error', error => {
            this.onError(error);
            ready.reject(error);
        });
        return ready.promise;
    }

    protected fireDaemonStarted(): void {
        this._running = true;
        this._ready.resolve();
        this.onDaemonStartedEmitter.fire();
        this.notificationService.notifyDaemonStarted();
    }

    protected fireDaemonStopped(): void {
        if (!this._running) {
            return;
        }
        this._running = false;
        this._ready.reject(); // Reject all pending.
        this._ready = new Deferred<void>();
        this.onDaemonStoppedEmitter.fire();
        this.notificationService.notifyDaemonStopped();
    }

    protected onData(message: string): void {
        DaemonLog.log(this.logger, message);
    }

    protected onError(error: any): void {
        this.logger.error(error);
    }

}

export class DaemonError extends Error {

    constructor(message: string, public readonly code: number, public readonly details?: string) {
        super(message);
        Object.setPrototypeOf(this, DaemonError.prototype);
    }

}

export namespace DaemonError {

    export const ADDRESS_IN_USE = 0;
    export const UNKNOWN_ADDRESS = 2;
    export const INVALID_PORT = 4;
    export const UNKNOWN = 8;

    export function parse(log: string): DaemonError | undefined {
        const raw = log.toLocaleLowerCase();
        if (raw.includes('failed to listen')) {
            if (raw.includes('address already in use') || (raw.includes('bind')) && raw.includes('only one usage of each socket address')) {
                return new DaemonError('Failed to listen on TCP port. Address already in use.', DaemonError.ADDRESS_IN_USE);
            }
            if (raw.includes('is unknown name') || (raw.includes('tcp/') && (raw.includes('is an invalid port')))) {
                return new DaemonError('Failed to listen on TCP port. Unknown address.', DaemonError.UNKNOWN_ADDRESS);
            }
            if (raw.includes('is an invalid port')) {
                return new DaemonError('Failed to listen on TCP port. Invalid port.', DaemonError.INVALID_PORT);
            }
        }
        // Based on the CLI logging: `failed to serve`, and  any other FATAL errors.
        // https://github.com/arduino/arduino-cli/blob/11abbee8a9f027d087d4230f266a87217677d423/cli/daemon/daemon.go#L89-L94
        if (raw.includes('failed to serve') && (raw.includes('"fatal"') || raw.includes('fata'))) {
            return new DaemonError('Unexpected CLI start error.', DaemonError.UNKNOWN, log);
        }
        return undefined;
    }

}
