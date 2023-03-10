import { ContainerModule, interfaces } from '@theia/core/shared/inversify';
import { ArduinoDaemonImpl } from './arduino-daemon-impl';
import {
  ArduinoFirmwareUploader,
  ArduinoFirmwareUploaderPath,
} from '../common/protocol/arduino-firmware-uploader';
import { ILogger } from '@theia/core/lib/common/logger';
import {
  BackendApplicationContribution,
  BackendApplication as TheiaBackendApplication,
} from '@theia/core/lib/node/backend-application';
import {
  LibraryService,
  LibraryServicePath,
} from '../common/protocol/library-service';
import {
  BoardsService,
  BoardsServicePath,
} from '../common/protocol/boards-service';
import { LibraryServiceImpl } from './library-service-impl';
import { BoardsServiceImpl } from './boards-service-impl';
import { CoreServiceImpl } from './core-service-impl';
import { CoreService, CoreServicePath } from '../common/protocol/core-service';
import { ConnectionContainerModule } from '@theia/core/lib/node/messaging/connection-container-module';
import { CoreClientProvider } from './core-client-provider';
import { ConnectionHandler, JsonRpcConnectionHandler } from '@theia/core';
import { DefaultWorkspaceServer } from './theia/workspace/default-workspace-server';
import { WorkspaceServer as TheiaWorkspaceServer } from '@theia/workspace/lib/common/workspace-protocol';
import { SketchesServiceImpl } from './sketches-service-impl';
import {
  SketchesService,
  SketchesServicePath,
} from '../common/protocol/sketches-service';
import {
  ConfigService,
  ConfigServicePath,
} from '../common/protocol/config-service';
import {
  ArduinoDaemon,
  ArduinoDaemonPath,
} from '../common/protocol/arduino-daemon';
import { ConfigServiceImpl } from './config-service-impl';
import { EnvVariablesServer as TheiaEnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { EnvVariablesServer } from './theia/env-variables/env-variables-server';
import { NodeFileSystemExt } from './node-filesystem-ext';
import {
  FileSystemExt,
  FileSystemExtPath,
} from '../common/protocol/filesystem-ext';
import {
  BuiltInExamplesServiceImpl,
  ExamplesServiceImpl,
} from './examples-service-impl';
import {
  ExamplesService,
  ExamplesServicePath,
} from '../common/protocol/examples-service';
import {
  ExecutableService,
  ExecutableServicePath,
} from '../common/protocol/executable-service';
import { ExecutableServiceImpl } from './executable-service-impl';
import {
  ResponseServicePath,
  ResponseService,
} from '../common/protocol/response-service';
import { NotificationServiceServerImpl } from './notification-service-server';
import {
  NotificationServiceServer,
  NotificationServiceClient,
  NotificationServicePath,
} from '../common/protocol';
import { BackendApplication } from './theia/core/backend-application';
import { BoardDiscovery } from './board-discovery';
import { AuthenticationServiceImpl } from './auth/authentication-service-impl';
import {
  AuthenticationService,
  AuthenticationServiceClient,
  AuthenticationServicePath,
} from '../common/protocol/authentication-service';
import { ArduinoFirmwareUploaderImpl } from './arduino-firmware-uploader-impl';
import { PlotterBackendContribution } from './plotter/plotter-backend-contribution';
import { ArduinoLocalizationContribution } from './i18n/arduino-localization-contribution';
import { LocalizationContribution } from '@theia/core/lib/node/i18n/localization-contribution';
import { MonitorManagerProxyImpl } from './monitor-manager-proxy-impl';
import { MonitorManager, MonitorManagerName } from './monitor-manager';
import {
  MonitorManagerProxy,
  MonitorManagerProxyClient,
  MonitorManagerProxyPath,
} from '../common/protocol/monitor-service';
import { MonitorService, MonitorServiceName } from './monitor-service';
import { MonitorSettingsProvider } from './monitor-settings/monitor-settings-provider';
import { MonitorSettingsProviderImpl } from './monitor-settings/monitor-settings-provider-impl';
import {
  MonitorServiceFactory,
  MonitorServiceFactoryOptions,
} from './monitor-service-factory';
import WebSocketProviderImpl from './web-socket/web-socket-provider-impl';
import { WebSocketProvider } from './web-socket/web-socket-provider';
import { ClangFormatter } from './clang-formatter';
import { FormatterPath } from '../common/protocol/formatter';
import { HostedPluginLocalizationService } from './theia/plugin-ext/hosted-plugin-localization-service';
import { HostedPluginLocalizationService as TheiaHostedPluginLocalizationService } from '@theia/plugin-ext/lib/hosted/node/hosted-plugin-localization-service';
import { SurveyNotificationServiceImpl } from './survey-service-impl';
import {
  SurveyNotificationService,
  SurveyNotificationServicePath,
} from '../common/protocol/survey-service';
import { IsTempSketch } from './is-temp-sketch';
import { rebindNsfwFileSystemWatcher } from './theia/filesystem/nsfw-watcher/nsfw-bindings';
import { MessagingContribution } from './theia/core/messaging-contribution';
import { MessagingService } from '@theia/core/lib/node/messaging/messaging-service';
import { HostedPluginReader } from './theia/plugin-ext/plugin-reader';
import { HostedPluginReader as TheiaHostedPluginReader } from '@theia/plugin-ext/lib/hosted/node/plugin-reader';
import { PluginDeployer } from '@theia/plugin-ext/lib/common/plugin-protocol';
import {
  LocalDirectoryPluginDeployerResolverWithFallback,
  PluginDeployer_GH_12064,
} from './theia/plugin-ext/plugin-deployer';
import { SettingsReader } from './settings-reader';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
  bind(BackendApplication).toSelf().inSingletonScope();
  rebind(TheiaBackendApplication).toService(BackendApplication);

  // Shared config service
  bind(ConfigServiceImpl).toSelf().inSingletonScope();
  bind(ConfigService).toService(ConfigServiceImpl);
  // Note: The config service must start earlier than the daemon, hence the binding order of the BA contribution does matter.
  bind(BackendApplicationContribution).toService(ConfigServiceImpl);
  bind(ConnectionHandler)
    .toDynamicValue(
      (context) =>
        new JsonRpcConnectionHandler(ConfigServicePath, () =>
          context.container.get(ConfigService)
        )
    )
    .inSingletonScope();

  // Shared daemon
  bind(ArduinoDaemonImpl).toSelf().inSingletonScope();
  bind(ArduinoDaemon).toService(ArduinoDaemonImpl);
  bind(BackendApplicationContribution).toService(ArduinoDaemonImpl);
  bind(ConnectionHandler)
    .toDynamicValue(
      (context) =>
        new JsonRpcConnectionHandler(ArduinoDaemonPath, () =>
          context.container.get(ArduinoDaemon)
        )
    )
    .inSingletonScope();

  // Shared formatter
  bind(ClangFormatter).toSelf().inSingletonScope();
  bind(ConnectionHandler)
    .toDynamicValue(
      ({ container }) =>
        new JsonRpcConnectionHandler(FormatterPath, () =>
          container.get(ClangFormatter)
        )
    )
    .inSingletonScope();
  // Built-in examples are not board specific, so it is possible to have one shared instance.
  bind(BuiltInExamplesServiceImpl).toSelf().inSingletonScope();

  // Examples service. One per backend, each connected FE gets a proxy.
  bind(ConnectionContainerModule).toConstantValue(
    ConnectionContainerModule.create(({ bind, bindBackendService }) => {
      bind(ExamplesServiceImpl).toSelf().inSingletonScope();
      bind(ExamplesService).toService(ExamplesServiceImpl);
      bindBackendService(ExamplesServicePath, ExamplesService);
    })
  );

  // Exposes the executable paths/URIs to the frontend
  bind(ExecutableServiceImpl).toSelf().inSingletonScope();
  bind(ExecutableService).toService(ExecutableServiceImpl);
  bind(ConnectionHandler)
    .toDynamicValue(
      (context) =>
        new JsonRpcConnectionHandler(ExecutableServicePath, () =>
          context.container.get(ExecutableService)
        )
    )
    .inSingletonScope();

  // Library service. Singleton per backend, each connected FE gets its proxy.
  bind(ConnectionContainerModule).toConstantValue(
    ConnectionContainerModule.create(({ bind, bindBackendService }) => {
      bind(LibraryServiceImpl).toSelf().inSingletonScope();
      bind(LibraryService).toService(LibraryServiceImpl);
      bindBackendService(LibraryServicePath, LibraryService);
    })
  );

  // Shared sketches service
  bind(SketchesServiceImpl).toSelf().inSingletonScope();
  bind(SketchesService).toService(SketchesServiceImpl);
  bind(ConnectionHandler)
    .toDynamicValue(
      (context) =>
        new JsonRpcConnectionHandler(SketchesServicePath, () =>
          context.container.get(SketchesService)
        )
    )
    .inSingletonScope();

  // Boards service. One instance per connected frontend.
  bind(ConnectionContainerModule).toConstantValue(
    ConnectionContainerModule.create(({ bind, bindBackendService }) => {
      bind(BoardsServiceImpl).toSelf().inSingletonScope();
      bind(BoardsService).toService(BoardsServiceImpl);
      bindBackendService(BoardsServicePath, BoardsService);
    })
  );

  // Shared Arduino core client provider service for the backend.
  bind(CoreClientProvider).toSelf().inSingletonScope();

  // Shared port/board discovery for the server
  bind(BoardDiscovery).toSelf().inSingletonScope();
  bind(BackendApplicationContribution).toService(BoardDiscovery);

  // Core service -> `verify` and `upload`. Singleton per BE, each FE connection gets its proxy.
  bind(ConnectionContainerModule).toConstantValue(
    ConnectionContainerModule.create(({ bind, bindBackendService }) => {
      bind(CoreServiceImpl).toSelf().inSingletonScope();
      bind(CoreService).toService(CoreServiceImpl);
      bindBackendService(CoreServicePath, CoreService);
    })
  );

  // #region Theia customizations

  bind(DefaultWorkspaceServer).toSelf().inSingletonScope();
  rebind(TheiaWorkspaceServer).toService(DefaultWorkspaceServer);

  bind(EnvVariablesServer).toSelf().inSingletonScope();
  rebind(TheiaEnvVariablesServer).toService(EnvVariablesServer);

  // #endregion Theia customizations

  // a single MonitorManager is responsible for handling the actual connections to the pluggable monitors
  bind(MonitorManager).toSelf().inSingletonScope();

  // monitor service & factory bindings
  bind(MonitorSettingsProviderImpl).toSelf().inSingletonScope();
  bind(MonitorSettingsProvider).toService(MonitorSettingsProviderImpl);

  bind(WebSocketProviderImpl).toSelf();
  bind(WebSocketProvider).toService(WebSocketProviderImpl);

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

  // Serial client provider per connected frontend.
  bind(ConnectionContainerModule).toConstantValue(
    ConnectionContainerModule.create(({ bind, bindBackendService }) => {
      bind(MonitorManagerProxyImpl).toSelf().inSingletonScope();
      bind(MonitorManagerProxy).toService(MonitorManagerProxyImpl);
      bindBackendService<MonitorManagerProxy, MonitorManagerProxyClient>(
        MonitorManagerProxyPath,
        MonitorManagerProxy,
        (monitorMgrProxy, client) => {
          monitorMgrProxy.setClient(client);
          // when the client close the connection, the proxy is disposed.
          // when the MonitorManagerProxy is disposed, it informs the MonitorManager
          // telling him that it does not need an address/board anymore.
          // the MonitorManager will then dispose the actual connection if there are no proxies using it
          client.onDidCloseConnection(() => monitorMgrProxy.dispose());
          return monitorMgrProxy;
        }
      );
    })
  );

  // File-system extension for mapping paths to URIs
  bind(NodeFileSystemExt).toSelf().inSingletonScope();
  bind(FileSystemExt).toService(NodeFileSystemExt);
  bind(ConnectionHandler)
    .toDynamicValue(
      (context) =>
        new JsonRpcConnectionHandler(FileSystemExtPath, () =>
          context.container.get(FileSystemExt)
        )
    )
    .inSingletonScope();
  rebindNsfwFileSystemWatcher(rebind);

  // Output service per connection.
  bind(ConnectionContainerModule).toConstantValue(
    ConnectionContainerModule.create(({ bindFrontendService }) => {
      bindFrontendService(ResponseServicePath, ResponseService);
    })
  );

  // Notify all connected frontend instances
  bind(NotificationServiceServerImpl).toSelf().inSingletonScope();
  bind(NotificationServiceServer).toService(NotificationServiceServerImpl);
  bind(ConnectionHandler)
    .toDynamicValue(
      (context) =>
        new JsonRpcConnectionHandler<NotificationServiceClient>(
          NotificationServicePath,
          (client) => {
            const server = context.container.get<NotificationServiceServer>(
              NotificationServiceServer
            );
            server.setClient(client);
            client.onDidCloseConnection(() => server.disposeClient(client));
            return server;
          }
        )
    )
    .inSingletonScope();

  // Singleton per BE, each FE connection gets its proxy.
  bind(ConnectionContainerModule).toConstantValue(
    ConnectionContainerModule.create(({ bind, bindBackendService }) => {
      bind(ArduinoFirmwareUploaderImpl).toSelf().inSingletonScope();
      bind(ArduinoFirmwareUploader).toService(ArduinoFirmwareUploaderImpl);
      bindBackendService(ArduinoFirmwareUploaderPath, ArduinoFirmwareUploader);
    })
  );

  [
    'daemon', // Logger for the Arduino daemon
    'fwuploader', // Arduino Firmware uploader
    'discovery-log', // Boards discovery
    'config', // Logger for the CLI config reading and manipulation
    'sketches-service', // For creating, loading, and cloning sketches
    MonitorManagerName, // Logger for the monitor manager and its services
    MonitorServiceName,
  ].forEach((name) => bindChildLogger(bind, name));

  // Cloud sketchbook bindings
  bind(AuthenticationServiceImpl).toSelf().inSingletonScope();
  bind(AuthenticationService).toService(AuthenticationServiceImpl);
  bind(BackendApplicationContribution).toService(AuthenticationServiceImpl);
  bind(ConnectionHandler)
    .toDynamicValue(
      (context) =>
        new JsonRpcConnectionHandler<AuthenticationServiceClient>(
          AuthenticationServicePath,
          (client) => {
            const server = context.container.get<AuthenticationServiceImpl>(
              AuthenticationServiceImpl
            );
            server.setClient(client);
            client.onDidCloseConnection(() => server.disposeClient(client));
            return server;
          }
        )
    )
    .inSingletonScope();

  bind(PlotterBackendContribution).toSelf().inSingletonScope();
  bind(BackendApplicationContribution).toService(PlotterBackendContribution);
  bind(ArduinoLocalizationContribution).toSelf().inSingletonScope();
  bind(LocalizationContribution).toService(ArduinoLocalizationContribution);
  bind(HostedPluginLocalizationService).toSelf().inSingletonScope();
  rebind(TheiaHostedPluginLocalizationService).toService(
    HostedPluginLocalizationService
  );

  // Survey notification bindings
  // It's currently unused. https://github.com/arduino/arduino-ide/pull/1150
  bind(SurveyNotificationServiceImpl).toSelf().inSingletonScope();
  bind(SurveyNotificationService).toService(SurveyNotificationServiceImpl);
  bind(ConnectionHandler)
    .toDynamicValue(
      ({ container }) =>
        new JsonRpcConnectionHandler(SurveyNotificationServicePath, () =>
          container.get<SurveyNotificationService>(SurveyNotificationService)
        )
    )
    .inSingletonScope();

  bind(IsTempSketch).toSelf().inSingletonScope();
  rebind(MessagingService.Identifier)
    .to(MessagingContribution)
    .inSingletonScope();

  // Removed undesired contributions from VS Code extensions
  // Such as the RTOS view from the `cortex-debug` extension
  // https://github.com/arduino/arduino-ide/pull/1706#pullrequestreview-1195595080
  bind(HostedPluginReader).toSelf().inSingletonScope();
  rebind(TheiaHostedPluginReader).toService(HostedPluginReader);

  // https://github.com/eclipse-theia/theia/issues/12064
  bind(LocalDirectoryPluginDeployerResolverWithFallback)
    .toSelf()
    .inSingletonScope();
  rebind(PluginDeployer).to(PluginDeployer_GH_12064).inSingletonScope();

  bind(SettingsReader).toSelf().inSingletonScope();
});

function bindChildLogger(bind: interfaces.Bind, name: string): void {
  bind(ILogger)
    .toDynamicValue(({ container }) =>
      container.get<ILogger>(ILogger).child(name)
    )
    .inSingletonScope()
    .whenTargetNamed(name);
}
