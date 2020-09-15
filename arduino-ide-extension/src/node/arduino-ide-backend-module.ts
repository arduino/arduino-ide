import * as fs from 'fs';
import * as os from 'os';
import { join } from 'path';
import { ContainerModule } from 'inversify';
import { ArduinoDaemonImpl } from './arduino-daemon-impl';
import { ILogger } from '@theia/core/lib/common/logger';
import { BackendApplicationContribution } from '@theia/core/lib/node/backend-application';
import { LibraryService, LibraryServicePath } from '../common/protocol/library-service';
import { BoardsService, BoardsServicePath } from '../common/protocol/boards-service';
import { LibraryServiceImpl } from './library-service-server-impl';
import { BoardsServiceImpl } from './boards-service-impl';
import { CoreServiceImpl } from './core-service-impl';
import { CoreService, CoreServicePath } from '../common/protocol/core-service';
import { ConnectionContainerModule } from '@theia/core/lib/node/messaging/connection-container-module';
import { CoreClientProvider } from './core-client-provider';
import { ConnectionHandler, JsonRpcConnectionHandler, JsonRpcProxy } from '@theia/core';
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
import { HostedPluginReader } from './theia/plugin-ext/plugin-reader';
import { HostedPluginReader as TheiaHostedPluginReader } from '@theia/plugin-ext/lib/hosted/node/plugin-reader';
import { ConfigFileValidator } from './config-file-validator';
import { EnvVariablesServer as TheiaEnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { EnvVariablesServer } from './theia/env-variables/env-variables-server';
import { NodeFileSystemExt } from './node-filesystem-ext';
import { FileSystemExt, FileSystemExtPath } from '../common/protocol/filesystem-ext';
import { ExamplesServiceImpl } from './examples-service-impl';
import { ExamplesService, ExamplesServicePath } from '../common/protocol/examples-service';
import { ExecutableService, ExecutableServicePath } from '../common/protocol/executable-service';
import { ExecutableServiceImpl } from './executable-service-impl';
import { OutputServicePath, OutputService } from '../common/protocol/output-service';
import { NotificationServiceServerImpl } from './notification-service-server';
import { NotificationServiceServer, NotificationServiceClient, NotificationServicePath } from '../common/protocol';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // Shared config service
    bind(ConfigFileValidator).toSelf().inSingletonScope();
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
        // const ExamplesServiceProxy = Symbol('ExamplesServiceProxy');
        // bind(ExamplesServiceProxy).toDynamicValue(ctx => new Proxy(ctx.container.get(ExamplesService), {}));
        // bindBackendService(ExamplesServicePath, ExamplesServiceProxy);
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
        // const LibraryServiceProxy = Symbol('LibraryServiceProxy');
        // bind(LibraryServiceProxy).toDynamicValue(ctx => new Proxy(ctx.container.get(LibraryService), {}));
        // bindBackendService(LibraryServicePath, LibraryServiceProxy);
        bind(LibraryServiceImpl).toSelf().inSingletonScope();
        bind(LibraryService).toService(LibraryServiceImpl);
        bindBackendService(LibraryServicePath, LibraryService);
    }));

    // Shred sketches service
    bind(SketchesServiceImpl).toSelf().inSingletonScope();
    bind(SketchesService).toService(SketchesServiceImpl);
    bind(ConnectionHandler).toDynamicValue(context => new JsonRpcConnectionHandler(SketchesServicePath, () => context.container.get(SketchesService))).inSingletonScope();

    // Boards service. One singleton per backend that does the board and port polling. Each connected FE gets its proxy.
    bind(ConnectionContainerModule).toConstantValue(ConnectionContainerModule.create(({ bind, bindBackendService }) => {
        // const BoardsServiceProxy = Symbol('BoardsServiceProxy');
        // bind(BoardsServiceProxy).toDynamicValue(ctx => new Proxy(ctx.container.get(BoardsService), {}));
        // bindBackendService(BoardsServicePath, BoardsServiceProxy);
        bind(BoardsServiceImpl).toSelf().inSingletonScope();
        bind(BoardsService).toService(BoardsServiceImpl);
        bindBackendService<BoardsServiceImpl, JsonRpcProxy<object>>(BoardsServicePath, BoardsService, (service, client) => {
            client.onDidCloseConnection(() => service.dispose());
            return service;
        });
    }));

    // Shared Arduino core client provider service for the backend.
    bind(CoreClientProvider).toSelf().inSingletonScope();

    // Core service -> `verify` and `upload`. Singleton per BE, each FE connection gets its proxy.
    bind(ConnectionContainerModule).toConstantValue(ConnectionContainerModule.create(({ bind, bindBackendService }) => {
        // const CoreServiceProxy = Symbol('CoreServiceProxy');
        // bind(CoreServiceProxy).toDynamicValue(ctx => new Proxy(ctx.container.get(CoreService), {}));
        // bindBackendService(CoreServicePath, CoreServiceProxy);
        bind(CoreServiceImpl).toSelf().inSingletonScope();
        bind(CoreService).toService(CoreServiceImpl);
        bindBackendService(CoreServicePath, CoreService);
    }));

    // #region Theia customizations

    bind(DefaultWorkspaceServer).toSelf().inSingletonScope();
    rebind(TheiaWorkspaceServer).toService(DefaultWorkspaceServer);

    bind(EnvVariablesServer).toSelf().inSingletonScope();
    rebind(TheiaEnvVariablesServer).toService(EnvVariablesServer);

    bind(HostedPluginReader).toSelf().inSingletonScope();
    rebind(TheiaHostedPluginReader).toService(HostedPluginReader);

    // #endregion Theia customizations

    // Shared monitor client provider service for the backend.
    bind(MonitorClientProvider).toSelf().inSingletonScope();
    bind(MonitorServiceImpl).toSelf().inSingletonScope();
    bind(MonitorService).toService(MonitorServiceImpl);
    bind(ConnectionContainerModule).toConstantValue(ConnectionContainerModule.create(({ bind, bindBackendService }) => {
        const MonitorServiceProxy = Symbol('MonitorServiceProxy');
        bind(MonitorServiceProxy).toDynamicValue(ctx => new Proxy(ctx.container.get(MonitorService), {}));
        bindBackendService<MonitorService, MonitorServiceClient>(MonitorServicePath, MonitorServiceProxy, (service, client) => {
            service.setClient(client);
            client.onDidCloseConnection(() => service.dispose());
            return service;
        });
    }));

    // Set up cpp extension
    if (!process.env.CPP_CLANGD_COMMAND) {
        const segments = ['..', '..', 'build'];
        if (os.platform() === 'win32') {
            segments.push('clangd.exe');
        } else {
            segments.push('bin');
            segments.push('clangd');
        }
        const clangdCommand = join(__dirname, ...segments);
        if (fs.existsSync(clangdCommand)) {
            process.env.CPP_CLANGD_COMMAND = clangdCommand;
        }
    }

    // File-system extension for mapping paths to URIs
    bind(NodeFileSystemExt).toSelf().inSingletonScope();
    bind(FileSystemExt).toService(NodeFileSystemExt);
    bind(ConnectionHandler).toDynamicValue(context => new JsonRpcConnectionHandler(FileSystemExtPath, () => context.container.get(FileSystemExt))).inSingletonScope();

    // Output service per connection.
    bind(ConnectionContainerModule).toConstantValue(ConnectionContainerModule.create(({ bindFrontendService }) => {
        bindFrontendService(OutputServicePath, OutputService);
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

});
