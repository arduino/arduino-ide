import { ContainerModule } from 'inversify';
import { ArduinoDaemon } from './arduino-daemon';
import { ILogger } from '@theia/core/lib/common/logger';
import { BackendApplicationContribution } from '@theia/core/lib/node/backend-application';
import { LibraryService, LibraryServicePath } from '../common/protocol/library-service';
import { BoardsService, BoardsServicePath } from '../common/protocol/boards-service';
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

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(ArduinoDaemon).toSelf().inSingletonScope();
    bind(BackendApplicationContribution).toService(ArduinoDaemon);

    // Library service
    const libraryServiceConnectionModule = ConnectionContainerModule.create(({ bind, bindBackendService }) => {
        bind(LibraryServiceImpl).toSelf().inSingletonScope();
        bind(LibraryService).toService(LibraryServiceImpl);
        bindBackendService(LibraryServicePath, LibraryService);
    });
    bind(ConnectionContainerModule).toConstantValue(libraryServiceConnectionModule);

    // Boards service
    const boardsServiceConnectionModule = ConnectionContainerModule.create(({ bind, bindBackendService }) => {
        bind(BoardsServiceImpl).toSelf().inSingletonScope();
        bind(BoardsService).toService(BoardsServiceImpl);
        bindBackendService(BoardsServicePath, BoardsService);
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

    // Default workspace server extension to initialize and use a fallback workspace (`~/Arduino-PoC/workspace/`)
    // If nothing was set previously.
    bind(DefaultWorkspaceServerExt).toSelf().inSingletonScope();
    rebind(WorkspaceServer).toService(DefaultWorkspaceServerExt);
});
