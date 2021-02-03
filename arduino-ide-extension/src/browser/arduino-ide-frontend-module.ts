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
import { LibraryService, LibraryServicePath } from '../common/protocol/library-service';
import { BoardsService, BoardsServicePath } from '../common/protocol/boards-service';
import { SketchesService, SketchesServicePath } from '../common/protocol/sketches-service';
import { SketchesServiceClientImpl } from '../common/protocol/sketches-service-client-impl';
import { CoreService, CoreServicePath } from '../common/protocol/core-service';
import { BoardsListWidget } from './boards/boards-list-widget';
import { BoardsListWidgetFrontendContribution } from './boards/boards-widget-frontend-contribution';
import { BoardsServiceProvider } from './boards/boards-service-provider';
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
    KeybindingRegistry as TheiaKeybindingRegistry,
    TabBarRendererFactory,
    ContextMenuRenderer
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
import { ConfigService, ConfigServicePath } from '../common/protocol/config-service';
import { MonitorWidget } from './monitor/monitor-widget';
import { MonitorViewContribution } from './monitor/monitor-view-contribution';
import { MonitorConnection } from './monitor/monitor-connection';
import { MonitorModel } from './monitor/monitor-model';
import { TabBarDecoratorService as TheiaTabBarDecoratorService } from '@theia/core/lib/browser/shell/tab-bar-decorator';
import { TabBarDecoratorService } from './theia/core/tab-bar-decorator';
import { ProblemManager as TheiaProblemManager } from '@theia/markers/lib/browser';
import { ProblemManager } from './theia/markers/problem-manager';
import { BoardsAutoInstaller } from './boards/boards-auto-installer';
import { ShellLayoutRestorer } from './theia/core/shell-layout-restorer';
import { EditorMode } from './editor-mode';
import { ListItemRenderer } from './widgets/component-list/list-item-renderer';
import { ColorContribution } from '@theia/core/lib/browser/color-application-contribution';
import { MonacoThemingService } from '@theia/monaco/lib/browser/monaco-theming-service';
import { ArduinoDaemonPath, ArduinoDaemon } from '../common/protocol/arduino-daemon';
import { EditorManager as TheiaEditorManager, EditorCommandContribution as TheiaEditorCommandContribution } from '@theia/editor/lib/browser';
import { EditorManager } from './theia/editor/editor-manager';
import { FrontendConnectionStatusService, ApplicationConnectionStatusContribution } from './theia/core/connection-status-service';
import {
    FrontendConnectionStatusService as TheiaFrontendConnectionStatusService,
    ApplicationConnectionStatusContribution as TheiaApplicationConnectionStatusContribution
} from '@theia/core/lib/browser/connection-status-service';
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
import { Close } from './contributions/close';
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
import { IncludeLibrary } from './contributions/include-library';
import { OutputChannelManager as TheiaOutputChannelManager } from '@theia/output/lib/common/output-channel';
import { OutputChannelManager } from './theia/output/output-channel';
import { OutputChannelRegistryMainImpl as TheiaOutputChannelRegistryMainImpl, OutputChannelRegistryMainImpl } from './theia/plugin-ext/output-channel-registry-main';
import { ExecutableService, ExecutableServicePath } from '../common/protocol';
import { MonacoTextModelService as TheiaMonacoTextModelService } from '@theia/monaco/lib/browser/monaco-text-model-service';
import { MonacoTextModelService } from './theia/monaco/monaco-text-model-service';
import { OutputServiceImpl } from './output-service-impl';
import { OutputServicePath, OutputService } from '../common/protocol/output-service';
import { NotificationCenter } from './notification-center';
import { NotificationServicePath, NotificationServiceServer } from '../common/protocol';
import { About } from './contributions/about';
import { IconThemeService } from '@theia/core/lib/browser/icon-theme-service';
import { TabBarRenderer } from './theia/core/tab-bars';
import { EditorCommandContribution } from './theia/editor/editor-command';
import { NavigatorTabBarDecorator as TheiaNavigatorTabBarDecorator } from '@theia/navigator/lib/browser/navigator-tab-bar-decorator';
import { NavigatorTabBarDecorator } from './theia/navigator/navigator-tab-bar-decorator';
import { Debug } from './contributions/debug';
import { DebugSessionManager } from './theia/debug/debug-session-manager';
import { DebugSessionManager as TheiaDebugSessionManager } from '@theia/debug/lib/browser/debug-session-manager';
import { Sketchbook } from './contributions/sketchbook';
import { DebugFrontendApplicationContribution } from './theia/debug/debug-frontend-application-contribution';
import { DebugFrontendApplicationContribution as TheiaDebugFrontendApplicationContribution } from '@theia/debug/lib/browser/debug-frontend-application-contribution';
import { BoardSelection } from './contributions/board-selection';
import { OpenRecentSketch } from './contributions/open-recent-sketch';
import { Help } from './contributions/help';
import { bindArduinoPreferences } from './arduino-preferences'
import { SettingsService, SettingsDialog, SettingsWidget, SettingsDialogProps } from './settings';
import { AddFile } from './contributions/add-file';
import { ArchiveSketch } from './contributions/archive-sketch';

const ElementQueries = require('css-element-queries/src/ElementQueries');

MonacoThemingService.register({
    id: 'arduino-theme',
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
    bind(SketchesServiceClientImpl).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(SketchesServiceClientImpl);

    // Config service
    bind(ConfigService).toDynamicValue(context => WebSocketConnectionProvider.createProxy(context.container, ConfigServicePath)).inSingletonScope();

    // Boards service
    bind(BoardsService).toDynamicValue(context => WebSocketConnectionProvider.createProxy(context.container, BoardsServicePath)).inSingletonScope();
    // Boards service client to receive and delegate notifications from the backend.
    bind(BoardsServiceProvider).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(BoardsServiceProvider);

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
    bind(CoreService).toDynamicValue(context => WebSocketConnectionProvider.createProxy(context.container, CoreServicePath)).inSingletonScope();

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

    // Customized layout restorer that can restore the state in async way: https://github.com/eclipse-theia/theia/issues/6579
    bind(ShellLayoutRestorer).toSelf().inSingletonScope();
    rebind(TheiaShellLayoutRestorer).toService(ShellLayoutRestorer);

    bind(ArduinoDaemon).toDynamicValue(context => WebSocketConnectionProvider.createProxy(context.container, ArduinoDaemonPath)).inSingletonScope();

    // File-system extension
    bind(FileSystemExt).toDynamicValue(context => WebSocketConnectionProvider.createProxy(context.container, FileSystemExtPath)).inSingletonScope();

    // Examples service@
    bind(ExamplesService).toDynamicValue(context => WebSocketConnectionProvider.createProxy(context.container, ExamplesServicePath)).inSingletonScope();

    // Executable URIs known by the backend
    bind(ExecutableService).toDynamicValue(context => WebSocketConnectionProvider.createProxy(context.container, ExecutableServicePath)).inSingletonScope();

    Contribution.configure(bind, NewSketch);
    Contribution.configure(bind, OpenSketch);
    Contribution.configure(bind, Close);
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
    Contribution.configure(bind, About);
    Contribution.configure(bind, Debug);
    Contribution.configure(bind, Sketchbook);
    Contribution.configure(bind, BoardSelection);
    Contribution.configure(bind, OpenRecentSketch);
    Contribution.configure(bind, Help);
    Contribution.configure(bind, AddFile);
    Contribution.configure(bind, ArchiveSketch);

    bind(OutputServiceImpl).toSelf().inSingletonScope().onActivation(({ container }, outputService) => {
        WebSocketConnectionProvider.createProxy(container, OutputServicePath, outputService);
        return outputService;
    });
    bind(OutputService).toService(OutputServiceImpl);

    bind(NotificationCenter).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(NotificationCenter);
    bind(NotificationServiceServer).toDynamicValue(context => WebSocketConnectionProvider.createProxy(context.container, NotificationServicePath)).inSingletonScope();

    // Enable the dirty indicator on uncloseable widgets.
    rebind(TabBarRendererFactory).toFactory(context => () => {
        const contextMenuRenderer = context.container.get<ContextMenuRenderer>(ContextMenuRenderer);
        const decoratorService = context.container.get<TabBarDecoratorService>(TabBarDecoratorService);
        const iconThemeService = context.container.get<IconThemeService>(IconThemeService);
        return new TabBarRenderer(contextMenuRenderer, decoratorService, iconThemeService);
    });

    // Workaround for https://github.com/eclipse-theia/theia/issues/8722
    // Do not trigger a save on IDE startup if `"editor.autoSave": "on"` was set as a preference.
    bind(EditorCommandContribution).toSelf().inSingletonScope();
    rebind(TheiaEditorCommandContribution).toService(EditorCommandContribution);

    // Silent the badge decoration in the Explorer view.
    bind(NavigatorTabBarDecorator).toSelf().inSingletonScope();
    rebind(TheiaNavigatorTabBarDecorator).toService(NavigatorTabBarDecorator);

    // To avoid running `Save All` when there are no dirty editors before starting the debug session.
    bind(DebugSessionManager).toSelf().inSingletonScope();
    rebind(TheiaDebugSessionManager).toService(DebugSessionManager);
    // To remove the `Run` menu item from the application menu.
    bind(DebugFrontendApplicationContribution).toSelf().inSingletonScope();
    rebind(TheiaDebugFrontendApplicationContribution).toService(DebugFrontendApplicationContribution);

    // Preferences
    bindArduinoPreferences(bind);

    // Settings wrapper for the preferences and the CLI config.
    bind(SettingsService).toSelf().inSingletonScope();
    // Settings dialog and widget
    bind(SettingsWidget).toSelf().inSingletonScope();
    bind(SettingsDialog).toSelf().inSingletonScope();
    bind(SettingsDialogProps).toConstantValue({
        title: 'Preferences'
    });
});
