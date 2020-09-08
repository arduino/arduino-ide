import '../../src/browser/style/index.css';
import { ContainerModule } from 'inversify';
import { WidgetFactory } from '@theia/core/lib/browser/widget-manager';
import { CommandContribution } from '@theia/core/lib/common/command';
import { bindViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import { TabBarToolbarContribution, TabBarToolbarFactory } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { WebSocketConnectionProvider } from '@theia/core/lib/browser/messaging/ws-connection-provider';
import { FrontendApplicationContribution, FrontendApplication as TheiaFrontendApplication } from '@theia/core/lib/browser/frontend-application'
import { LibraryListWidget } from './library/library-list-widget';
import { ArduinoFrontendContribution } from './arduino-frontend-contribution';
import { LibraryServiceServer, LibraryServiceServerPath } from '../common/protocol/library-service';
import { BoardsService, BoardsServicePath, BoardsServiceClient } from '../common/protocol/boards-service';
import { SketchesService, SketchesServicePath } from '../common/protocol/sketches-service';
import { SketchesServiceClientImpl } from '../common/protocol/sketches-service-client-impl';
import { CoreService, CoreServicePath, CoreServiceClient } from '../common/protocol/core-service';
import { BoardsListWidget } from './boards/boards-list-widget';
import { BoardsListWidgetFrontendContribution } from './boards/boards-widget-frontend-contribution';
import { ToolOutputServiceClient } from '../common/protocol/tool-output-service';
import { ToolOutputService } from '../common/protocol/tool-output-service';
import { ToolOutputServiceClientImpl } from './tool-output/client-service-impl';
import { BoardsServiceClientImpl } from './boards/boards-service-client-impl';
import { WorkspaceService as TheiaWorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import { WorkspaceService } from './theia/workspace/workspace-service';
import { OutlineViewContribution as TheiaOutlineViewContribution } from '@theia/outline-view/lib/browser/outline-view-contribution';
import { OutlineViewContribution } from './theia/outline/outline-contribution';
import { ProblemContribution as TheiaProblemContribution } from '@theia/markers/lib/browser/problem/problem-contribution';
import { ProblemContribution } from './theia/markers/problem-contribution';
import { FileNavigatorContribution } from './theia/navigator/navigator-contribution';
import { FileNavigatorContribution as TheiaFileNavigatorContribution } from '@theia/navigator/lib/browser/navigator-contribution';
import { ArduinoToolbarContribution } from './toolbar/arduino-toolbar-contribution';
import { EditorContribution as TheiaEditorContribution } from '@theia/editor/lib/browser/editor-contribution';
import { EditorContribution } from './theia/editor/editor-contribution';
import { MonacoStatusBarContribution as TheiaMonacoStatusBarContribution } from '@theia/monaco/lib/browser/monaco-status-bar-contribution';
import { MonacoStatusBarContribution } from './theia/monaco/monaco-status-bar-contribution';
import {
    ApplicationShell as TheiaApplicationShell,
    ShellLayoutRestorer as TheiaShellLayoutRestorer,
    CommonFrontendContribution as TheiaCommonFrontendContribution,
    KeybindingRegistry as TheiaKeybindingRegistry
} from '@theia/core/lib/browser';
import { MenuContribution } from '@theia/core/lib/common/menu';
import { ApplicationShell } from './theia/core/application-shell';
import { FrontendApplication } from './theia/core/frontend-application';
import { BoardsConfigDialog, BoardsConfigDialogProps } from './boards/boards-config-dialog';
import { BoardsConfigDialogWidget } from './boards/boards-config-dialog-widget';
import { ScmContribution as TheiaScmContribution } from '@theia/scm/lib/browser/scm-contribution';
import { ScmContribution } from './theia/scm/scm-contribution';
import { SearchInWorkspaceFrontendContribution as TheiaSearchInWorkspaceFrontendContribution } from '@theia/search-in-workspace/lib/browser/search-in-workspace-frontend-contribution';
import { SearchInWorkspaceFrontendContribution } from './theia/search-in-workspace/search-in-workspace-frontend-contribution';
import { LibraryListWidgetFrontendContribution } from './library/library-widget-frontend-contribution';
import { MonitorServiceClientImpl } from './monitor/monitor-service-client-impl';
import { MonitorServicePath, MonitorService, MonitorServiceClient } from '../common/protocol/monitor-service';
import { ConfigService, ConfigServicePath, ConfigServiceClient } from '../common/protocol/config-service';
import { MonitorWidget } from './monitor/monitor-widget';
import { MonitorViewContribution } from './monitor/monitor-view-contribution';
import { MonitorConnection } from './monitor/monitor-connection';
import { MonitorModel } from './monitor/monitor-model';
import { TabBarDecoratorService as TheiaTabBarDecoratorService } from '@theia/core/lib/browser/shell/tab-bar-decorator';
import { TabBarDecoratorService } from './theia/core/tab-bar-decorator';
import { ProblemManager as TheiaProblemManager } from '@theia/markers/lib/browser';
import { ProblemManager } from './theia/markers/problem-manager';
import { BoardsAutoInstaller } from './boards/boards-auto-installer';
import { AboutDialog as TheiaAboutDialog } from '@theia/core/lib/browser/about-dialog';
import { AboutDialog } from './theia/core/about-dialog';
import { ShellLayoutRestorer } from './theia/core/shell-layout-restorer';
import { EditorMode } from './editor-mode';
import { ListItemRenderer } from './widgets/component-list/list-item-renderer';
import { ColorContribution } from '@theia/core/lib/browser/color-application-contribution';
import { MonacoThemingService } from '@theia/monaco/lib/browser/monaco-theming-service';
import { ArduinoDaemonClientImpl } from './arduino-daemon-client-impl';
import { ArduinoDaemonClient, ArduinoDaemonPath, ArduinoDaemon } from '../common/protocol/arduino-daemon';
import { EditorManager as TheiaEditorManager } from '@theia/editor/lib/browser';
import { EditorManager } from './theia/editor/editor-manager';
import { FrontendConnectionStatusService, ApplicationConnectionStatusContribution } from './theia/core/connection-status-service';
import {
    FrontendConnectionStatusService as TheiaFrontendConnectionStatusService,
    ApplicationConnectionStatusContribution as TheiaApplicationConnectionStatusContribution
} from '@theia/core/lib/browser/connection-status-service';
import { ConfigServiceClientImpl } from './config-service-client-impl';
import { CoreServiceClientImpl } from './core-service-client-impl';
import { BoardsDataMenuUpdater } from './boards/boards-data-menu-updater';
import { BoardsDataStore } from './boards/boards-data-store';
import { ILogger } from '@theia/core';
import { FileSystemExt, FileSystemExtPath } from '../common/protocol/filesystem-ext';
import {
    WorkspaceFrontendContribution as TheiaWorkspaceFrontendContribution,
    FileMenuContribution as TheiaFileMenuContribution,
    WorkspaceCommandContribution as TheiaWorkspaceCommandContribution
} from '@theia/workspace/lib/browser';
import { WorkspaceFrontendContribution, ArduinoFileMenuContribution } from './theia/workspace/workspace-frontend-contribution';
import { Contribution } from './contributions/contribution';
import { NewSketch } from './contributions/new-sketch';
import { OpenSketch } from './contributions/open-sketch';
import { CloseSketch } from './contributions/close-sketch';
import { SaveAsSketch } from './contributions/save-as-sketch';
import { SaveSketch } from './contributions/save-sketch';
import { VerifySketch } from './contributions/verify-sketch';
import { UploadSketch } from './contributions/upload-sketch';
import { CommonFrontendContribution } from './theia/core/common-frontend-contribution';
import { EditContributions } from './contributions/edit-contributions';
import { OpenSketchExternal } from './contributions/open-sketch-external';
import { PreferencesContribution as TheiaPreferencesContribution } from '@theia/preferences/lib/browser/preferences-contribution';
import { PreferencesContribution } from './theia/preferences/preferences-contribution';
import { QuitApp } from './contributions/quit-app';
import { SketchControl } from './contributions/sketch-control';
import { Settings } from './contributions/settings';
import { KeybindingRegistry } from './theia/core/keybindings';
import { WorkspaceCommandContribution } from './theia/workspace/workspace-commands';
import { WorkspaceDeleteHandler as TheiaWorkspaceDeleteHandler } from '@theia/workspace/lib/browser/workspace-delete-handler';
import { WorkspaceDeleteHandler } from './theia/workspace/workspace-delete-handler';
import { TabBarToolbar } from './theia/core/tab-bar-toolbar';
import { EditorWidgetFactory as TheiaEditorWidgetFactory } from '@theia/editor/lib/browser/editor-widget-factory';
import { EditorWidgetFactory } from './theia/editor/editor-widget-factory';
import { OutputWidget as TheiaOutputWidget } from '@theia/output/lib/browser/output-widget';
import { OutputWidget } from './theia/output/output-widget';
import { BurnBootloader } from './contributions/burn-bootloader';
import { ExamplesServicePath, ExamplesService } from '../common/protocol/examples-service';
import { BuiltInExamples, LibraryExamples } from './contributions/examples';
import { LibraryServiceProvider } from './library/library-service-provider';
import { IncludeLibrary } from './contributions/include-library';
import { OutputChannelManager as TheiaOutputChannelManager } from '@theia/output/lib/common/output-channel';
import { OutputChannelManager } from './theia/output/output-channel';
import { OutputChannelRegistryMainImpl as TheiaOutputChannelRegistryMainImpl, OutputChannelRegistryMainImpl } from './theia/plugin-ext/output-channel-registry-main';
import { ExecutableService, ExecutableServicePath } from '../common/protocol';
import { MonacoTextModelService as TheiaMonacoTextModelService } from '@theia/monaco/lib/browser/monaco-text-model-service';
import { MonacoTextModelService } from './theia/monaco/monaco-text-model-service';

const ElementQueries = require('css-element-queries/src/ElementQueries');

MonacoThemingService.register({
    id: 'arduinoTheme',
    label: 'Light (Arduino)',
    uiTheme: 'vs',
    json: require('../../src/browser/data/arduino.color-theme.json')
});

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    ElementQueries.listen();
    ElementQueries.init();

    // Commands and toolbar items
    bind(ArduinoFrontendContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(ArduinoFrontendContribution);
    bind(MenuContribution).toService(ArduinoFrontendContribution);
    bind(TabBarToolbarContribution).toService(ArduinoFrontendContribution);
    bind(FrontendApplicationContribution).toService(ArduinoFrontendContribution);
    bind(ColorContribution).toService(ArduinoFrontendContribution);

    bind(ArduinoToolbarContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(ArduinoToolbarContribution);

    // Renderer for both the library and the core widgets.
    bind(ListItemRenderer).toSelf().inSingletonScope();

    // Library service
    bind(LibraryServiceProvider).toSelf().inSingletonScope();
    bind(LibraryServiceServer).toDynamicValue(context => WebSocketConnectionProvider.createProxy(context.container, LibraryServiceServerPath)).inSingletonScope();

    // Library list widget
    bind(LibraryListWidget).toSelf();
    bindViewContribution(bind, LibraryListWidgetFrontendContribution);
    bind(WidgetFactory).toDynamicValue(context => ({
        id: LibraryListWidget.WIDGET_ID,
        createWidget: () => context.container.get(LibraryListWidget)
    }));
    bind(FrontendApplicationContribution).toService(LibraryListWidgetFrontendContribution);

    // Sketch list service
    bind(SketchesService).toDynamicValue(context => WebSocketConnectionProvider.createProxy(context.container, SketchesServicePath)).inSingletonScope();
    bind(SketchesServiceClientImpl).toSelf().inSingletonScope();

    // Config service
    bind(ConfigService).toDynamicValue(context => {
        const connection = context.container.get(WebSocketConnectionProvider);
        const client = context.container.get(ConfigServiceClientImpl);
        return connection.createProxy(ConfigServicePath, client);
    }).inSingletonScope();
    bind(ConfigServiceClientImpl).toSelf().inSingletonScope();
    bind(ConfigServiceClient).toDynamicValue(context => {
        const client = context.container.get(ConfigServiceClientImpl);
        WebSocketConnectionProvider.createProxy(context.container, ConfigServicePath, client);
        return client;
    }).inSingletonScope();

    // Boards service
    bind(BoardsService).toDynamicValue(context => {
        const connection = context.container.get(WebSocketConnectionProvider);
        const client = context.container.get(BoardsServiceClientImpl);
        return connection.createProxy(BoardsServicePath, client);
    }).inSingletonScope();
    // Boards service client to receive and delegate notifications from the backend.
    bind(BoardsServiceClientImpl).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(BoardsServiceClientImpl);
    bind(BoardsServiceClient).toDynamicValue(async context => {
        const client = context.container.get(BoardsServiceClientImpl);
        const service = context.container.get<BoardsService>(BoardsService);
        await client.init(service);
        WebSocketConnectionProvider.createProxy(context.container, BoardsServicePath, client);
        return client;
    }).inSingletonScope();

    // To be able to track, and update the menu based on the core settings (aka. board details) of the currently selected board.
    bind(FrontendApplicationContribution).to(BoardsDataMenuUpdater).inSingletonScope();
    bind(BoardsDataStore).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(BoardsDataStore);
    // Logger for the Arduino daemon
    bind(ILogger).toDynamicValue(ctx => {
        const parentLogger = ctx.container.get<ILogger>(ILogger);
        return parentLogger.child('store');
    }).inSingletonScope().whenTargetNamed('store');

    // Boards auto-installer
    bind(BoardsAutoInstaller).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(BoardsAutoInstaller);

    // Boards list widget
    bind(BoardsListWidget).toSelf();
    bindViewContribution(bind, BoardsListWidgetFrontendContribution);
    bind(WidgetFactory).toDynamicValue(context => ({
        id: BoardsListWidget.WIDGET_ID,
        createWidget: () => context.container.get(BoardsListWidget)
    }));
    bind(FrontendApplicationContribution).toService(BoardsListWidgetFrontendContribution);

    // Board select dialog
    bind(BoardsConfigDialogWidget).toSelf().inSingletonScope();
    bind(BoardsConfigDialog).toSelf().inSingletonScope();
    bind(BoardsConfigDialogProps).toConstantValue({
        title: 'Select Board'
    })

    // Core service
    bind(CoreService).toDynamicValue(context => {
        const connection = context.container.get(WebSocketConnectionProvider);
        const client = context.container.get(CoreServiceClientImpl);
        return connection.createProxy(CoreServicePath, client);
    }).inSingletonScope();
    // Core service client to receive and delegate notifications when the index or the library index has been updated.
    bind(CoreServiceClientImpl).toSelf().inSingletonScope();
    bind(CoreServiceClient).toDynamicValue(context => {
        const client = context.container.get(CoreServiceClientImpl);
        WebSocketConnectionProvider.createProxy(context.container, CoreServicePath, client);
        return client;
    }).inSingletonScope();

    // Tool output service client
    bind(ToolOutputServiceClientImpl).toSelf().inSingletonScope();
    bind(ToolOutputServiceClient).toDynamicValue(context => {
        const client = context.container.get(ToolOutputServiceClientImpl);
        WebSocketConnectionProvider.createProxy(context.container, ToolOutputService.SERVICE_PATH, client);
        return client;
    }).inSingletonScope();

    // Serial monitor
    bind(MonitorModel).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(MonitorModel);
    bind(MonitorWidget).toSelf();
    bindViewContribution(bind, MonitorViewContribution);
    bind(TabBarToolbarContribution).toService(MonitorViewContribution);
    bind(WidgetFactory).toDynamicValue(context => ({
        id: MonitorWidget.ID,
        createWidget: () => context.container.get(MonitorWidget)
    }));
    // Frontend binding for the serial monitor service
    bind(MonitorService).toDynamicValue(context => {
        const connection = context.container.get(WebSocketConnectionProvider);
        const client = context.container.get(MonitorServiceClientImpl);
        return connection.createProxy(MonitorServicePath, client);
    }).inSingletonScope();
    bind(MonitorConnection).toSelf().inSingletonScope();
    // Serial monitor service client to receive and delegate notifications from the backend.
    bind(MonitorServiceClientImpl).toSelf().inSingletonScope();
    bind(MonitorServiceClient).toDynamicValue(context => {
        const client = context.container.get(MonitorServiceClientImpl);
        WebSocketConnectionProvider.createProxy(context.container, MonitorServicePath, client);
        return client;
    }).inSingletonScope();

    bind(WorkspaceService).toSelf().inSingletonScope();
    rebind(TheiaWorkspaceService).toService(WorkspaceService);

    // Customizing default Theia layout based on the editor mode: `pro-mode` or `classic`.
    bind(EditorMode).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(EditorMode);

    // Layout and shell customizations.
    rebind(TheiaOutlineViewContribution).to(OutlineViewContribution).inSingletonScope();
    rebind(TheiaProblemContribution).to(ProblemContribution).inSingletonScope();
    rebind(TheiaFileNavigatorContribution).to(FileNavigatorContribution).inSingletonScope();
    rebind(TheiaEditorContribution).to(EditorContribution).inSingletonScope();
    rebind(TheiaMonacoStatusBarContribution).to(MonacoStatusBarContribution).inSingletonScope();
    rebind(TheiaApplicationShell).to(ApplicationShell).inSingletonScope();
    rebind(TheiaScmContribution).to(ScmContribution).inSingletonScope();
    rebind(TheiaSearchInWorkspaceFrontendContribution).to(SearchInWorkspaceFrontendContribution).inSingletonScope();
    rebind(TheiaFrontendApplication).to(FrontendApplication).inSingletonScope();
    rebind(TheiaWorkspaceFrontendContribution).to(WorkspaceFrontendContribution).inSingletonScope();
    rebind(TheiaFileMenuContribution).to(ArduinoFileMenuContribution).inSingletonScope();
    rebind(TheiaCommonFrontendContribution).to(CommonFrontendContribution).inSingletonScope();
    rebind(TheiaPreferencesContribution).to(PreferencesContribution).inSingletonScope();
    rebind(TheiaKeybindingRegistry).to(KeybindingRegistry).inSingletonScope();
    rebind(TheiaWorkspaceCommandContribution).to(WorkspaceCommandContribution).inSingletonScope();
    rebind(TheiaWorkspaceDeleteHandler).to(WorkspaceDeleteHandler).inSingletonScope();
    rebind(TheiaEditorWidgetFactory).to(EditorWidgetFactory).inSingletonScope();
    rebind(TabBarToolbarFactory).toFactory(({ container: parentContainer }) => () => {
        const container = parentContainer.createChild();
        container.bind(TabBarToolbar).toSelf().inSingletonScope();
        return container.get(TabBarToolbar);
    });
    bind(OutputWidget).toSelf().inSingletonScope();
    rebind(TheiaOutputWidget).toService(OutputWidget);
    bind(OutputChannelManager).toSelf().inSingletonScope();
    rebind(TheiaOutputChannelManager).toService(OutputChannelManager);
    bind(OutputChannelRegistryMainImpl).toSelf().inTransientScope();
    rebind(TheiaOutputChannelRegistryMainImpl).toService(OutputChannelRegistryMainImpl);
    bind(MonacoTextModelService).toSelf().inSingletonScope();
    rebind(TheiaMonacoTextModelService).toService(MonacoTextModelService);

    // Show a disconnected status bar, when the daemon is not available
    bind(ApplicationConnectionStatusContribution).toSelf().inSingletonScope();
    rebind(TheiaApplicationConnectionStatusContribution).toService(ApplicationConnectionStatusContribution);
    bind(FrontendConnectionStatusService).toSelf().inSingletonScope();
    rebind(TheiaFrontendConnectionStatusService).toService(FrontendConnectionStatusService);

    // Editor customizations. Sets the editor to `readOnly` if under the data dir.
    bind(EditorManager).toSelf().inSingletonScope();
    rebind(TheiaEditorManager).toService(EditorManager);

    // Decorator customizations
    bind(TabBarDecoratorService).toSelf().inSingletonScope();
    rebind(TheiaTabBarDecoratorService).toService(TabBarDecoratorService);

    // Problem markers
    bind(ProblemManager).toSelf().inSingletonScope();
    rebind(TheiaProblemManager).toService(ProblemManager);

    // About dialog to show the CLI version
    bind(AboutDialog).toSelf().inSingletonScope();
    rebind(TheiaAboutDialog).toService(AboutDialog);

    // Customized layout restorer that can restore the state in async way: https://github.com/eclipse-theia/theia/issues/6579
    bind(ShellLayoutRestorer).toSelf().inSingletonScope();
    rebind(TheiaShellLayoutRestorer).toService(ShellLayoutRestorer);

    // Arduino daemon client. Receives notifications from the backend if the CLI daemon process has been restarted.
    bind(ArduinoDaemon).toDynamicValue(context => {
        const connection = context.container.get(WebSocketConnectionProvider);
        const client = context.container.get(ArduinoDaemonClientImpl);
        return connection.createProxy(ArduinoDaemonPath, client);
    }).inSingletonScope();
    bind(ArduinoDaemonClientImpl).toSelf().inSingletonScope();
    bind(ArduinoDaemonClient).toDynamicValue(context => {
        const client = context.container.get(ArduinoDaemonClientImpl);
        WebSocketConnectionProvider.createProxy(context.container, ArduinoDaemonPath, client);
        return client;
    }).inSingletonScope();

    // File-system extension
    bind(FileSystemExt).toDynamicValue(context => WebSocketConnectionProvider.createProxy(context.container, FileSystemExtPath)).inSingletonScope();

    // Examples service@
    bind(ExamplesService).toDynamicValue(context => WebSocketConnectionProvider.createProxy(context.container, ExamplesServicePath)).inSingletonScope();

    // Executable URIs known by the backend
    bind(ExecutableService).toDynamicValue(context => WebSocketConnectionProvider.createProxy(context.container, ExecutableServicePath)).inSingletonScope();

    Contribution.configure(bind, NewSketch);
    Contribution.configure(bind, OpenSketch);
    Contribution.configure(bind, CloseSketch);
    Contribution.configure(bind, SaveSketch);
    Contribution.configure(bind, SaveAsSketch);
    Contribution.configure(bind, VerifySketch);
    Contribution.configure(bind, UploadSketch);
    Contribution.configure(bind, OpenSketchExternal);
    Contribution.configure(bind, EditContributions);
    Contribution.configure(bind, QuitApp);
    Contribution.configure(bind, SketchControl);
    Contribution.configure(bind, Settings);
    Contribution.configure(bind, BurnBootloader);
    Contribution.configure(bind, BuiltInExamples);
    Contribution.configure(bind, LibraryExamples);
    Contribution.configure(bind, IncludeLibrary);
});
