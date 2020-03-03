import * as fs from 'fs';
import * as os from 'os';
import { join } from 'path';
import { ContainerModule } from 'inversify';
import { ArduinoDaemonImpl } from './arduino-daemon-impl';
import { ILogger } from '@theia/core/lib/common/logger';
import { BackendApplicationContribution } from '@theia/core/lib/node/backend-application';
import { LanguageServerContribution } from '@theia/languages/lib/node';
import { ArduinoLanguageServerContribution } from './language/arduino-language-server-contribution';
import { LibraryService, LibraryServicePath } from '../common/protocol/library-service';
import { BoardsService, BoardsServicePath, BoardsServiceClient } from '../common/protocol/boards-service';
import { LibraryServiceImpl } from './library-service-impl';
import { BoardsServiceImpl } from './boards-service-impl';
import { CoreServiceImpl } from './core-service-impl';
import { CoreService, CoreServicePath, CoreServiceClient } from '../common/protocol/core-service';
import { ConnectionContainerModule } from '@theia/core/lib/node/messaging/connection-container-module';
import { CoreClientProvider } from './core-client-provider';
import { ToolOutputService, ToolOutputServiceClient, ToolOutputServiceServer } from '../common/protocol/tool-output-service';
import { ConnectionHandler, JsonRpcConnectionHandler } from '@theia/core';
import { ToolOutputServiceServerImpl } from './tool-output-service-impl';
import { DefaultWorkspaceServerExt } from './default-workspace-server-ext';
import { WorkspaceServer } from '@theia/workspace/lib/common';
import { SketchesServiceImpl } from './sketches-service-impl';
import { SketchesService, SketchesServicePath } from '../common/protocol/sketches-service';
import { ConfigService, ConfigServicePath, ConfigServiceClient } from '../common/protocol/config-service';
import { ArduinoDaemon, ArduinoDaemonPath, ArduinoDaemonClient } from '../common/protocol/arduino-daemon';
import { MonitorServiceImpl } from './monitor/monitor-service-impl';
import { MonitorService, MonitorServicePath, MonitorServiceClient } from '../common/protocol/monitor-service';
import { MonitorClientProvider } from './monitor/monitor-client-provider';
import { ConfigServiceImpl } from './config-service-impl';
import { ArduinoHostedPluginReader } from './arduino-plugin-reader';
import { HostedPluginReader } from '@theia/plugin-ext/lib/hosted/node/plugin-reader';
import { ConfigFileValidator } from './config-file-validator';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { ArduinoEnvVariablesServer } from './arduino-env-variables-server';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    rebind(EnvVariablesServer).to(ArduinoEnvVariablesServer).inSingletonScope();
    bind(ConfigFileValidator).toSelf().inSingletonScope();
    // XXX: The config service must start earlier than the daemon, hence the binding order does matter.
    // Shared config service
    bind(ConfigServiceImpl).toSelf().inSingletonScope();
    bind(ConfigService).toService(ConfigServiceImpl);
    bind(BackendApplicationContribution).toService(ConfigServiceImpl);
    bind(ConnectionHandler).toDynamicValue(context =>
        new JsonRpcConnectionHandler<ConfigServiceClient>(ConfigServicePath, client => {
            const server = context.container.get<ConfigServiceImpl>(ConfigServiceImpl);
            server.setClient(client);
            client.onDidCloseConnection(() => server.disposeClient(client));
            return server;
        })
    ).inSingletonScope();

    // Shared daemon 
    bind(ArduinoDaemonImpl).toSelf().inSingletonScope();
    bind(ArduinoDaemon).toService(ArduinoDaemonImpl);
    bind(BackendApplicationContribution).toService(ArduinoDaemonImpl);
    bind(ConnectionHandler).toDynamicValue(context =>
        new JsonRpcConnectionHandler<ArduinoDaemonClient>(ArduinoDaemonPath, async client => {
            const server = context.container.get<ArduinoDaemonImpl>(ArduinoDaemonImpl);
            server.setClient(client);
            client.onDidCloseConnection(() => server.disposeClient(client));
            return server;
        })
    ).inSingletonScope();

    // Language server
    bind(ArduinoLanguageServerContribution).toSelf().inSingletonScope();
    bind(LanguageServerContribution).toService(ArduinoLanguageServerContribution);

    // Library service
    const libraryServiceConnectionModule = ConnectionContainerModule.create(({ bind, bindBackendService }) => {
        bind(LibraryServiceImpl).toSelf().inSingletonScope();
        bind(LibraryService).toService(LibraryServiceImpl);
        bindBackendService(LibraryServicePath, LibraryService);
    });
    bind(ConnectionContainerModule).toConstantValue(libraryServiceConnectionModule);

    // Sketches service
    const sketchesServiceConnectionModule = ConnectionContainerModule.create(({ bind, bindBackendService }) => {
        bind(SketchesServiceImpl).toSelf().inSingletonScope();
        bind(SketchesService).toService(SketchesServiceImpl);
        bindBackendService(SketchesServicePath, SketchesService);
    });
    bind(ConnectionContainerModule).toConstantValue(sketchesServiceConnectionModule);

    // Boards service
    const boardsServiceConnectionModule = ConnectionContainerModule.create(async ({ bind, bindBackendService }) => {
        bind(BoardsServiceImpl).toSelf().inSingletonScope();
        bind(BoardsService).toService(BoardsServiceImpl);
        bindBackendService<BoardsService, BoardsServiceClient>(BoardsServicePath, BoardsService, (service, client) => {
            service.setClient(client);
            client.onDidCloseConnection(() => service.dispose());
            return service;
        });
    });
    bind(ConnectionContainerModule).toConstantValue(boardsServiceConnectionModule);

    // Shared Arduino core client provider service for the backend.
    bind(CoreClientProvider).toSelf().inSingletonScope();

    // Core service -> `verify` and `upload`. One per Theia connection.
    const connectionConnectionModule = ConnectionContainerModule.create(({ bind, bindBackendService }) => {
        bind(CoreServiceImpl).toSelf().inSingletonScope();
        bind(CoreService).toService(CoreServiceImpl);
        bindBackendService(BoardsServicePath, BoardsService);
        bindBackendService<CoreService, CoreServiceClient>(CoreServicePath, CoreService, (service, client) => {
            service.setClient(client);
            client.onDidCloseConnection(() => service.dispose());
            return service;
        });
    });
    bind(ConnectionContainerModule).toConstantValue(connectionConnectionModule);

    // Tool output service -> feedback from the daemon, compile and flash
    bind(ToolOutputServiceServerImpl).toSelf().inSingletonScope();
    bind(ToolOutputServiceServer).toService(ToolOutputServiceServerImpl);
    bind(ConnectionHandler).toDynamicValue(context =>
        new JsonRpcConnectionHandler<ToolOutputServiceClient>(ToolOutputService.SERVICE_PATH, client => {
            const server = context.container.get<ToolOutputServiceServer>(ToolOutputServiceServer);
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

    // Default workspace server extension to initialize and use a fallback workspace.
    // If nothing was set previously.
    bind(DefaultWorkspaceServerExt).toSelf().inSingletonScope();
    rebind(WorkspaceServer).toService(DefaultWorkspaceServerExt);

    // Shared monitor client provider service for the backend.
    bind(MonitorClientProvider).toSelf().inSingletonScope();

    // Connection scoped service for the serial monitor.
    const monitorServiceConnectionModule = ConnectionContainerModule.create(({ bind, bindBackendService }) => {
        bind(MonitorServiceImpl).toSelf().inSingletonScope();
        bind(MonitorService).toService(MonitorServiceImpl);
        bindBackendService<MonitorService, MonitorServiceClient>(MonitorServicePath, MonitorService, (service, client) => {
            service.setClient(client);
            client.onDidCloseConnection(() => service.dispose());
            return service;
        });
    });
    bind(ConnectionContainerModule).toConstantValue(monitorServiceConnectionModule);

    // Logger for the monitor service.
    bind(ILogger).toDynamicValue(ctx => {
        const parentLogger = ctx.container.get<ILogger>(ILogger);
        return parentLogger.child('monitor-service');
    }).inSingletonScope().whenTargetNamed('monitor-service');

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

    bind(ArduinoHostedPluginReader).toSelf().inSingletonScope();
    rebind(HostedPluginReader).toService(ArduinoHostedPluginReader);
});
