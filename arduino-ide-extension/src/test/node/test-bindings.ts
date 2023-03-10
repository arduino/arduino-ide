import {
  CommandContribution,
  CommandRegistry,
  CommandService,
} from '@theia/core/lib/common/command';
import { bindContributionProvider } from '@theia/core/lib/common/contribution-provider';
import { Disposable } from '@theia/core/lib/common/disposable';
import { EnvVariablesServer as TheiaEnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { ILogger, Loggable } from '@theia/core/lib/common/logger';
import { LogLevel } from '@theia/core/lib/common/logger-protocol';
import { waitForEvent } from '@theia/core/lib/common/promise-util';
import { MockLogger } from '@theia/core/lib/common/test/mock-logger';
import { BackendApplicationConfigProvider } from '@theia/core/lib/node/backend-application-config-provider';
import {
  Container,
  ContainerModule,
  injectable,
  interfaces,
} from '@theia/core/shared/inversify';
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
import { SettingsReader } from '../../node/settings-reader';
import { SketchesServiceImpl } from '../../node/sketches-service-impl';
import { EnvVariablesServer } from '../../node/theia/env-variables/env-variables-server';

@injectable()
class ConsoleLogger extends MockLogger {
  override log(
    logLevel: number,
    arg2: string | Loggable | Error,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...params: any[]
  ): Promise<void> {
    if (arg2 instanceof Error) {
      return this.error(String(arg2), params);
    }
    switch (logLevel) {
      case LogLevel.INFO:
        return this.info(arg2, params);
      case LogLevel.WARN:
        return this.warn(arg2, params);
      case LogLevel.TRACE:
        return this.trace(arg2, params);
      case LogLevel.ERROR:
        return this.error(arg2, params);
      case LogLevel.FATAL:
        return this.fatal(arg2, params);
      default:
        return this.info(arg2, params);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override async info(arg: string | Loggable, ...params: any[]): Promise<void> {
    if (params.length) {
      console.info(arg, ...params);
    } else {
      console.info(arg);
    }
  }

  override async trace(
    arg: string | Loggable,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...params: any[]
  ): Promise<void> {
    if (params.length) {
      console.trace(arg, ...params);
    } else {
      console.trace(arg);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override async warn(arg: string | Loggable, ...params: any[]): Promise<void> {
    if (params.length) {
      console.warn(arg, ...params);
    } else {
      console.warn(arg);
    }
  }

  override async error(
    arg: string | Loggable,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...params: any[]
  ): Promise<void> {
    if (params.length) {
      console.error(arg, ...params);
    } else {
      console.error(arg);
    }
  }

  override async fatal(
    arg: string | Loggable,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...params: any[]
  ): Promise<void> {
    return this.error(arg, params);
  }
}

@injectable()
class SilentArduinoDaemon extends ArduinoDaemonImpl {
  protected override onData(): void {
    //  NOOP
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

export function createBaseContainer(
  containerCustomizations?: (
    bind: interfaces.Bind,
    rebind: interfaces.Rebind
  ) => void
): Container {
  const container = new Container({ defaultScope: 'Singleton' });
  const module = new ContainerModule((bind, unbind, isBound, rebind) => {
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
    bind(SilentArduinoDaemon).toSelf().inSingletonScope();
    bind(ArduinoDaemon).toService(SilentArduinoDaemon);
    bind(ArduinoDaemonImpl).toService(SilentArduinoDaemon);
    bind(ConsoleLogger).toSelf().inSingletonScope();
    bind(ILogger).toService(ConsoleLogger);
    bind(TestNotificationServiceServer).toSelf().inSingletonScope();
    bind(NotificationServiceServer).toService(TestNotificationServiceServer);
    bind(ConfigServiceImpl).toSelf().inSingletonScope();
    bind(ConfigService).toService(ConfigServiceImpl);
    bind(CommandService).toService(CommandRegistry);
    bindContributionProvider(bind, CommandContribution);
    bind(TestBoardDiscovery).toSelf().inSingletonScope();
    bind(BoardDiscovery).toService(TestBoardDiscovery);
    bind(IsTempSketch).toSelf().inSingletonScope();
    bind(SketchesServiceImpl).toSelf().inSingletonScope();
    bind(SketchesService).toService(SketchesServiceImpl);
    bind(SettingsReader).toSelf().inSingletonScope();
    if (containerCustomizations) {
      containerCustomizations(bind, rebind);
    }
  });
  container.load(module);
  return container;
}

export async function startDaemon(
  container: Container,
  toDispose: Disposable[],
  startCustomizations?: (
    container: Container,
    toDispose: Disposable[]
  ) => Promise<void>
): Promise<void> {
  const daemon = container.get<ArduinoDaemonImpl>(ArduinoDaemonImpl);
  const configService = container.get<ConfigServiceImpl>(ConfigServiceImpl);
  toDispose.push(Disposable.create(() => daemon.stop()));
  configService.onStart();
  daemon.onStart();
  await waitForEvent(daemon.onDaemonStarted, 10_000);
  if (startCustomizations) {
    await startCustomizations(container, toDispose);
  }
}

export function configureBackendApplicationConfigProvider(): void {
  try {
    BackendApplicationConfigProvider.get();
  } catch (err) {
    if (
      err instanceof Error &&
      err.message.includes('BackendApplicationConfigProvider#set')
    ) {
      BackendApplicationConfigProvider.set({
        configDirName: '.testArduinoIDE',
      });
    }
  }
}
