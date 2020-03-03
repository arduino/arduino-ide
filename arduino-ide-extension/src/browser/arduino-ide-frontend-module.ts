import '../../src/browser/style/index.css';
import { ContainerModule, interfaces } from 'inversify';
import { WidgetFactory } from '@theia/core/lib/browser/widget-manager';
import { CommandContribution } from '@theia/core/lib/common/command';
import { bindViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import { TabBarToolbarContribution } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { WebSocketConnectionProvider } from '@theia/core/lib/browser/messaging/ws-connection-provider';
import { FrontendApplicationContribution, FrontendApplication } from '@theia/core/lib/browser/frontend-application'
import { LanguageGrammarDefinitionContribution } from '@theia/monaco/lib/browser/textmate';
import { LanguageClientContribution } from '@theia/languages/lib/browser';
import { ArduinoLanguageClientContribution } from './language/arduino-language-client-contribution';
import { LibraryListWidget } from './library/library-list-widget';
import { ArduinoFrontendContribution } from './arduino-frontend-contribution';
import { ArduinoLanguageGrammarContribution } from './language/arduino-language-grammar-contribution';
import { LibraryService, LibraryServicePath } from '../common/protocol/library-service';
import { BoardsService, BoardsServicePath, BoardsServiceClient } from '../common/protocol/boards-service';
import { SketchesService, SketchesServicePath } from '../common/protocol/sketches-service';
import { CoreService, CoreServicePath, CoreServiceClient } from '../common/protocol/core-service';
import { BoardsListWidget } from './boards/boards-list-widget';
import { BoardsListWidgetFrontendContribution } from './boards/boards-widget-frontend-contribution';
import { ToolOutputServiceClient } from '../common/protocol/tool-output-service';
import { ToolOutputService } from '../common/protocol/tool-output-service';
import { ToolOutputServiceClientImpl } from './tool-output/client-service-impl';
import { BoardsServiceClientImpl } from './boards/boards-service-client-impl';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import { ArduinoWorkspaceService } from './arduino-workspace-service';
import { OutlineViewContribution } from '@theia/outline-view/lib/browser/outline-view-contribution';
import { ArduinoOutlineViewContribution } from './customization/arduino-outline-contribution';
import { ProblemContribution } from '@theia/markers/lib/browser/problem/problem-contribution';
import { ArduinoProblemContribution } from './customization/arduino-problem-contribution';
import { ArduinoNavigatorContribution } from './customization/arduino-navigator-contribution';
import { FileNavigatorContribution } from '@theia/navigator/lib/browser/navigator-contribution';
import { ArduinoToolbarContribution } from './toolbar/arduino-toolbar-contribution';
import { OutputToolbarContribution } from '@theia/output/lib/browser/output-toolbar-contribution';
import { ArduinoOutputToolContribution } from './customization/arduino-output-tool-contribution';
import { EditorContribution } from '@theia/editor/lib/browser/editor-contribution';
import { ArduinoEditorContribution } from './customization/arduino-editor-contribution';
import { MonacoStatusBarContribution } from '@theia/monaco/lib/browser/monaco-status-bar-contribution';
import { ArduinoMonacoStatusBarContribution } from './customization/arduino-monaco-status-bar-contribution';
import { ApplicationShell, ShellLayoutRestorer, KeybindingContribution } from '@theia/core/lib/browser';
import { MenuContribution } from '@theia/core/lib/common/menu';
import { ArduinoApplicationShell } from './customization/arduino-application-shell';
import { ArduinoFrontendApplication } from './customization/arduino-frontend-application';
import { BoardsConfigDialog, BoardsConfigDialogProps } from './boards/boards-config-dialog';
import { BoardsConfigDialogWidget } from './boards/boards-config-dialog-widget';
import { ScmContribution } from '@theia/scm/lib/browser/scm-contribution';
import { ArduinoScmContribution } from './customization/arduino-scm-contribution';
import { SearchInWorkspaceFrontendContribution } from '@theia/search-in-workspace/lib/browser/search-in-workspace-frontend-contribution';
import { ArduinoSearchInWorkspaceContribution } from './customization/arduino-search-in-workspace-contribution';
import { LibraryListWidgetFrontendContribution } from './library/library-widget-frontend-contribution';
import { MonitorServiceClientImpl } from './monitor/monitor-service-client-impl';
import { MonitorServicePath, MonitorService, MonitorServiceClient } from '../common/protocol/monitor-service';
import { ConfigService, ConfigServicePath, ConfigServiceClient } from '../common/protocol/config-service';
import { MonitorWidget } from './monitor/monitor-widget';
import { MonitorViewContribution } from './monitor/monitor-view-contribution';
import { MonitorConnection } from './monitor/monitor-connection';
import { MonitorModel } from './monitor/monitor-model';
import { TabBarDecoratorService } from '@theia/core/lib/browser/shell/tab-bar-decorator';
import { ArduinoTabBarDecoratorService } from './shell/arduino-tab-bar-decorator';
import { ProblemManager } from '@theia/markers/lib/browser';
import { ArduinoProblemManager } from './markers/arduino-problem-manager';
import { BoardsAutoInstaller } from './boards/boards-auto-installer';
import { AboutDialog } from '@theia/core/lib/browser/about-dialog';
import { ArduinoAboutDialog } from './customization/arduino-about-dialog';
import { ArduinoShellLayoutRestorer } from './shell/arduino-shell-layout-restorer';
import { EditorMode } from './editor-mode';
import { ListItemRenderer } from './components/component-list/list-item-renderer';
import { ColorContribution } from '@theia/core/lib/browser/color-application-contribution';
import { MonacoThemingService } from '@theia/monaco/lib/browser/monaco-theming-service';
import { ArduinoDaemonClientImpl } from './arduino-daemon-client-impl';
import { ArduinoDaemonClient, ArduinoDaemonPath, ArduinoDaemon } from '../common/protocol/arduino-daemon';
import { EditorManager } from '@theia/editor/lib/browser';
import { ArduinoEditorManager } from './editor/arduino-editor-manager';
import { ArduinoFrontendConnectionStatusService, ArduinoApplicationConnectionStatusContribution } from './customization/arduino-connection-status-service';
import { FrontendConnectionStatusService, ApplicationConnectionStatusContribution } from '@theia/core/lib/browser/connection-status-service';
import { ConfigServiceClientImpl } from './config-service-client-impl';
import { CoreServiceClientImpl } from './core-service-client-impl';
import { BoardsDetailsMenuUpdater } from './boards/boards-details-menu-updater';
import { BoardsConfigStore } from './boards/boards-config-store';
import { ILogger } from '@theia/core';

const ElementQueries = require('css-element-queries/src/ElementQueries');

MonacoThemingService.register({
    id: 'arduinoTheme',
    label: 'Light (Arduino)',
    uiTheme: 'vs',
    json: require('../../src/browser/data/arduino.color-theme.json')
});

export default new ContainerModule((bind: interfaces.Bind, unbind: interfaces.Unbind, isBound: interfaces.IsBound, rebind: interfaces.Rebind) => {
    ElementQueries.listen();
    ElementQueries.init();

    // Commands and toolbar items
    bind(ArduinoFrontendContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(ArduinoFrontendContribution);
    bind(MenuContribution).toService(ArduinoFrontendContribution);
    bind(TabBarToolbarContribution).toService(ArduinoFrontendContribution);
    bind(KeybindingContribution).toService(ArduinoFrontendContribution);
    bind(FrontendApplicationContribution).toService(ArduinoFrontendContribution);
    bind(ColorContribution).toService(ArduinoFrontendContribution);

    bind(ArduinoToolbarContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(ArduinoToolbarContribution);

    // `ino` TextMate grammar and language client
    bind(LanguageGrammarDefinitionContribution).to(ArduinoLanguageGrammarContribution).inSingletonScope();
    bind(LanguageClientContribution).to(ArduinoLanguageClientContribution).inSingletonScope();

    // Renderer for both the library and the core widgets.
    bind(ListItemRenderer).toSelf().inSingletonScope();

    // Library service
    bind(LibraryService).toDynamicValue(context => WebSocketConnectionProvider.createProxy(context.container, LibraryServicePath)).inSingletonScope();
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
        const [attachedBoards, availablePorts] = await Promise.all([
            service.getAttachedBoards(),
            service.getAvailablePorts()
        ]);
        client.init({ attachedBoards, availablePorts });
        WebSocketConnectionProvider.createProxy(context.container, BoardsServicePath, client);
        return client;
    }).inSingletonScope();

    // To be able to track, and update the menu based on the core settings (aka. board details) of the currently selected board.
    bind(FrontendApplicationContribution).to(BoardsDetailsMenuUpdater).inSingletonScope();
    bind(BoardsConfigStore).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(BoardsConfigStore);
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

    bind(ArduinoWorkspaceService).toSelf().inSingletonScope();
    rebind(WorkspaceService).toService(ArduinoWorkspaceService);

    // Customizing default Theia layout based on the editor mode: `pro-mode` or `classic`.
    bind(EditorMode).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(EditorMode);

    // Layout and shell customizations.
    rebind(OutlineViewContribution).to(ArduinoOutlineViewContribution).inSingletonScope();
    rebind(ProblemContribution).to(ArduinoProblemContribution).inSingletonScope();
    rebind(FileNavigatorContribution).to(ArduinoNavigatorContribution).inSingletonScope();
    rebind(OutputToolbarContribution).to(ArduinoOutputToolContribution).inSingletonScope();
    rebind(EditorContribution).to(ArduinoEditorContribution).inSingletonScope();
    rebind(MonacoStatusBarContribution).to(ArduinoMonacoStatusBarContribution).inSingletonScope();
    rebind(ApplicationShell).to(ArduinoApplicationShell).inSingletonScope();
    rebind(ScmContribution).to(ArduinoScmContribution).inSingletonScope();
    rebind(SearchInWorkspaceFrontendContribution).to(ArduinoSearchInWorkspaceContribution).inSingletonScope();
    rebind(FrontendApplication).to(ArduinoFrontendApplication).inSingletonScope();

    // Show a disconnected status bar, when the daemon is not available
    bind(ArduinoApplicationConnectionStatusContribution).toSelf().inSingletonScope();
    rebind(ApplicationConnectionStatusContribution).toService(ArduinoApplicationConnectionStatusContribution);
    bind(ArduinoFrontendConnectionStatusService).toSelf().inSingletonScope();
    rebind(FrontendConnectionStatusService).toService(ArduinoFrontendConnectionStatusService);

    // Editor customizations. Sets the editor to `readOnly` if under the data dir.
    bind(ArduinoEditorManager).toSelf().inSingletonScope();
    rebind(EditorManager).toService(ArduinoEditorManager);

    // Decorator customizations
    bind(ArduinoTabBarDecoratorService).toSelf().inSingletonScope();
    rebind(TabBarDecoratorService).toService(ArduinoTabBarDecoratorService);

    // Problem markers
    bind(ArduinoProblemManager).toSelf().inSingletonScope();
    rebind(ProblemManager).toService(ArduinoProblemManager);

    // About dialog to show the CLI version
    bind(ArduinoAboutDialog).toSelf().inSingletonScope();
    rebind(AboutDialog).toService(ArduinoAboutDialog);

    // Customized layout restorer that can restore the state in async way: https://github.com/eclipse-theia/theia/issues/6579
    bind(ArduinoShellLayoutRestorer).toSelf().inSingletonScope();
    rebind(ShellLayoutRestorer).toService(ArduinoShellLayoutRestorer);

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
});
