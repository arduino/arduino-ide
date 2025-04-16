import { join } from 'node:path';
import { inject, injectable, named } from '@theia/core/shared/inversify';
import { spawn, ChildProcess } from 'node:child_process';
import { FileUri } from '@theia/core/lib/common/file-uri';
import { ILogger } from '@theia/core/lib/common/logger';
import { Deferred, retry } from '@theia/core/lib/common/promise-util';
import {
  Disposable,
  DisposableCollection,
} from '@theia/core/lib/common/disposable';
import { Event, Emitter } from '@theia/core/lib/common/event';
import { deepClone } from '@theia/core/lib/common/objects';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { BackendApplicationContribution } from '@theia/core/lib/node/backend-application';
import { ArduinoDaemon, NotificationServiceServer } from '../common/protocol';
import { CLI_CONFIG } from './cli-config';
import { SettingsReader } from './settings-reader';
import { ProcessUtils } from '@theia/core/lib/node/process-utils';
import { arduinoCliPath } from './resources';

@injectable()
export class ArduinoDaemonImpl
  implements ArduinoDaemon, BackendApplicationContribution
{
  @inject(ILogger)
  @named('daemon')
  private readonly logger: ILogger;

  @inject(EnvVariablesServer)
  private readonly envVariablesServer: EnvVariablesServer;

  @inject(NotificationServiceServer)
  private readonly notificationService: NotificationServiceServer;

  @inject(SettingsReader)
  private readonly settingsReader: SettingsReader;

  @inject(ProcessUtils)
  private readonly processUtils: ProcessUtils;

  private readonly toDispose = new DisposableCollection();
  private readonly onDaemonStartedEmitter = new Emitter<number>();
  private readonly onDaemonStoppedEmitter = new Emitter<void>();

  private _running = false;
  private _port = new Deferred<number>();

  // Backend application lifecycle.

  onStart(): void {
    this.start(); // no await
  }

  // Daemon API

  async getPort(): Promise<number> {
    return this._port.promise;
  }

  async tryGetPort(): Promise<number | undefined> {
    if (this._running) {
      return this._port.promise;
    }
    return undefined;
  }

  async start(): Promise<number> {
    try {
      this.toDispose.dispose(); // This will `kill` the previously started daemon process, if any.
      const cliPath = this.getExecPath();
      this.onData(`Starting daemon from ${cliPath}...`);
      const { daemon, port } = await this.spawnDaemonProcess();
      this.toDispose.pushAll([
        Disposable.create(() => {
          if (daemon.pid) {
            this.processUtils.terminateProcessTree(daemon.pid);
            this.fireDaemonStopped();
          } else {
            throw new Error(
              'The CLI Daemon process does not have a PID. IDE2 could not stop the CLI daemon.'
            );
          }
        }),
      ]);
      this.fireDaemonStarted(port);
      this.onData('Daemon is running.');
      return port;
    } catch (err) {
      return retry(
        () => {
          this.onError(err);
          return this.start();
        },
        1_000,
        5
      );
    }
  }

  async stop(): Promise<void> {
    this.toDispose.dispose();
  }

  async restart(): Promise<number> {
    return this.start();
  }

  // Backend only daemon API

  get onDaemonStarted(): Event<number> {
    return this.onDaemonStartedEmitter.event;
  }

  get onDaemonStopped(): Event<void> {
    return this.onDaemonStoppedEmitter.event;
  }

  getExecPath(): string {
    return arduinoCliPath;
  }

  protected async getSpawnArgs(): Promise<string[]> {
    const [configDirUri, debug] = await Promise.all([
      this.envVariablesServer.getConfigDirUri(),
      this.debugDaemon(),
    ]);
    const cliConfigPath = join(FileUri.fsPath(configDirUri), CLI_CONFIG);
    const args = [
      'daemon',
      '--port',
      '0',
      '--config-file',
      cliConfigPath,
      '-v',
    ];
    if (debug) {
      args.push('--debug');
    }
    return args;
  }

  private async debugDaemon(): Promise<boolean> {
    const settings = await this.settingsReader.read();
    if (settings) {
      const value = settings['arduino.cli.daemon.debug'];
      return value === true;
    }
    return false;
  }

  protected async spawnDaemonProcess(): Promise<{
    daemon: ChildProcess;
    port: number;
  }> {
    const args = await this.getSpawnArgs();
    const cliPath = this.getExecPath();
    const ready = new Deferred<{ daemon: ChildProcess; port: number }>();
    const options = {
      env: { ...deepClone(process.env), NO_COLOR: String(true) },
    };
    const daemon = spawn(cliPath, args, options);

    // If the process exists right after the daemon gRPC server has started (due to an invalid port, unknown address, TCP port in use, etc.)
    // we have no idea about the root cause unless we sniff into the first data package and dispatch the logic on that. Note, we get a exit code 1.
    let grpcServerIsReady = false;

    daemon.stdout.on('data', (data) => {
      const message = data.toString();
      this.onData(message);
      if (!grpcServerIsReady) {
        const error = DaemonError.parse(message);
        if (error) {
          ready.reject(error);
          return;
        }

        let port = '';
        let address = '';
        message
          .split('\n')
          .filter((line: string) => line.length)
          .forEach((line: string) => {
            try {
              const parsedLine = JSON.parse(line);
              if ('Port' in parsedLine) {
                port = parsedLine.Port;
              }
              if ('IP' in parsedLine) {
                address = parsedLine.IP;
              }
            } catch (err) {
              // ignore
            }
          });

        if (port.length && address.length) {
          grpcServerIsReady = true;
          const portNumber = Number.parseInt(port, 10);
          if (Number.isNaN(portNumber)) {
            ready.reject(
              new Error(`Received a NaN port from the CLI: ${port}`)
            );
          }
          ready.resolve({ daemon, port: portNumber });
        }
      }
    });
    daemon.stderr.on('data', (data) => {
      const message = data.toString();
      this.onData(data.toString());
      const error = DaemonError.parse(message);
      ready.reject(error ? error : new Error(data.toString().trim()));
    });
    daemon.on('exit', (code, signal) => {
      if (code === 0 || signal === 'SIGINT' || signal === 'SIGKILL') {
        this.onData('Daemon has stopped.');
      } else {
        this.onData(
          `Daemon exited with ${
            typeof code === 'undefined'
              ? `signal '${signal}'`
              : `exit code: ${code}`
          }.`
        );
      }
    });
    daemon.on('error', (error) => {
      this.onError(error);
      ready.reject(error);
    });
    return ready.promise;
  }

  private fireDaemonStarted(port: number): void {
    this._running = true;
    this._port.resolve(port);
    this.onDaemonStartedEmitter.fire(port);
    this.notificationService.notifyDaemonDidStart(port);
  }

  private fireDaemonStopped(): void {
    if (!this._running) {
      return;
    }
    this._running = false;
    this._port.reject(); // Reject all pending.
    this._port = new Deferred<number>();
    this.onDaemonStoppedEmitter.fire();
    this.notificationService.notifyDaemonDidStop();
  }

  protected onData(message: string): void {
    this.logger.info(message.trim());
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private onError(error: any): void {
    this.logger.error(error);
  }
}

export class DaemonError extends Error {
  constructor(
    message: string,
    public readonly code: number,
    public readonly details?: string
  ) {
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
      if (
        raw.includes('address already in use') ||
        (raw.includes('bind') &&
          raw.includes('only one usage of each socket address'))
      ) {
        return new DaemonError(
          'Failed to listen on TCP port. Address already in use.',
          DaemonError.ADDRESS_IN_USE
        );
      }
      if (
        raw.includes('is unknown name') ||
        (raw.includes('tcp/') && raw.includes('is an invalid port'))
      ) {
        return new DaemonError(
          'Failed to listen on TCP port. Unknown address.',
          DaemonError.UNKNOWN_ADDRESS
        );
      }
      if (raw.includes('is an invalid port')) {
        return new DaemonError(
          'Failed to listen on TCP port. Invalid port.',
          DaemonError.INVALID_PORT
        );
      }
    }
    // Based on the CLI logging: `failed to serve`, and  any other FATAL errors.
    // https://github.com/arduino/arduino-cli/blob/11abbee8a9f027d087d4230f266a87217677d423/cli/daemon/daemon.go#L89-L94
    if (
      raw.includes('failed to serve') &&
      (raw.includes('"fatal"') || raw.includes('fata'))
    ) {
      return new DaemonError(
        'Unexpected CLI start error.',
        DaemonError.UNKNOWN,
        log
      );
    }
    return undefined;
  }
}
