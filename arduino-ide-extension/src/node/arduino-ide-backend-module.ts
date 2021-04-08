import { ContainerModule } from 'inversify';
import { ArduinoDaemonImpl } from './arduino-daemon-impl';
import { ILogger } from '@theia/core/lib/common/logger';
import { BackendApplicationContribution, BackendApplication as TheiaBackendApplication } from '@theia/core/lib/node/backend-application';
import { LibraryService, LibraryServicePath } from '../common/protocol/library-service';
import { BoardsService, BoardsServicePath } from '../common/protocol/boards-service';
import { LibraryServiceImpl } from './library-service-server-impl';
import { BoardsServiceImpl } from './boards-service-impl';
import { CoreServiceImpl } from './core-service-impl';
import { CoreService, CoreServicePath } from '../common/protocol/core-service';
import { ConnectionContainerModule } from '@theia/core/lib/node/messaging/connection-container-module';
import { CoreClientProvider } from './core-client-provider';
import { ConnectionHandler, JsonRpcConnectionHandler } from '@theia/core';
import { DefaultWorkspaceServer } from './theia/workspace/default-workspace-server';
import { WorkspaceServer as TheiaWorkspaceServer } from '@theia/workspace/lib/common';
import { SketchesServiceImpl } from './sketches-service-impl';
import { SketchesService, SketchesServicePath } from '../common/protocol/sketches-service';
import { ConfigService, ConfigServicePath } from '../common/protocol/config-service';
import { ArduinoDaemon, ArduinoDaemonPath } from '../common/protocol/arduino-daemon';
import { MonitorServiceImpl } from './monitor/monitor-service-impl';
import { MonitorService, MonitorServicePath, MonitorServiceClient } from '../common/protocol/monitor-service';
import { MonitorClientProvider } from './monitor/monitor-client-provider';
import { ConfigServiceImpl } from './config-service-impl';
import { EnvVariablesServer as TheiaEnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { EnvVariablesServer } from './theia/env-variables/env-variables-server';
import { NodeFileSystemExt } from './node-filesystem-ext';
import { FileSystemExt, FileSystemExtPath } from '../common/protocol/filesystem-ext';
import { ExamplesServiceImpl } from './examples-service-impl';
import { ExamplesService, ExamplesServicePath } from '../common/protocol/examples-service';
import { ExecutableService, ExecutableServicePath } from '../common/protocol/executable-service';
import { ExecutableServiceImpl } from './executable-service-impl';
import { ResponseServicePath, ResponseService } from '../common/protocol/response-service';
import { NotificationServiceServerImpl } from './notification-service-server';
import { NotificationServiceServer, NotificationServiceClient, NotificationServicePath } from '../common/protocol';
import { BackendApplication } from './theia/core/backend-application';
import { BoardDiscovery } from './board-discovery';
import { DefaultGitInit } from './theia/git/git-init';
import { GitInit } from '@theia/git/lib/node/init/git-init';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(BackendApplication).toSelf().inSingletonScope();
    rebind(TheiaBackendApplication).toService(BackendApplication);

    // Shared config service
    bind(ConfigServiceImpl).toSelf().inSingletonScope();
    bind(ConfigService).toService(ConfigServiceImpl);
    // Note: The config service must start earlier than the daemon, hence the binding order of the BA contribution does matter.
    bind(BackendApplicationContribution).toService(ConfigServiceImpl);
    bind(ConnectionHandler).toDynamicValue(context => new JsonRpcConnectionHandler(ConfigServicePath, () => context.container.get(ConfigService))).inSingletonScope();

    // Shared daemon 
    bind(ArduinoDaemonImpl).toSelf().inSingletonScope();
    bind(ArduinoDaemon).toService(ArduinoDaemonImpl);
    bind(BackendApplicationContribution).toService(ArduinoDaemonImpl);
    bind(ConnectionHandler).toDynamicValue(context => new JsonRpcConnectionHandler(ArduinoDaemonPath, () => context.container.get(ArduinoDaemon))).inSingletonScope();

    // Examples service. One per backend, each connected FE gets a proxy.
    bind(ConnectionContainerModule).toConstantValue(ConnectionContainerModule.create(({ bind, bindBackendService }) => {
        bind(ExamplesServiceImpl).toSelf().inSingletonScope();
        bind(ExamplesService).toService(ExamplesServiceImpl);
        bindBackendService(ExamplesServicePath, ExamplesService);
    }));

    // Exposes the executable paths/URIs to the frontend
    bind(ExecutableServiceImpl).toSelf().inSingletonScope();
    bind(ExecutableService).toService(ExecutableServiceImpl);
    bind(ConnectionHandler).toDynamicValue(context => new JsonRpcConnectionHandler(ExecutableServicePath, () => context.container.get(ExecutableService))).inSingletonScope();

    // Library service. Singleton per backend, each connected FE gets its proxy.
    bind(ConnectionContainerModule).toConstantValue(ConnectionContainerModule.create(({ bind, bindBackendService }) => {
        bind(LibraryServiceImpl).toSelf().inSingletonScope();
        bind(LibraryService).toService(LibraryServiceImpl);
        bindBackendService(LibraryServicePath, LibraryService);
    }));

    // Shared sketches service
    bind(SketchesServiceImpl).toSelf().inSingletonScope();
    bind(SketchesService).toService(SketchesServiceImpl);
    bind(ConnectionHandler).toDynamicValue(context => new JsonRpcConnectionHandler(SketchesServicePath, () => context.container.get(SketchesService))).inSingletonScope();

    // Boards service. One instance per connected frontend.
    bind(ConnectionContainerModule).toConstantValue(ConnectionContainerModule.create(({ bind, bindBackendService }) => {
        bind(BoardsServiceImpl).toSelf().inSingletonScope();
        bind(BoardsService).toService(BoardsServiceImpl);
        bindBackendService(BoardsServicePath, BoardsService);
    }));

    // Shared Arduino core client provider service for the backend.
    bind(CoreClientProvider).toSelf().inSingletonScope();

    // Shared port/board discovery for the server
    bind(BoardDiscovery).toSelf().inSingletonScope();

    // Core service -> `verify` and `upload`. Singleton per BE, each FE connection gets its proxy.
    bind(ConnectionContainerModule).toConstantValue(ConnectionContainerModule.create(({ bind, bindBackendService }) => {
        bind(CoreServiceImpl).toSelf().inSingletonScope();
        bind(CoreService).toService(CoreServiceImpl);
        bindBackendService(CoreServicePath, CoreService);
    }));

    // #region Theia customizations

    bind(DefaultWorkspaceServer).toSelf().inSingletonScope();
    rebind(TheiaWorkspaceServer).toService(DefaultWorkspaceServer);

    bind(EnvVariablesServer).toSelf().inSingletonScope();
    rebind(TheiaEnvVariablesServer).toService(EnvVariablesServer);

    // #endregion Theia customizations

    // Monitor client provider per connected frontend.
    bind(ConnectionContainerModule).toConstantValue(ConnectionContainerModule.create(({ bind, bindBackendService }) => {
        bind(MonitorClientProvider).toSelf().inSingletonScope();
        bind(MonitorServiceImpl).toSelf().inSingletonScope();
        bind(MonitorService).toService(MonitorServiceImpl);
        bindBackendService<MonitorService, MonitorServiceClient>(MonitorServicePath, MonitorService, (service, client) => {
            service.setClient(client);
            client.onDidCloseConnection(() => service.dispose());
            return service;
        });
    }));

    // File-system extension for mapping paths to URIs
    bind(NodeFileSystemExt).toSelf().inSingletonScope();
    bind(FileSystemExt).toService(NodeFileSystemExt);
    bind(ConnectionHandler).toDynamicValue(context => new JsonRpcConnectionHandler(FileSystemExtPath, () => context.container.get(FileSystemExt))).inSingletonScope();

    // Output service per connection.
    bind(ConnectionContainerModule).toConstantValue(ConnectionContainerModule.create(({ bindFrontendService }) => {
        bindFrontendService(ResponseServicePath, ResponseService);
    }));

    // Notify all connected frontend instances
    bind(NotificationServiceServerImpl).toSelf().inSingletonScope();
    bind(NotificationServiceServer).toService(NotificationServiceServerImpl);
    bind(ConnectionHandler).toDynamicValue(context =>
        new JsonRpcConnectionHandler<NotificationServiceClient>(NotificationServicePath, client => {
            const server = context.container.get<NotificationServiceServer>(NotificationServiceServer);
            server.setClient(client);
            client.onDidCloseConnection(() => server.disposeClient(client));
            return server;
        })
    ).inSingletonScope();

    // Logger for the Arduino daemon
    bind(ILogger).toDynamicValue(ctx => {
        const parentLogger = ctx.container.get<ILogger>(ILogger);
        return parentLogger.child('daemon');
    }).inSingletonScope().whenTargetNamed('daemon');

    // Logger for the "serial discovery".
    bind(ILogger).toDynamicValue(ctx => {
        const parentLogger = ctx.container.get<ILogger>(ILogger);
        return parentLogger.child('discovery');
    }).inSingletonScope().whenTargetNamed('discovery');

    // Logger for the CLI config service. From the CLI config (FS path aware), we make a URI-aware app config.
    bind(ILogger).toDynamicValue(ctx => {
        const parentLogger = ctx.container.get<ILogger>(ILogger);
        return parentLogger.child('config');
    }).inSingletonScope().whenTargetNamed('config');

    // Logger for the monitor service.
    bind(ILogger).toDynamicValue(ctx => {
        const parentLogger = ctx.container.get<ILogger>(ILogger);
        return parentLogger.child('monitor-service');
    }).inSingletonScope().whenTargetNamed('monitor-service');

    bind(DefaultGitInit).toSelf();
    rebind(GitInit).toService(DefaultGitInit);

});
