import '../../src/browser/style/index.css';
import { ContainerModule, interfaces } from 'inversify';
import { WidgetFactory } from '@theia/core/lib/browser/widget-manager';
import { CommandContribution } from '@theia/core/lib/common/command';
import { bindViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import { TabBarToolbarContribution } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { WebSocketConnectionProvider } from '@theia/core/lib/browser/messaging/ws-connection-provider';
import { FrontendApplicationContribution, FrontendApplication } from '@theia/core/lib/browser/frontend-application'
import { LanguageGrammarDefinitionContribution } from '@theia/monaco/lib/browser/textmate';
import { LibraryListWidget } from './library/library-list-widget';
import { ArduinoFrontendContribution, ARDUINO_PRO_MODE } from './arduino-frontend-contribution';
import { ArduinoLanguageGrammarContribution } from './language/arduino-language-grammar-contribution';
import { LibraryService, LibraryServicePath } from '../common/protocol/library-service';
import { BoardsService, BoardsServicePath, BoardsServiceClient } from '../common/protocol/boards-service';
import { SketchesService, SketchesServicePath } from '../common/protocol/sketches-service';
import { LibraryListWidgetFrontendContribution } from './library/list-widget-frontend-contribution';
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
import { AWorkspaceService } from './arduino-workspace-service';
import { ThemeService } from '@theia/core/lib/browser/theming';
import { ArduinoTheme } from './arduino-theme';
import { ArduinoToolbarMenuContribution } from './arduino-file-menu';
import { MenuContribution } from '@theia/core';
import { SketchFactory } from './sketch-factory';
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
import { CustomEditorContribution } from './customization/custom-editor-contribution';
import { MonacoStatusBarContribution } from '@theia/monaco/lib/browser/monaco-status-bar-contribution';
import { SilentMonacoStatusBarContribution } from './customization/silent-monaco-status-bar-contribution';
import { ApplicationShell } from '@theia/core/lib/browser';
import { CustomApplicationShell } from './customization/custom-application-shell';
import { CustomFrontendApplication } from './customization/custom-frontend-application';
import { BoardsConfigDialog, BoardsConfigDialogProps } from './boards/boards-config-dialog';
import { BoardsConfigDialogWidget } from './boards/boards-config-dialog-widget';
import { ScmContribution } from '@theia/scm/lib/browser/scm-contribution';
import { SilentScmContribution } from './customization/silent-scm-contribution';
import { SearchInWorkspaceFrontendContribution } from '@theia/search-in-workspace/lib/browser/search-in-workspace-frontend-contribution';
import { SilentSearchInWorkspaceContribution } from './customization/silent-search-in-workspace-contribution';
const ElementQueries = require('css-element-queries/src/ElementQueries');

if (!ARDUINO_PRO_MODE) {
    require('../../src/browser/style/silent-bottom-panel-tabs.css');
}

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

    // `ino` TextMate grammar
    bind(LanguageGrammarDefinitionContribution).to(ArduinoLanguageGrammarContribution).inSingletonScope();

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

    bind(AWorkspaceService).toSelf().inSingletonScope();
    rebind(WorkspaceService).to(AWorkspaceService).inSingletonScope();
    bind(SketchFactory).toSelf().inSingletonScope();

    const themeService = ThemeService.get();
    themeService.register(...ArduinoTheme.themes);

    // customizing default theia
    if (!ARDUINO_PRO_MODE) {
        unbind(OutlineViewContribution);
        bind(OutlineViewContribution).to(SilentOutlineViewContribution).inSingletonScope();
        unbind(ProblemContribution);
        bind(ProblemContribution).to(SilentProblemContribution).inSingletonScope();
        unbind(FileNavigatorContribution);
        bind(FileNavigatorContribution).to(SilentNavigatorContribution).inSingletonScope();
        unbind(OutputToolbarContribution);
        bind(OutputToolbarContribution).to(ArduinoOutputToolContribution).inSingletonScope();
        unbind(EditorContribution);
        bind(EditorContribution).to(CustomEditorContribution).inSingletonScope();
        unbind(MonacoStatusBarContribution);
        bind(MonacoStatusBarContribution).to(SilentMonacoStatusBarContribution).inSingletonScope();
        unbind(ApplicationShell);
        bind(ApplicationShell).to(CustomApplicationShell).inSingletonScope();
        unbind(ScmContribution);
        bind(ScmContribution).to(SilentScmContribution).inSingletonScope();
        unbind(SearchInWorkspaceFrontendContribution);
        bind(SearchInWorkspaceFrontendContribution).to(SilentSearchInWorkspaceContribution).inSingletonScope();
    }
    unbind(FrontendApplication);
    bind(FrontendApplication).to(CustomFrontendApplication).inSingletonScope();
});
