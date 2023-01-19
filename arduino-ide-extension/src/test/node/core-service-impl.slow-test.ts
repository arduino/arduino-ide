import { CancellationTokenSource } from '@theia/core/lib/common/cancellation';
import {
  CommandContribution,
  CommandRegistry,
  CommandService,
} from '@theia/core/lib/common/command';
import { bindContributionProvider } from '@theia/core/lib/common/contribution-provider';
import { Disposable } from '@theia/core/lib/common/disposable';
import { EnvVariablesServer as TheiaEnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { ILogger } from '@theia/core/lib/common/logger';
import { isWindows } from '@theia/core/lib/common/os';
import { waitForEvent } from '@theia/core/lib/common/promise-util';
import { MockLogger } from '@theia/core/lib/common/test/mock-logger';
import { BackendApplicationConfigProvider } from '@theia/core/lib/node/backend-application-config-provider';
import { FileUri } from '@theia/core/lib/node/file-uri';
import {
  Container,
  ContainerModule,
  injectable,
} from '@theia/core/shared/inversify';
import { expect } from 'chai';
import {
  ArduinoDaemon,
  AttachedBoardsChangeEvent,
  AvailablePorts,
  BoardsPackage,
  BoardsService,
  ConfigService,
  ConfigState,
  CoreService,
  IndexUpdateDidCompleteParams,
  IndexUpdateDidFailParams,
  IndexUpdateParams,
  LibraryPackage,
  NotificationServiceClient,
  NotificationServiceServer,
  OutputMessage,
  ProgressMessage,
  ResponseService,
  Sketch,
  SketchesService,
} from '../../common/protocol';
import { ArduinoDaemonImpl } from '../../node/arduino-daemon-impl';
import { BoardDiscovery } from '../../node/board-discovery';
import { BoardsServiceImpl } from '../../node/boards-service-impl';
import { ConfigServiceImpl } from '../../node/config-service-impl';
import { CoreClientProvider } from '../../node/core-client-provider';
import { CoreServiceImpl } from '../../node/core-service-impl';
import { IsTempSketch } from '../../node/is-temp-sketch';
import { MonitorManager } from '../../node/monitor-manager';
import { MonitorService } from '../../node/monitor-service';
import {
  MonitorServiceFactory,
  MonitorServiceFactoryOptions,
} from '../../node/monitor-service-factory';
import { SketchesServiceImpl } from '../../node/sketches-service-impl';
import { EnvVariablesServer } from '../../node/theia/env-variables/env-variables-server';

const testTimeout = 30_000;
const setupTimeout = 5 * 60 * 1_000; // five minutes
const avr = 'arduino:avr';
const uno = 'arduino:avr:uno';

describe('core-service-impl', () => {
  let container: Container;
  let toDispose: Disposable[];

  before(() => {
    BackendApplicationConfigProvider.set({ configDirName: 'testArduinoIDE' });
  });

  beforeEach(async function () {
    this.timeout(setupTimeout);
    toDispose = [];
    container = createContainer();
    await start(container, toDispose);
  });

  afterEach(() => {
    let disposable = toDispose.pop();
    while (disposable) {
      try {
        disposable?.dispose();
      } catch {}
      disposable = toDispose.pop();
    }
  });

  describe('compile', () => {
    it('should execute a command with the build path', async function () {
      this.timeout(testTimeout);
      const coreService = container.get<CoreService>(CoreService);
      const sketchesService = container.get<SketchesService>(SketchesService);
      const commandService =
        container.get<TestCommandRegistry>(TestCommandRegistry);
      const sketch = await sketchesService.createNewSketch();

      await coreService.compile({
        fqbn: uno,
        sketch,
        optimizeForDebug: false,
        sourceOverride: {},
        verbose: true,
      });

      const executedBuildDidCompleteCommands =
        commandService.executedCommands.filter(
          ([command]) =>
            command === 'arduino.languageserver.notifyBuildDidComplete'
        );
      expect(executedBuildDidCompleteCommands.length).to.be.equal(1);
      const [, args] = executedBuildDidCompleteCommands[0];
      expect(args.length).to.be.equal(1);
      const arg = args[0];
      expect(typeof arg).to.be.equal('object');
      expect('buildOutputUri' in arg).to.be.true;
      expect(arg.buildOutputUri).to.be.not.undefined;

      const tempBuildPaths = await sketchesService.tempBuildPath(sketch);
      if (isWindows) {
        expect(tempBuildPaths.length).to.be.greaterThan(1);
      } else {
        expect(tempBuildPaths.length).to.be.equal(1);
      }

      const { buildOutputUri } = arg;
      const buildOutputPath = FileUri.fsPath(buildOutputUri).toString();
      expect(tempBuildPaths.includes(buildOutputPath)).to.be.true;
    });
  });
});

async function start(
  container: Container,
  toDispose: Disposable[]
): Promise<void> {
  const daemon = container.get<ArduinoDaemonImpl>(ArduinoDaemonImpl);
  const configService = container.get<ConfigServiceImpl>(ConfigServiceImpl);
  toDispose.push(Disposable.create(() => daemon.stop()));
  configService.onStart();
  daemon.onStart();
  await waitForEvent(daemon.onDaemonStarted, 10_000);
  const boardService = container.get<BoardsService>(BoardsService);
  const searchResults = await boardService.search({ query: avr });
  const platform = searchResults.find(({ id }) => id === avr);
  if (!platform) {
    throw new Error(`Could not find platform: ${avr}`);
  }
  await boardService.install({ item: platform, skipPostInstall: true });
}

function createContainer(): Container {
  const container = new Container({ defaultScope: 'Singleton' });
  const module = new ContainerModule((bind) => {
    bind(CoreClientProvider).toSelf().inSingletonScope();
    bind(CoreServiceImpl).toSelf().inSingletonScope();
    bind(CoreService).toService(CoreServiceImpl);
    bind(BoardsServiceImpl).toSelf().inSingletonScope();
    bind(BoardsService).toService(BoardsServiceImpl);
    bind(TestResponseService).toSelf().inSingletonScope();
    bind(ResponseService).toService(TestResponseService);
    bind(MonitorManager).toSelf().inSingletonScope();
    bind(MonitorServiceFactory).toFactory(
      ({ container }) =>
        (options: MonitorServiceFactoryOptions) => {
          const child = container.createChild();
          child
            .bind<MonitorServiceFactoryOptions>(MonitorServiceFactoryOptions)
            .toConstantValue({
              ...options,
            });
          child.bind(MonitorService).toSelf();
          return child.get<MonitorService>(MonitorService);
        }
    );
    bind(EnvVariablesServer).toSelf().inSingletonScope();
    bind(TheiaEnvVariablesServer).toService(EnvVariablesServer);
    bind(ArduinoDaemonImpl).toSelf().inSingletonScope();
    bind(ArduinoDaemon).toService(ArduinoDaemonImpl);
    bind(MockLogger).toSelf().inSingletonScope();
    bind(ILogger).toService(MockLogger);
    bind(TestNotificationServiceServer).toSelf().inSingletonScope();
    bind(NotificationServiceServer).toService(TestNotificationServiceServer);
    bind(ConfigServiceImpl).toSelf().inSingletonScope();
    bind(ConfigService).toService(ConfigServiceImpl);
    bind(TestCommandRegistry).toSelf().inSingletonScope();
    bind(CommandRegistry).toService(TestCommandRegistry);
    bind(CommandService).toService(CommandRegistry);
    bindContributionProvider(bind, CommandContribution);
    bind(TestBoardDiscovery).toSelf().inSingletonScope();
    bind(BoardDiscovery).toService(TestBoardDiscovery);
    bind(IsTempSketch).toSelf().inSingletonScope();
    bind(SketchesServiceImpl).toSelf().inSingletonScope();
    bind(SketchesService).toService(SketchesServiceImpl);
  });
  container.load(module);
  return container;
}

@injectable()
class TestResponseService implements ResponseService {
  readonly outputMessages: OutputMessage[] = [];
  readonly progressMessages: ProgressMessage[] = [];

  appendToOutput(message: OutputMessage): void {
    this.outputMessages.push(message);
  }
  reportProgress(message: ProgressMessage): void {
    this.progressMessages.push(message);
  }
}

@injectable()
class TestNotificationServiceServer implements NotificationServiceServer {
  readonly events: string[] = [];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
  disposeClient(client: NotificationServiceClient): void {
    this.events.push('disposeClient:');
  }
  notifyDidReinitialize(): void {
    this.events.push('notifyDidReinitialize:');
  }
  notifyIndexUpdateWillStart(params: IndexUpdateParams): void {
    this.events.push(`notifyIndexUpdateWillStart:${JSON.stringify(params)}`);
  }
  notifyIndexUpdateDidProgress(progressMessage: ProgressMessage): void {
    this.events.push(
      `notifyIndexUpdateDidProgress:${JSON.stringify(progressMessage)}`
    );
  }
  notifyIndexUpdateDidComplete(params: IndexUpdateDidCompleteParams): void {
    this.events.push(`notifyIndexUpdateDidComplete:${JSON.stringify(params)}`);
  }
  notifyIndexUpdateDidFail(params: IndexUpdateDidFailParams): void {
    this.events.push(`notifyIndexUpdateDidFail:${JSON.stringify(params)}`);
  }
  notifyDaemonDidStart(port: string): void {
    this.events.push(`notifyDaemonDidStart:${port}`);
  }
  notifyDaemonDidStop(): void {
    this.events.push('notifyDaemonDidStop:');
  }
  notifyConfigDidChange(event: ConfigState): void {
    this.events.push(`notifyConfigDidChange:${JSON.stringify(event)}`);
  }
  notifyPlatformDidInstall(event: { item: BoardsPackage }): void {
    this.events.push(`notifyPlatformDidInstall:${JSON.stringify(event)}`);
  }
  notifyPlatformDidUninstall(event: { item: BoardsPackage }): void {
    this.events.push(`notifyPlatformDidUninstall:${JSON.stringify(event)}`);
  }
  notifyLibraryDidInstall(event: {
    item: LibraryPackage | 'zip-install';
  }): void {
    this.events.push(`notifyLibraryDidInstall:${JSON.stringify(event)}`);
  }
  notifyLibraryDidUninstall(event: { item: LibraryPackage }): void {
    this.events.push(`notifyLibraryDidUninstall:${JSON.stringify(event)}`);
  }
  notifyAttachedBoardsDidChange(event: AttachedBoardsChangeEvent): void {
    this.events.push(`notifyAttachedBoardsDidChange:${JSON.stringify(event)}`);
  }
  notifyRecentSketchesDidChange(event: { sketches: Sketch[] }): void {
    this.events.push(`notifyRecentSketchesDidChange:${JSON.stringify(event)}`);
  }
  dispose(): void {
    this.events.push('dispose:');
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
  setClient(client: NotificationServiceClient | undefined): void {
    this.events.push('setClient:');
  }
}

@injectable()
class TestBoardDiscovery extends BoardDiscovery {
  mutableAvailablePorts: AvailablePorts = {};

  override async start(): Promise<void> {
    // NOOP
  }
  override async stop(): Promise<void> {
    // NOOP
  }
  override get availablePorts(): AvailablePorts {
    return this.mutableAvailablePorts;
  }
}

@injectable()
class TestCommandRegistry extends CommandRegistry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly executedCommands: [string, any[]][] = [];

  override async executeCommand<T>(
    commandId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...args: any[]
  ): Promise<T | undefined> {
    const { token } = new CancellationTokenSource();
    this.onWillExecuteCommandEmitter.fire({
      commandId,
      args,
      token,
      waitUntil: () => {
        // NOOP
      },
    });
    this.executedCommands.push([commandId, args]);
    this.onDidExecuteCommandEmitter.fire({ commandId, args });
    return undefined;
  }
}
