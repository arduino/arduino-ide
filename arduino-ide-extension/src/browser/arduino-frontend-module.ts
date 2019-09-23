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
import { ArduinoFrontendContribution, ArduinoAdvancedMode } from './arduino-frontend-contribution';
import { ArduinoLanguageGrammarContribution } from './language/arduino-language-grammar-contribution';
import { LibraryService, LibraryServicePath } from '../common/protocol/library-service';
import { BoardsService, BoardsServicePath, BoardsServiceClient } from '../common/protocol/boards-service';
import { SketchesService, SketchesServicePath } from '../common/protocol/sketches-service';
import { CoreService, CoreServicePath } from '../common/protocol/core-service';
import { BoardsListWidget } from './boards/boards-list-widget';
import { BoardsListWidgetFrontendContribution } from './boards/boards-widget-frontend-contribution';
import { WorkspaceServiceExt, WorkspaceServiceExtPath } from './workspace-service-ext';
import { WorkspaceServiceExtImpl } from './workspace-service-ext-impl';
import { ToolOutputServiceClient } from '../common/protocol/tool-output-service';
import { ToolOutputService } from '../common/protocol/tool-output-service';
import { ToolOutputServiceClientImpl } from './tool-output/client-service-impl';
import { BoardsServiceClientImpl } from './boards/boards-service-client-impl';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import { ArduinoWorkspaceService } from './arduino-workspace-service';
import { ThemeService } from '@theia/core/lib/browser/theming';
import { ArduinoTheme } from './arduino-theme';
import { ArduinoToolbarMenuContribution } from './arduino-file-menu';
import { MenuContribution } from '@theia/core';
import { OutlineViewContribution } from '@theia/outline-view/lib/browser/outline-view-contribution';
import { SilentOutlineViewContribution } from './customization/silent-outline-contribution';
import { ProblemContribution } from '@theia/markers/lib/browser/problem/problem-contribution';
import { SilentProblemContribution } from './customization/silent-problem-contribution';
import { SilentNavigatorContribution } from './customization/silent-navigator-contribution';
import { FileNavigatorContribution } from '@theia/navigator/lib/browser/navigator-contribution';
import { ArduinoToolbarContribution } from './toolbar/arduino-toolbar-contribution';
import { OutputToolbarContribution } from '@theia/output/lib/browser/output-toolbar-contribution';
import { ArduinoOutputToolContribution } from './customization/silent-output-tool-contribution';
import { EditorContribution } from '@theia/editor/lib/browser/editor-contribution';
import { ArduinoEditorContribution } from './customization/arduino-editor-contribution';
import { MonacoStatusBarContribution } from '@theia/monaco/lib/browser/monaco-status-bar-contribution';
import { ArduinoMonacoStatusBarContribution } from './customization/arduino-monaco-status-bar-contribution';
import { ApplicationShell } from '@theia/core/lib/browser';
import { ArduinoApplicationShell } from './customization/arduino-application-shell';
import { ArduinoFrontendApplication } from './customization/arduino-frontend-application';
import { BoardsConfigDialog, BoardsConfigDialogProps } from './boards/boards-config-dialog';
import { BoardsConfigDialogWidget } from './boards/boards-config-dialog-widget';
import { ScmContribution } from '@theia/scm/lib/browser/scm-contribution';
import { SilentScmContribution } from './customization/silent-scm-contribution';
import { SearchInWorkspaceFrontendContribution } from '@theia/search-in-workspace/lib/browser/search-in-workspace-frontend-contribution';
import { SilentSearchInWorkspaceContribution } from './customization/silent-search-in-workspace-contribution';
import { LibraryListWidgetFrontendContribution } from './library/library-widget-frontend-contribution';
import { LibraryItemRenderer } from './library/library-item-renderer';
import { BoardItemRenderer } from './boards/boards-item-renderer';
import { MonitorServiceClientImpl } from './monitor/monitor-service-client-impl';
import { MonitorServicePath, MonitorService, MonitorServiceClient } from '../common/protocol/monitor-service';
import { ConfigService, ConfigServicePath } from '../common/protocol/config-service';
import { MonitorWidget } from './monitor/monitor-widget';
import { MonitorViewContribution } from './monitor/monitor-view-contribution';
import { MonitorConnection } from './monitor/monitor-connection';
import { MonitorModel } from './monitor/monitor-model';
import { MonacoEditorProvider } from '@theia/monaco/lib/browser/monaco-editor-provider';
import { ArduinoMonacoEditorProvider } from './editor/arduino-monaco-editor-provider';
import { TabBarDecoratorService } from '@theia/core/lib/browser/shell/tab-bar-decorator';
import { ArduinoTabBarDecoratorService } from './shell/arduino-tab-bar-decorator';
import { ProblemManager } from '@theia/markers/lib/browser';
import { ArduinoProblemManager } from './markers/arduino-problem-manager';
const ElementQueries = require('css-element-queries/src/ElementQueries');

export default new ContainerModule((bind: interfaces.Bind, unbind: interfaces.Unbind, isBound: interfaces.IsBound, rebind: interfaces.Rebind) => {
    ElementQueries.listen();
    ElementQueries.init();

    // Commands and toolbar items
    bind(ArduinoFrontendContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(ArduinoFrontendContribution);
    bind(MenuContribution).toService(ArduinoFrontendContribution);
    bind(TabBarToolbarContribution).toService(ArduinoFrontendContribution);
    bind(FrontendApplicationContribution).toService(ArduinoFrontendContribution);
    bind(MenuContribution).to(ArduinoToolbarMenuContribution).inSingletonScope();

    bind(ArduinoToolbarContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(ArduinoToolbarContribution);

    // `ino` TextMate grammar and language client
    bind(LanguageGrammarDefinitionContribution).to(ArduinoLanguageGrammarContribution).inSingletonScope();
    bind(LanguageClientContribution).to(ArduinoLanguageClientContribution).inSingletonScope();

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
    bind(LibraryItemRenderer).toSelf().inSingletonScope();

    // Sketch list service
    bind(SketchesService).toDynamicValue(context => WebSocketConnectionProvider.createProxy(context.container, SketchesServicePath)).inSingletonScope();

    // Config service
    bind(ConfigService).toDynamicValue(context => WebSocketConnectionProvider.createProxy(context.container, ConfigServicePath)).inSingletonScope();

    // Boards service
    bind(BoardsService).toDynamicValue(context => {
        const connection = context.container.get(WebSocketConnectionProvider);
        const client = context.container.get(BoardsServiceClientImpl);
        return connection.createProxy(BoardsServicePath, client);
    }).inSingletonScope();
    // Boards service client to receive and delegate notifications from the backend.
    bind(BoardsServiceClientImpl).toSelf().inSingletonScope();
    bind(BoardsServiceClient).toDynamicValue(context => {
        const client = context.container.get(BoardsServiceClientImpl);
        WebSocketConnectionProvider.createProxy(context.container, BoardsServicePath, client);
        return client;
    }).inSingletonScope();

    // Boards list widget
    bind(BoardsListWidget).toSelf();
    bindViewContribution(bind, BoardsListWidgetFrontendContribution);
    bind(WidgetFactory).toDynamicValue(context => ({
        id: BoardsListWidget.WIDGET_ID,
        createWidget: () => context.container.get(BoardsListWidget)
    }));
    bind(FrontendApplicationContribution).toService(BoardsListWidgetFrontendContribution);
    bind(BoardItemRenderer).toSelf().inSingletonScope();

    // Board select dialog
    bind(BoardsConfigDialogWidget).toSelf().inSingletonScope();
    bind(BoardsConfigDialog).toSelf().inSingletonScope();
    bind(BoardsConfigDialogProps).toConstantValue({
        title: 'Select Board'
    })

    // Core service
    bind(CoreService)
        .toDynamicValue(context => WebSocketConnectionProvider.createProxy(context.container, CoreServicePath))
        .inSingletonScope();

    // Tool output service client
    bind(ToolOutputServiceClientImpl).toSelf().inSingletonScope();
    bind(ToolOutputServiceClient).toDynamicValue(context => {
        const client = context.container.get(ToolOutputServiceClientImpl);
        WebSocketConnectionProvider.createProxy(context.container, ToolOutputService.SERVICE_PATH, client);
        return client;
    }).inSingletonScope();

    // The workspace service extension
    bind(WorkspaceServiceExt).to(WorkspaceServiceExtImpl).inSingletonScope().onActivation(({ container }, workspaceServiceExt) => {
        WebSocketConnectionProvider.createProxy(container, WorkspaceServiceExtPath, workspaceServiceExt);
        // Eagerly active the core, library, and boards services.
        container.get(CoreService);
        container.get(LibraryService);
        container.get(BoardsService);
        container.get(SketchesService);
        return workspaceServiceExt;
    });

    // Serial Monitor
    bind(MonitorModel).toSelf().inSingletonScope();
    bind(MonitorWidget).toSelf();
    bindViewContribution(bind, MonitorViewContribution);
    bind(TabBarToolbarContribution).toService(MonitorViewContribution);
    bind(WidgetFactory).toDynamicValue(context => ({
        id: MonitorWidget.ID,
        createWidget: () => context.container.get(MonitorWidget)
    }));
    // Frontend binding for the monitor service.
    bind(MonitorService).toDynamicValue(context => {
        const connection = context.container.get(WebSocketConnectionProvider);
        const client = context.container.get(MonitorServiceClientImpl);
        return connection.createProxy(MonitorServicePath, client);
    }).inSingletonScope();
    // MonitorConnection
    bind(MonitorConnection).toSelf().inSingletonScope();
    // Monitor service client to receive and delegate notifications from the backend.
    bind(MonitorServiceClientImpl).toSelf().inSingletonScope();
    bind(MonitorServiceClient).toDynamicValue(context => {
        const client = context.container.get(MonitorServiceClientImpl);
        WebSocketConnectionProvider.createProxy(context.container, MonitorServicePath, client);
        return client;
    }).inSingletonScope();

    bind(ArduinoWorkspaceService).toSelf().inSingletonScope();
    rebind(WorkspaceService).to(ArduinoWorkspaceService).inSingletonScope();

    const themeService = ThemeService.get();
    themeService.register(...ArduinoTheme.themes);

    // customizing default theia
    if (!ArduinoAdvancedMode.TOGGLED) {
        unbind(OutlineViewContribution);
        bind(OutlineViewContribution).to(SilentOutlineViewContribution).inSingletonScope();
        unbind(ProblemContribution);
        bind(ProblemContribution).to(SilentProblemContribution).inSingletonScope();
        unbind(FileNavigatorContribution);
        bind(FileNavigatorContribution).to(SilentNavigatorContribution).inSingletonScope();
        unbind(OutputToolbarContribution);
        bind(OutputToolbarContribution).to(ArduinoOutputToolContribution).inSingletonScope();
        unbind(EditorContribution);
        bind(EditorContribution).to(ArduinoEditorContribution).inSingletonScope();
        unbind(MonacoStatusBarContribution);
        bind(MonacoStatusBarContribution).to(ArduinoMonacoStatusBarContribution).inSingletonScope();
        unbind(ApplicationShell);
        bind(ApplicationShell).to(ArduinoApplicationShell).inSingletonScope();
        unbind(ScmContribution);
        bind(ScmContribution).to(SilentScmContribution).inSingletonScope();
        unbind(SearchInWorkspaceFrontendContribution);
        bind(SearchInWorkspaceFrontendContribution).to(SilentSearchInWorkspaceContribution).inSingletonScope();
    } else {
        // We use this CSS class on the body to modify the visibbility of the close button for the editors and views.
        document.body.classList.add(ArduinoAdvancedMode.LS_ID);
    }
    unbind(FrontendApplication);
    bind(FrontendApplication).to(ArduinoFrontendApplication).inSingletonScope();

    // monaco customizations
    unbind(MonacoEditorProvider);
    bind(ArduinoMonacoEditorProvider).toSelf().inSingletonScope();
    bind(MonacoEditorProvider).toService(ArduinoMonacoEditorProvider);

    // decorator customizations
    unbind(TabBarDecoratorService);
    bind(ArduinoTabBarDecoratorService).toSelf().inSingletonScope();
    bind(TabBarDecoratorService).toService(ArduinoTabBarDecoratorService);

    // problem markers
    unbind(ProblemManager);
    bind(ArduinoProblemManager).toSelf().inSingletonScope();
    bind(ProblemManager).toService(ArduinoProblemManager);
});
