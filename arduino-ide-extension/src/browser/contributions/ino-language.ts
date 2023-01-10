import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { inject, injectable } from '@theia/core/shared/inversify';
import { Mutex } from 'async-mutex';
import {
  ArduinoDaemon,
  assertSanitizedFqbn,
  BoardsService,
  ExecutableService,
  sanitizeFqbn,
} from '../../common/protocol';
import { CurrentSketch } from '../../common/protocol/sketches-service-client-impl';
import { BoardsConfig } from '../boards/boards-config';
import { BoardsServiceProvider } from '../boards/boards-service-provider';
import { HostedPluginEvents } from '../hosted-plugin-events';
import { NotificationCenter } from '../notification-center';
import { SketchContribution, URI } from './contribution';
import { BoardsDataStore } from '../boards/boards-data-store';

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
      { selectedBoard }: BoardsConfig.Config,
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
      start(this.boardsServiceProvider.boardsConfig, true);
    };
    this.toDispose.pushAll([
      this.boardsServiceProvider.onBoardsConfigChanged(start),
      this.hostedPluginEvents.onPluginsDidStart(() =>
        start(this.boardsServiceProvider.boardsConfig)
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
      this.boardDataStore.onChanged((dataChangePerFqbn) => {
        if (this.languageServerFqbn) {
          const sanitizedFqbn = sanitizeFqbn(this.languageServerFqbn);
          if (!sanitizeFqbn) {
            throw new Error(
              `Failed to sanitize the FQBN of the running language server. FQBN with the board settings was: ${this.languageServerFqbn}`
            );
          }
          const matchingFqbn = dataChangePerFqbn.find(
            (fqbn) => sanitizedFqbn === fqbn
          );
          const { boardsConfig } = this.boardsServiceProvider;
          if (
            matchingFqbn &&
            boardsConfig.selectedBoard?.fqbn === matchingFqbn
          ) {
            start(boardsConfig);
          }
        }
      }),
    ]);
    start(this.boardsServiceProvider.boardsConfig);
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
    const release = await this.languageServerStartMutex.acquire();
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
      this.logger.info(`Starting language server: ${fqbnWithConfig}`);
      const log = this.preferences.get('arduino.language.log');
      const realTimeDiagnostics = this.preferences.get(
        'arduino.language.realTimeDiagnostics'
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
        new Promise<undefined>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Timeout after ${20_000} ms.`)),
            20_000
          )
        ),
        this.commandService.executeCommand<string>(
          'arduino.languageserver.start',
          {
            lsPath,
            cliDaemonAddr: `localhost:${port}`,
            clangdPath,
            log: currentSketchPath ? currentSketchPath : log,
            cliDaemonInstance: '1',
            board: {
              fqbn: fqbnWithConfig,
              name: name ? `"${name}"` : undefined,
            },
            realTimeDiagnostics,
            silentOutput: true,
          }
        ),
      ]);
    } catch (e) {
      console.log(`Failed to start language server. Original FQBN: ${fqbn}`, e);
      this.languageServerFqbn = undefined;
    } finally {
      release();
    }
  }
}
