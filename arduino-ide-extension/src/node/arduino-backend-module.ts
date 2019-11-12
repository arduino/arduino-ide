import * as fs from 'fs';
import * as os from 'os';
import { join } from 'path';
import { ContainerModule } from 'inversify';
import { ArduinoDaemon } from './arduino-daemon';
import { ILogger } from '@theia/core/lib/common/logger';
import { BackendApplicationContribution } from '@theia/core/lib/node/backend-application';
import { LanguageServerContribution } from '@theia/languages/lib/node';
import { ArduinoLanguageServerContribution } from './language/arduino-language-server-contribution';
import { LibraryService, LibraryServicePath } from '../common/protocol/library-service';
import { BoardsService, BoardsServicePath, BoardsServiceClient } from '../common/protocol/boards-service';
import { LibraryServiceImpl } from './library-service-impl';
import { BoardsServiceImpl } from './boards-service-impl';
import { CoreServiceImpl } from './core-service-impl';
import { CoreService, CoreServicePath } from '../common/protocol/core-service';
import { ConnectionContainerModule } from '@theia/core/lib/node/messaging/connection-container-module';
import { WorkspaceServiceExtPath, WorkspaceServiceExt } from '../browser/workspace-service-ext';
import { CoreClientProviderImpl } from './core-client-provider-impl';
import { CoreClientProviderPath, CoreClientProvider } from './core-client-provider';
import { ToolOutputService, ToolOutputServiceClient, ToolOutputServiceServer } from '../common/protocol/tool-output-service';
import { ConnectionHandler, JsonRpcConnectionHandler } from '@theia/core';
import { ToolOutputServiceServerImpl } from './tool-output-service-impl';
import { DefaultWorkspaceServerExt } from './default-workspace-server-ext';
import { WorkspaceServer } from '@theia/workspace/lib/common';
import { SketchesServiceImpl } from './sketches-service-impl';
import { SketchesService, SketchesServicePath } from '../common/protocol/sketches-service';
import { ConfigService, ConfigServicePath } from '../common/protocol/config-service';
import { MonitorServiceImpl } from './monitor/monitor-service-impl';
import { MonitorService, MonitorServicePath, MonitorServiceClient } from '../common/protocol/monitor-service';
import { MonitorClientProvider } from './monitor/monitor-client-provider';
import { ArduinoCli } from './arduino-cli';
import { ArduinoCliContribution } from './arduino-cli-contribution';
import { CliContribution } from '@theia/core/lib/node';
import { ConfigServiceImpl } from './config-service-impl';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // Theia backend CLI contribution.
    bind(ArduinoCliContribution).toSelf().inSingletonScope();
    bind(CliContribution).toService(ArduinoCliContribution);

    // Provides the path of the Arduino CLI.
    bind(ArduinoCli).toSelf().inSingletonScope();

    // Shared daemon 
    bind(ArduinoDaemon).toSelf().inSingletonScope();
    bind(BackendApplicationContribution).toService(ArduinoDaemon);

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
    
    // Config service
    bind(ConfigServiceImpl).toSelf().inSingletonScope();
    bind(ConfigService).toService(ConfigServiceImpl);
    const configServiceConnectionModule = ConnectionContainerModule.create(({ bind, bindBackendService }) => {
        bindBackendService(ConfigServicePath, ConfigService);
    });
    bind(ConnectionContainerModule).toConstantValue(configServiceConnectionModule);

    // Boards service
    const boardsServiceConnectionModule = ConnectionContainerModule.create(({ bind, bindBackendService }) => {
        bind(BoardsServiceImpl).toSelf().inSingletonScope();
        bind(BoardsService).toService(BoardsServiceImpl);
        bindBackendService<BoardsService, BoardsServiceClient>(BoardsServicePath, BoardsService, (service, client) => {
            service.setClient(client);
            client.onDidCloseConnection(() => service.dispose());
            return service;
        });
    });
    bind(ConnectionContainerModule).toConstantValue(boardsServiceConnectionModule);

    // Arduino core client provider per Theia connection.
    const coreClientProviderConnectionModule = ConnectionContainerModule.create(({ bind, bindBackendService }) => {
        bind(CoreClientProviderImpl).toSelf().inSingletonScope();
        bind(CoreClientProvider).toService(CoreClientProviderImpl);
        bindBackendService(CoreClientProviderPath, CoreClientProvider);
    });
    bind(ConnectionContainerModule).toConstantValue(coreClientProviderConnectionModule);

    // Core service -> `verify` and `upload`. One per Theia connection.
    const connectionConnectionModule = ConnectionContainerModule.create(({ bind, bindBackendService }) => {
        bind(CoreServiceImpl).toSelf().inSingletonScope();
        bind(CoreService).toService(CoreServiceImpl);
        bindBackendService(BoardsServicePath, BoardsService);
        bindBackendService(CoreClientProviderPath, CoreClientProvider);
        bindBackendService(CoreServicePath, CoreService);
    });
    bind(ConnectionContainerModule).toConstantValue(connectionConnectionModule);

    // Tool output service -> feedback from the daemon, compile and flash
    bind(ToolOutputServiceServer).to(ToolOutputServiceServerImpl).inSingletonScope();
    bind(ConnectionHandler).toDynamicValue(context =>
        new JsonRpcConnectionHandler<ToolOutputServiceClient>(ToolOutputService.SERVICE_PATH, client => {
            const server = context.container.get<ToolOutputServiceServer>(ToolOutputServiceServer);
            server.setClient(client);
            client.onDidCloseConnection(() => server.disposeClient(client));
            return server;
        })
    ).inSingletonScope();

    // Bind the workspace service extension to the backend per Theia connection.
    // So that we can access the workspace roots of the frontend.
    const workspaceServiceExtConnectionModule = ConnectionContainerModule.create(({ bindFrontendService }) => {
        bindFrontendService(WorkspaceServiceExtPath, WorkspaceServiceExt);
    });
    bind(ConnectionContainerModule).toConstantValue(workspaceServiceExtConnectionModule);

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
        const executable = os.platform() === 'win32' ? 'clangd.exe' : 'clangd';
        const clangdCommand = join(__dirname, '..', '..', 'build', executable);
        if (fs.existsSync(clangdCommand)) {
            process.env.CPP_CLANGD_COMMAND = clangdCommand;
        }
    }
});
