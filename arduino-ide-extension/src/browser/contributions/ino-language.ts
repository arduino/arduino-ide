import {
  Disposable,
  DisposableCollection,
} from '@theia/core/lib/common/disposable';
import { inject, injectable } from '@theia/core/shared/inversify';
import { Mutex } from 'async-mutex';
import {
  ArduinoDaemon,
  BoardIdentifier,
  BoardsService,
  ExecutableService,
  assertSanitizedFqbn,
  isBoardIdentifierChangeEvent,
  sanitizeFqbn,
} from '../../common/protocol';
import {
  defaultAsyncWorkers,
  maxAsyncWorkers,
  minAsyncWorkers,
} from '../arduino-preferences';
import { BoardsDataStore } from '../boards/boards-data-store';
import { BoardsServiceProvider } from '../boards/boards-service-provider';
import { HostedPluginEvents } from '../hosted/hosted-plugin-events';
import { NotificationCenter } from '../notification-center';
import { CurrentSketch } from '../sketches-service-client-impl';
import { SketchContribution, URI } from './contribution';

interface DaemonAddress {
  /**
   * The host where the Arduino CLI daemon is available.
   */
  readonly hostname: string;
  /**
   * The port where the Arduino CLI daemon is listening.
   */
  readonly port: number;
  /**
   * The [id](https://arduino.github.io/arduino-cli/latest/rpc/commands/#instance) of the initialized core Arduino client instance.
   */
  readonly instance: number;
}

interface StartLanguageServerParams {
  /**
   * Absolute filesystem path to the Arduino Language Server executable.
   */
  readonly lsPath: string;
  /**
   * The hostname and the port for the gRPC channel connecting to the Arduino CLI daemon.
   * The `instance` number is for the initialized core Arduino client.
   */
  readonly daemonAddress: DaemonAddress;
  /**
   * Absolute filesystem path to [`clangd`](https://clangd.llvm.org/).
   */
  readonly clangdPath: string;
  /**
   * The board is relevant to start a specific "flavor" of the language.
   */
  readonly board: { fqbn: string; name?: string };
  /**
   * `true` if the LS should generate the log files into the default location. The default location is the `cwd` of the process.
   * It's very often the same as the workspace root of the IDE, aka the sketch folder.
   * When it is a string, it is the absolute filesystem path to the folder to generate the log files.
   * If `string`, but the path is inaccessible, the log files will be generated into the default location.
   */
  readonly log?: boolean | string;
  /**
   * Optional `env` for the language server process.
   */
  readonly env?: NodeJS.ProcessEnv;
  /**
   * Additional flags for the Arduino Language server process.
   */
  readonly flags?: readonly string[];
  /**
   * Set to `true`, to enable `Diagnostics`.
   */
  readonly realTimeDiagnostics?: boolean;
  /**
   * If `true`, the logging is not forwarded to the _Output_ view via the language client.
   */
  readonly silentOutput?: boolean;
  /**
   * Number of async workers used by `clangd`. Background index also uses this many workers. If `0`, `clangd` uses all available cores. It's `0` by default.
   */
  readonly jobs?: number;
}

/**
 * The FQBN the language server runs with or `undefined` if it could not start.
 */
type StartLanguageServerResult = string | undefined;

@injectable()
export class InoLanguage extends SketchContribution {
  @inject(HostedPluginEvents)
  private readonly hostedPluginEvents: HostedPluginEvents;
  @inject(ExecutableService)
  private readonly executableService: ExecutableService;
  @inject(ArduinoDaemon)
  private readonly daemon: ArduinoDaemon;
  @inject(BoardsService)
  private readonly boardsService: BoardsService;
  @inject(BoardsServiceProvider)
  private readonly boardsServiceProvider: BoardsServiceProvider;
  @inject(NotificationCenter)
  private readonly notificationCenter: NotificationCenter;
  @inject(BoardsDataStore)
  private readonly boardDataStore: BoardsDataStore;

  private readonly toDispose = new DisposableCollection();
  private readonly languageServerStartMutex = new Mutex();
  private languageServerFqbn?: string;

  override onReady(): void {
    const start = (
      selectedBoard: BoardIdentifier | undefined,
      forceStart = false
    ) => {
      if (selectedBoard) {
        const { name, fqbn } = selectedBoard;
        if (fqbn) {
          this.startLanguageServer(fqbn, name, forceStart);
        }
      }
    };
    const forceRestart = () => {
      start(this.boardsServiceProvider.boardsConfig.selectedBoard, true);
    };
    this.toDispose.pushAll([
      this.boardsServiceProvider.onBoardsConfigDidChange((event) => {
        if (isBoardIdentifierChangeEvent(event)) {
          start(event.selectedBoard);
        }
      }),
      this.hostedPluginEvents.onPluginsDidStart(() =>
        start(this.boardsServiceProvider.boardsConfig.selectedBoard)
      ),
      this.hostedPluginEvents.onPluginsWillUnload(
        () => (this.languageServerFqbn = undefined)
      ),
      this.preferences.onPreferenceChanged(
        ({ preferenceName, oldValue, newValue }) => {
          if (oldValue !== newValue) {
            switch (preferenceName) {
              case 'arduino.language.log':
              case 'arduino.language.realTimeDiagnostics':
              case 'arduino.language.asyncWorkers':
                forceRestart();
            }
          }
        }
      ),
      this.notificationCenter.onLibraryDidInstall(() => forceRestart()),
      this.notificationCenter.onLibraryDidUninstall(() => forceRestart()),
      this.notificationCenter.onPlatformDidInstall(() => forceRestart()),
      this.notificationCenter.onPlatformDidUninstall(() => forceRestart()),
      this.notificationCenter.onDidReinitialize(() => forceRestart()),
      this.boardDataStore.onDidChange((event) => {
        if (this.languageServerFqbn) {
          const sanitizedFqbn = sanitizeFqbn(this.languageServerFqbn);
          if (!sanitizeFqbn) {
            throw new Error(
              `Failed to sanitize the FQBN of the running language server. FQBN with the board settings was: ${this.languageServerFqbn}`
            );
          }
          const matchingChange = event.changes.find(
            (change) => change.fqbn === sanitizedFqbn
          );
          const { boardsConfig } = this.boardsServiceProvider;
          if (
            matchingChange &&
            boardsConfig.selectedBoard?.fqbn === matchingChange.fqbn
          ) {
            start(boardsConfig.selectedBoard);
          }
        }
      }),
    ]);
    Promise.all([
      this.boardsServiceProvider.ready,
      this.preferences.ready,
    ]).then(() => {
      start(this.boardsServiceProvider.boardsConfig.selectedBoard);
    });
  }

  onStop(): void {
    this.toDispose.dispose();
  }

  private async startLanguageServer(
    fqbn: string,
    name: string | undefined,
    forceStart = false
  ): Promise<void> {
    const port = await this.daemon.tryGetPort();
    if (!port) {
      return;
    }
    const portNumber = Number.parseInt(port, 10); // TODO: IDE2 APIs should provide a number and not string
    if (Number.isNaN(portNumber)) {
      return;
    }
    const release = await this.languageServerStartMutex.acquire();
    const toDisposeOnRelease = new DisposableCollection();
    try {
      await this.hostedPluginEvents.didStart;
      const details = await this.boardsService.getBoardDetails({ fqbn });
      if (!details) {
        // Core is not installed for the selected board.
        console.info(
          `Could not start language server for ${fqbn}. The core is not installed for the board.`
        );
        if (this.languageServerFqbn) {
          try {
            await this.commandService.executeCommand(
              'arduino.languageserver.stop'
            );
            console.info(
              `Stopped language server process for ${this.languageServerFqbn}.`
            );
            this.languageServerFqbn = undefined;
          } catch (e) {
            console.error(
              `Failed to start language server process for ${this.languageServerFqbn}`,
              e
            );
            throw e;
          }
        }
        return;
      }
      assertSanitizedFqbn(fqbn);
      const fqbnWithConfig = await this.boardDataStore.appendConfigToFqbn(fqbn);
      if (!fqbnWithConfig) {
        throw new Error(
          `Failed to append boards config to the FQBN. Original FQBN was: ${fqbn}`
        );
      }
      if (!forceStart && fqbnWithConfig === this.languageServerFqbn) {
        // NOOP
        return;
      }
      const log = this.preferences.get('arduino.language.log');
      const realTimeDiagnostics = this.preferences.get(
        'arduino.language.realTimeDiagnostics'
      );
      const jobs = this.getAsyncWorkersPreferenceSafe();
      this.logger.info(
        `Starting language server: ${fqbnWithConfig}${jobs ? ` (async worker count: ${jobs})` : ''
        }`
      );
      let currentSketchPath: string | undefined = undefined;
      if (log) {
        const currentSketch = await this.sketchServiceClient.currentSketch();
        if (CurrentSketch.isValid(currentSketch)) {
          currentSketchPath = await this.fileService.fsPath(
            new URI(currentSketch.uri)
          );
        }
      }
      const { clangdUri, lsUri } = await this.executableService.list();
      const [clangdPath, lsPath] = await Promise.all([
        this.fileService.fsPath(new URI(clangdUri)),
        this.fileService.fsPath(new URI(lsUri)),
      ]);

      this.languageServerFqbn = await Promise.race([
        new Promise<undefined>((_, reject) => {
          const timer = setTimeout(
            () => reject(new Error(`Timeout after ${20_000} ms.`)),
            20_000
          );
          toDisposeOnRelease.push(Disposable.create(() => clearTimeout(timer)));
        }),
        this.start({
          lsPath,
          daemonAddress: {
            hostname: 'localhost',
            port: portNumber,
            instance: 1, // TODO: get it from the backend
          },
          clangdPath,
          log: currentSketchPath ? currentSketchPath : log,
          board: {
            fqbn: fqbnWithConfig,
            name,
          },
          realTimeDiagnostics,
          silentOutput: true,
          jobs,
        }),
      ]);
    } catch (e) {
      console.log(`Failed to start language server. Original FQBN: ${fqbn}`, e);
      this.languageServerFqbn = undefined;
    } finally {
      toDisposeOnRelease.dispose();
      release();
    }
  }
  // The Theia preference UI validation is bogus.
  // To restrict the number of jobs to a valid value.
  private getAsyncWorkersPreferenceSafe(): number {
    const jobs = this.preferences.get(
      'arduino.language.asyncWorkers',
      defaultAsyncWorkers
    );
    if (jobs < minAsyncWorkers) {
      return minAsyncWorkers;
    }
    if (jobs > maxAsyncWorkers) {
      return maxAsyncWorkers;
    }
    return jobs;
  }

  private async start(
    params: StartLanguageServerParams
  ): Promise<StartLanguageServerResult | undefined> {
    return this.commandService.executeCommand<StartLanguageServerResult>(
      'arduino.languageserver.start',
      params
    );
  }
}
