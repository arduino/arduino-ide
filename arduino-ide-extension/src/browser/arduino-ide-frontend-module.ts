import '../../src/browser/style/index.css';
import {
  Container,
  ContainerModule,
  interfaces,
} from '@theia/core/shared/inversify';
import { WidgetFactory } from '@theia/core/lib/browser/widget-manager';
import { CommandContribution } from '@theia/core/lib/common/command';
import { bindViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import { TabBarToolbarContribution } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { WebSocketConnectionProvider } from '@theia/core/lib/browser/messaging/ws-connection-provider';
import {
  FrontendApplicationContribution,
  FrontendApplication as TheiaFrontendApplication,
} from '@theia/core/lib/browser/frontend-application';
import { LibraryListWidget } from './library/library-list-widget';
import { ArduinoFrontendContribution } from './arduino-frontend-contribution';
import {
  LibraryService,
  LibraryServicePath,
} from '../common/protocol/library-service';
import {
  BoardsService,
  BoardsServicePath,
} from '../common/protocol/boards-service';
import {
  SketchesService,
  SketchesServicePath,
} from '../common/protocol/sketches-service';
import { SketchesServiceClientImpl } from './sketches-service-client-impl';
import { CoreService, CoreServicePath } from '../common/protocol/core-service';
import { BoardsListWidget } from './boards/boards-list-widget';
import { BoardsListWidgetFrontendContribution } from './boards/boards-widget-frontend-contribution';
import {
  BoardListDumper,
  BoardsServiceProvider,
} from './boards/boards-service-provider';
import { WorkspaceService as TheiaWorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import { WorkspaceService } from './theia/workspace/workspace-service';
import { OutlineViewContribution as TheiaOutlineViewContribution } from '@theia/outline-view/lib/browser/outline-view-contribution';
import { OutlineViewContribution } from './theia/outline/outline-contribution';
import { ProblemContribution as TheiaProblemContribution } from '@theia/markers/lib/browser/problem/problem-contribution';
import { ProblemContribution } from './theia/markers/problem-contribution';
import { FileNavigatorContribution } from './theia/navigator/navigator-contribution';
import { FileNavigatorContribution as TheiaFileNavigatorContribution } from '@theia/navigator/lib/browser/navigator-contribution';
import { KeymapsFrontendContribution } from './theia/keymaps/keymaps-frontend-contribution';
import { KeymapsFrontendContribution as TheiaKeymapsFrontendContribution } from '@theia/keymaps/lib/browser/keymaps-frontend-contribution';
import { ArduinoToolbarContribution } from './toolbar/arduino-toolbar-contribution';
import { EditorContribution as TheiaEditorContribution } from '@theia/editor/lib/browser/editor-contribution';
import { EditorContribution } from './theia/editor/editor-contribution';
import { MonacoStatusBarContribution as TheiaMonacoStatusBarContribution } from '@theia/monaco/lib/browser/monaco-status-bar-contribution';
import { MonacoStatusBarContribution } from './theia/monaco/monaco-status-bar-contribution';
import {
  ApplicationShell as TheiaApplicationShell,
  ShellLayoutRestorer as TheiaShellLayoutRestorer,
  CommonFrontendContribution as TheiaCommonFrontendContribution,
  DockPanelRenderer as TheiaDockPanelRenderer,
  TabBarRendererFactory,
  ContextMenuRenderer,
  createTreeContainer,
  TreeWidget,
} from '@theia/core/lib/browser';
import { MenuContribution } from '@theia/core/lib/common/menu';
import {
  ApplicationShell,
  DockPanelRenderer,
} from './theia/core/application-shell';
import { FrontendApplication } from './theia/core/frontend-application';
import {
  BoardsConfigDialog,
  BoardsConfigDialogProps,
} from './boards/boards-config-dialog';
import { ScmContribution as TheiaScmContribution } from '@theia/scm/lib/browser/scm-contribution';
import { ScmContribution } from './theia/scm/scm-contribution';
import { SearchInWorkspaceFrontendContribution as TheiaSearchInWorkspaceFrontendContribution } from '@theia/search-in-workspace/lib/browser/search-in-workspace-frontend-contribution';
import { SearchInWorkspaceFrontendContribution } from './theia/search-in-workspace/search-in-workspace-frontend-contribution';
import { LibraryListWidgetFrontendContribution } from './library/library-widget-frontend-contribution';
import {
  ConfigService,
  ConfigServicePath,
} from '../common/protocol/config-service';
import { MonitorWidget } from './serial/monitor/monitor-widget';
import { MonitorViewContribution } from './serial/monitor/monitor-view-contribution';
import { TabBarDecoratorService as TheiaTabBarDecoratorService } from '@theia/core/lib/browser/shell/tab-bar-decorator';
import { TabBarDecoratorService } from './theia/core/tab-bar-decorator';
import { ProblemManager as TheiaProblemManager } from '@theia/markers/lib/browser';
import { ProblemManager } from './theia/markers/problem-manager';
import { BoardsAutoInstaller } from './boards/boards-auto-installer';
import { ShellLayoutRestorer } from './theia/core/shell-layout-restorer';
import {
  ArduinoComponentContextMenuRenderer,
  ListItemRenderer,
} from './widgets/component-list/list-item-renderer';
import { ColorContribution } from '@theia/core/lib/browser/color-application-contribution';

import {
  ArduinoDaemonPath,
  ArduinoDaemon,
} from '../common/protocol/arduino-daemon';
import { EditorCommandContribution as TheiaEditorCommandContribution } from '@theia/editor/lib/browser';
import {
  FrontendConnectionStatusService,
  ApplicationConnectionStatusContribution,
  DaemonPort,
  IsOnline,
} from './theia/core/connection-status-service';
import {
  FrontendConnectionStatusService as TheiaFrontendConnectionStatusService,
  ApplicationConnectionStatusContribution as TheiaApplicationConnectionStatusContribution,
} from '@theia/core/lib/browser/connection-status-service';
import { BoardsDataMenuUpdater } from './contributions/boards-data-menu-updater';
import { BoardsDataStore } from './boards/boards-data-store';
import { ILogger } from '@theia/core/lib/common/logger';
import { bindContributionProvider } from '@theia/core/lib/common/contribution-provider';
import {
  FileSystemExt,
  FileSystemExtPath,
} from '../common/protocol/filesystem-ext';
import {
  WorkspaceFrontendContribution as TheiaWorkspaceFrontendContribution,
  FileMenuContribution as TheiaFileMenuContribution,
  WorkspaceCommandContribution as TheiaWorkspaceCommandContribution,
} from '@theia/workspace/lib/browser';
import {
  WorkspaceFrontendContribution,
  ArduinoFileMenuContribution,
} from './theia/workspace/workspace-frontend-contribution';
import { Contribution } from './contributions/contribution';
import { NewSketch } from './contributions/new-sketch';
import { OpenSketch } from './contributions/open-sketch';
import { Close } from './contributions/close';
import { SaveAsSketch } from './contributions/save-as-sketch';
import { SaveSketch } from './contributions/save-sketch';
import {
  CompileSummaryProvider,
  VerifySketch,
} from './contributions/verify-sketch';
import { UploadSketch } from './contributions/upload-sketch';
import { CommonFrontendContribution } from './theia/core/common-frontend-contribution';
import { EditContributions } from './contributions/edit-contributions';
import { OpenSketchExternal } from './contributions/open-sketch-external';
import { PreferencesContribution as TheiaPreferencesContribution } from '@theia/preferences/lib/browser/preferences-contribution';
import { PreferencesContribution } from './theia/preferences/preferences-contribution';
import { QuitApp } from './contributions/quit-app';
import { SketchControl } from './contributions/sketch-control';
import { OpenSettings } from './contributions/open-settings';
import { WorkspaceCommandContribution } from './theia/workspace/workspace-commands';
import { WorkspaceDeleteHandler as TheiaWorkspaceDeleteHandler } from '@theia/workspace/lib/browser/workspace-delete-handler';
import { WorkspaceDeleteHandler } from './theia/workspace/workspace-delete-handler';
import { EditorWidgetFactory as TheiaEditorWidgetFactory } from '@theia/editor/lib/browser/editor-widget-factory';
import { EditorWidgetFactory } from './theia/editor/editor-widget-factory';
import { BurnBootloader } from './contributions/burn-bootloader';
import {
  ExamplesServicePath,
  ExamplesService,
} from '../common/protocol/examples-service';
import { BuiltInExamples, LibraryExamples } from './contributions/examples';
import { IncludeLibrary } from './contributions/include-library';
import { OutputChannelManager as TheiaOutputChannelManager } from '@theia/output/lib/browser/output-channel';
import { OutputChannelManager } from './theia/output/output-channel';
import {
  OutputChannelRegistryMainImpl as TheiaOutputChannelRegistryMainImpl,
  OutputChannelRegistryMainImpl,
} from './theia/plugin-ext/output-channel-registry-main';
import {
  ExecutableService,
  ExecutableServicePath,
  MonitorManagerProxy,
  MonitorManagerProxyClient,
  MonitorManagerProxyFactory,
  MonitorManagerProxyPath,
} from '../common/protocol';
import { MonacoTextModelService as TheiaMonacoTextModelService } from '@theia/monaco/lib/browser/monaco-text-model-service';
import { MonacoTextModelService } from './theia/monaco/monaco-text-model-service';
import { ResponseServiceImpl } from './response-service-impl';
import {
  ResponseService,
  ResponseServiceClient,
  ResponseServicePath,
} from '../common/protocol/response-service';
import { NotificationCenter } from './notification-center';
import {
  NotificationServicePath,
  NotificationServiceServer,
} from '../common/protocol';
import { About } from './contributions/about';
import { IconThemeService } from '@theia/core/lib/browser/icon-theme-service';
import { TabBarRenderer } from './theia/core/tab-bars';
import { EditorCommandContribution } from './theia/editor/editor-command';
import { NavigatorTabBarDecorator as TheiaNavigatorTabBarDecorator } from '@theia/navigator/lib/browser/navigator-tab-bar-decorator';
import { NavigatorTabBarDecorator } from './theia/navigator/navigator-tab-bar-decorator';
import { Debug, DebugDisabledStatusMessageSource } from './contributions/debug';
import { Sketchbook } from './contributions/sketchbook';
import { DebugFrontendApplicationContribution } from './theia/debug/debug-frontend-application-contribution';
import { DebugFrontendApplicationContribution as TheiaDebugFrontendApplicationContribution } from '@theia/debug/lib/browser/debug-frontend-application-contribution';
import { BoardSelection } from './contributions/board-selection';
import { OpenRecentSketch } from './contributions/open-recent-sketch';
import { Help } from './contributions/help';
import { bindArduinoPreferences } from './arduino-preferences';
import { SettingsService } from './dialogs/settings/settings';
import {
  SettingsDialog,
  SettingsWidget,
  SettingsDialogProps,
} from './dialogs/settings/settings-dialog';
import { AddFile } from './contributions/add-file';
import { ArchiveSketch } from './contributions/archive-sketch';
import { OutputToolbarContribution as TheiaOutputToolbarContribution } from '@theia/output/lib/browser/output-toolbar-contribution';
import { OutputToolbarContribution } from './theia/output/output-toolbar-contribution';
import { AddZipLibrary } from './contributions/add-zip-library';
import { WorkspaceVariableContribution as TheiaWorkspaceVariableContribution } from '@theia/workspace/lib/browser/workspace-variable-contribution';
import { WorkspaceVariableContribution } from './theia/workspace/workspace-variable-contribution';
import { DebugConfigurationManager } from './theia/debug/debug-configuration-manager';
import { DebugConfigurationManager as TheiaDebugConfigurationManager } from '@theia/debug/lib/browser/debug-configuration-manager';
import { SearchInWorkspaceFactory as TheiaSearchInWorkspaceFactory } from '@theia/search-in-workspace/lib/browser/search-in-workspace-factory';
import { SearchInWorkspaceFactory } from './theia/search-in-workspace/search-in-workspace-factory';
import { MonacoEditorProvider } from './theia/monaco/monaco-editor-provider';
import {
  MonacoEditorFactory,
  MonacoEditorProvider as TheiaMonacoEditorProvider,
} from '@theia/monaco/lib/browser/monaco-editor-provider';
import { NotificationManager } from './theia/messages/notifications-manager';
import { NotificationManager as TheiaNotificationManager } from '@theia/messages/lib/browser/notifications-manager';
import { NotificationsRenderer as TheiaNotificationsRenderer } from '@theia/messages/lib/browser/notifications-renderer';
import { NotificationsRenderer } from './theia/messages/notifications-renderer';
import { SketchbookWidgetContribution } from './widgets/sketchbook/sketchbook-widget-contribution';
import { LocalCacheFsProvider } from './local-cache/local-cache-fs-provider';
import { CloudSketchbookWidget } from './widgets/cloud-sketchbook/cloud-sketchbook-widget';
import { CloudSketchbookTreeWidget } from './widgets/cloud-sketchbook/cloud-sketchbook-tree-widget';
import { createCloudSketchbookTreeWidget } from './widgets/cloud-sketchbook/cloud-sketchbook-tree-container';
import { CreateApi } from './create/create-api';
import { ShareSketchDialog } from './dialogs/cloud-share-sketch-dialog';
import { AuthenticationClientService } from './auth/authentication-client-service';
import {
  AuthenticationService,
  AuthenticationServicePath,
} from '../common/protocol/authentication-service';
import { CreateFsProvider } from './create/create-fs-provider';
import { FileServiceContribution } from '@theia/filesystem/lib/browser/file-service';
import { CloudSketchbookContribution } from './widgets/cloud-sketchbook/cloud-sketchbook-contributions';
import { CloudSketchbookCompositeWidget } from './widgets/cloud-sketchbook/cloud-sketchbook-composite-widget';
import { SketchbookWidget } from './widgets/sketchbook/sketchbook-widget';
import { SketchbookTreeWidget } from './widgets/sketchbook/sketchbook-tree-widget';
import { createSketchbookTreeWidget } from './widgets/sketchbook/sketchbook-tree-container';
import { SketchCache } from './widgets/cloud-sketchbook/cloud-sketch-cache';
import { UploadFirmware } from './contributions/upload-firmware';
import {
  UploadFirmwareDialog,
  UploadFirmwareDialogProps,
} from './dialogs/firmware-uploader/firmware-uploader-dialog';
import { UploadCertificate } from './contributions/upload-certificate';
import {
  ArduinoFirmwareUploader,
  ArduinoFirmwareUploaderPath,
} from '../common/protocol/arduino-firmware-uploader';
import {
  UploadCertificateDialog,
  UploadCertificateDialogProps,
  UploadCertificateDialogWidget,
} from './dialogs/certificate-uploader/certificate-uploader-dialog';
import { PlotterFrontendContribution } from './serial/plotter/plotter-frontend-contribution';
import {
  UserFieldsDialog,
  UserFieldsDialogProps,
} from './dialogs/user-fields/user-fields-dialog';
import { nls } from '@theia/core/lib/common';
import { IDEUpdaterCommands } from './ide-updater/ide-updater-commands';
import {
  IDEUpdater,
  IDEUpdaterClient,
  IDEUpdaterPath,
} from '../common/protocol/ide-updater';
import { IDEUpdaterClientImpl } from './ide-updater/ide-updater-client-impl';
import {
  IDEUpdaterDialog,
  IDEUpdaterDialogProps,
} from './dialogs/ide-updater/ide-updater-dialog';
import { ElectronIpcConnectionProvider } from '@theia/core/lib/electron-browser/messaging/electron-ipc-connection-provider';
import { MonitorModel } from './monitor-model';
import { MonitorManagerProxyClientImpl } from './monitor-manager-proxy-client-impl';
import { EditorManager as TheiaEditorManager } from '@theia/editor/lib/browser/editor-manager';
import { EditorManager } from './theia/editor/editor-manager';
import { HostedPluginEvents } from './hosted/hosted-plugin-events';
import { HostedPluginSupportImpl } from './theia/plugin-ext/hosted-plugin';
import { HostedPluginSupport as TheiaHostedPluginSupport } from '@theia/plugin-ext/lib/hosted/browser/hosted-plugin';
import { Formatter, FormatterPath } from '../common/protocol/formatter';
import { Format } from './contributions/format';
import { MonacoFormattingConflictsContribution } from './theia/monaco/monaco-formatting-conflicts';
import { MonacoFormattingConflictsContribution as TheiaMonacoFormattingConflictsContribution } from '@theia/monaco/lib/browser/monaco-formatting-conflicts';
import { DefaultJsonSchemaContribution } from './theia/core/json-schema-store';
import { DefaultJsonSchemaContribution as TheiaDefaultJsonSchemaContribution } from '@theia/core/lib/browser/json-schema-store';
import { EditorNavigationContribution } from './theia/editor/editor-navigation-contribution';
import { EditorNavigationContribution as TheiaEditorNavigationContribution } from '@theia/editor/lib/browser/editor-navigation-contribution';
import { PreferenceTreeGenerator } from './theia/preferences/preference-tree-generator';
import { PreferenceTreeGenerator as TheiaPreferenceTreeGenerator } from '@theia/preferences/lib/browser/util/preference-tree-generator';
import { AboutDialog } from './theia/core/about-dialog';
import { AboutDialog as TheiaAboutDialog } from '@theia/core/lib/browser/about-dialog';
import {
  SurveyNotificationService,
  SurveyNotificationServicePath,
} from '../common/protocol/survey-service';
import { WindowContribution } from './theia/core/window-contribution';
import { WindowContribution as TheiaWindowContribution } from '@theia/core/lib/browser/window-contribution';
import { CoreErrorHandler } from './contributions/core-error-handler';
import { CompilerErrors } from './contributions/compiler-errors';
import { WidgetManager } from './theia/core/widget-manager';
import { WidgetManager as TheiaWidgetManager } from '@theia/core/lib/browser/widget-manager';
import { StartupTasksExecutor } from './contributions/startup-tasks-executor';
import { IndexesUpdateProgress } from './contributions/indexes-update-progress';
import { Daemon } from './contributions/daemon';
import { FirstStartupInstaller } from './contributions/first-startup-installer';
import { OpenSketchFiles } from './contributions/open-sketch-files';
import { InoLanguage } from './contributions/ino-language';
import { SelectedBoard } from './contributions/selected-board';
import { CheckForIDEUpdates } from './contributions/check-for-ide-updates';
import { OpenBoardsConfig } from './contributions/open-boards-config';
import { SketchFilesTracker } from './contributions/sketch-files-tracker';
import { EditorMenuContribution } from './theia/editor/editor-file';
import { EditorMenuContribution as TheiaEditorMenuContribution } from '@theia/editor/lib/browser/editor-menu';
import { PreferencesEditorWidget as TheiaPreferencesEditorWidget } from '@theia/preferences/lib/browser/views/preference-editor-widget';
import { PreferencesEditorWidget } from './theia/preferences/preference-editor-widget';
import { PreferencesWidget } from '@theia/preferences/lib/browser/views/preference-widget';
import { createPreferencesWidgetContainer } from '@theia/preferences/lib/browser/views/preference-widget-bindings';
import {
  BoardsFilterRenderer,
  LibraryFilterRenderer,
} from './widgets/component-list/filter-renderer';
import { CheckForUpdates } from './contributions/check-for-updates';
import { OutputEditorFactory } from './theia/output/output-editor-factory';
import { StartupTaskProvider } from '../electron-common/startup-task';
import { DeleteSketch } from './contributions/delete-sketch';
import { UserFields } from './contributions/user-fields';
import { UpdateIndexes } from './contributions/update-indexes';
import { InterfaceScale } from './contributions/interface-scale';
import { OpenHandler } from '@theia/core/lib/browser/opener-service';
import { NewCloudSketch } from './contributions/new-cloud-sketch';
import { SketchbookCompositeWidget } from './widgets/sketchbook/sketchbook-composite-widget';
import { WindowTitleUpdater } from './theia/core/window-title-updater';
import { WindowTitleUpdater as TheiaWindowTitleUpdater } from '@theia/core/lib/browser/window/window-title-updater';
import {
  MonacoThemingService,
  CleanupObsoleteThemes,
  ThemesRegistrationSummary,
  MonacoThemeRegistry,
} from './theia/monaco/monaco-theming-service';
import { MonacoThemeRegistry as TheiaMonacoThemeRegistry } from '@theia/monaco/lib/browser/textmate/monaco-theme-registry';
import { MonacoThemingService as TheiaMonacoThemingService } from '@theia/monaco/lib/browser/monaco-theming-service';
import { TypeHierarchyServiceProvider } from './theia/typehierarchy/type-hierarchy-service';
import { TypeHierarchyServiceProvider as TheiaTypeHierarchyServiceProvider } from '@theia/typehierarchy/lib/browser/typehierarchy-service';
import { TypeHierarchyContribution } from './theia/typehierarchy/type-hierarchy-contribution';
import { TypeHierarchyContribution as TheiaTypeHierarchyContribution } from '@theia/typehierarchy/lib/browser/typehierarchy-contribution';
import { DefaultDebugSessionFactory } from './theia/debug/debug-session-contribution';
import { DebugSessionFactory } from '@theia/debug/lib/browser/debug-session-contribution';
import { ConfigServiceClient } from './config/config-service-client';
import { ValidateSketch } from './contributions/validate-sketch';
import { RenameCloudSketch } from './contributions/rename-cloud-sketch';
import { CreateFeatures } from './create/create-features';
import { Account } from './contributions/account';
import { SidebarBottomMenuWidget } from './theia/core/sidebar-bottom-menu-widget';
import { SidebarBottomMenuWidget as TheiaSidebarBottomMenuWidget } from '@theia/core/lib/browser/shell/sidebar-bottom-menu-widget';
import { CreateCloudCopy } from './contributions/create-cloud-copy';
import { FileResourceResolver } from './theia/filesystem/file-resource';
import { FileResourceResolver as TheiaFileResourceResolver } from '@theia/filesystem/lib/browser/file-resource';
import { StylingParticipant } from '@theia/core/lib/browser/styling-service';
import { MonacoEditorMenuContribution } from './theia/monaco/monaco-menu';
import { MonacoEditorMenuContribution as TheiaMonacoEditorMenuContribution } from '@theia/monaco/lib/browser/monaco-menu';
import { UpdateArduinoState } from './contributions/update-arduino-state';
import { TerminalFrontendContribution } from './theia/terminal/terminal-frontend-contribution';
import { TerminalFrontendContribution as TheiaTerminalFrontendContribution } from '@theia/terminal/lib/browser/terminal-frontend-contribution';
import { SelectionService } from '@theia/core/lib/common/selection-service';
import { CommandService } from '@theia/core/lib/common/command';
import { CorePreferences } from '@theia/core/lib/browser/core-preferences';
import { AutoSelectProgrammer } from './contributions/auto-select-programmer';
import { HostedPluginSupport } from './hosted/hosted-plugin-support';
import { DebugSessionManager as TheiaDebugSessionManager } from '@theia/debug/lib/browser/debug-session-manager';
import { DebugSessionManager } from './theia/debug/debug-session-manager';
import { DebugWidget as TheiaDebugWidget } from '@theia/debug/lib/browser/view/debug-widget';
import { DebugWidget } from './theia/debug/debug-widget';
import { DebugViewModel } from '@theia/debug/lib/browser/view/debug-view-model';
import { DebugSessionWidget } from '@theia/debug/lib/browser/view/debug-session-widget';
import { DebugConfigurationWidget } from './theia/debug/debug-configuration-widget';
import { DebugConfigurationWidget as TheiaDebugConfigurationWidget } from '@theia/debug/lib/browser/view/debug-configuration-widget';
import { DebugToolBar } from '@theia/debug/lib/browser/view/debug-toolbar-widget';
import {
  PluginTree,
  PluginTreeModel,
  TreeViewWidgetOptions,
  VIEW_ITEM_CONTEXT_MENU,
} from '@theia/plugin-ext/lib/main/browser/view/tree-view-widget';
import { TreeViewDecoratorService } from '@theia/plugin-ext/lib/main/browser/view/tree-view-decorator-service';
import { PLUGIN_VIEW_DATA_FACTORY_ID } from '@theia/plugin-ext/lib/main/browser/view/plugin-view-registry';
import { TreeViewWidget } from './theia/plugin-ext/tree-view-widget';
import {
  VersionWelcomeDialog,
  VersionWelcomeDialogProps,
} from './dialogs/version-welcome-dialog';

// Hack to fix copy/cut/paste issue after electron version update in Theia.
// https://github.com/eclipse-theia/theia/issues/12487
import('@theia/core/lib/browser/common-frontend-contribution.js').then(
  (theiaCommonContribution) => {
    theiaCommonContribution['supportCopy'] = true;
    theiaCommonContribution['supportCut'] = true;
    theiaCommonContribution['supportPaste'] = true;
  }
);

export default new ContainerModule((bind, unbind, isBound, rebind) => {
  // Commands, colors, theme adjustments, and toolbar items
  bind(ArduinoFrontendContribution).toSelf().inSingletonScope();
  bind(CommandContribution).toService(ArduinoFrontendContribution);
  bind(MenuContribution).toService(ArduinoFrontendContribution);
  bind(TabBarToolbarContribution).toService(ArduinoFrontendContribution);
  bind(FrontendApplicationContribution).toService(ArduinoFrontendContribution);
  bind(ColorContribution).toService(ArduinoFrontendContribution);
  bind(StylingParticipant).toService(ArduinoFrontendContribution);

  bind(ArduinoToolbarContribution).toSelf().inSingletonScope();
  bind(FrontendApplicationContribution).toService(ArduinoToolbarContribution);

  // Renderer for both the library and the core widgets.
  bind(ListItemRenderer).toSelf().inSingletonScope();
  bind(LibraryFilterRenderer).toSelf().inSingletonScope();
  bind(BoardsFilterRenderer).toSelf().inSingletonScope();

  // Library service
  bind(LibraryService)
    .toDynamicValue((context) =>
      WebSocketConnectionProvider.createProxy(
        context.container,
        LibraryServicePath
      )
    )
    .inSingletonScope();

  // Library list widget
  bind(LibraryListWidget).toSelf();
  bindViewContribution(bind, LibraryListWidgetFrontendContribution);
  bind(WidgetFactory).toDynamicValue((context) => ({
    id: LibraryListWidget.WIDGET_ID,
    createWidget: () => context.container.get(LibraryListWidget),
  }));
  bind(FrontendApplicationContribution).toService(
    LibraryListWidgetFrontendContribution
  );
  bind(OpenHandler).toService(LibraryListWidgetFrontendContribution);

  // Sketch list service
  bind(SketchesService)
    .toDynamicValue((context) =>
      WebSocketConnectionProvider.createProxy(
        context.container,
        SketchesServicePath
      )
    )
    .inSingletonScope();
  bind(SketchesServiceClientImpl).toSelf().inSingletonScope();
  bind(FrontendApplicationContribution).toService(SketchesServiceClientImpl);

  // Config service
  bind(ConfigService)
    .toDynamicValue((context) =>
      WebSocketConnectionProvider.createProxy(
        context.container,
        ConfigServicePath
      )
    )
    .inSingletonScope();
  bind(ConfigServiceClient).toSelf().inSingletonScope();
  bind(FrontendApplicationContribution).toService(ConfigServiceClient);

  // Boards service
  bind(BoardsService)
    .toDynamicValue((context) =>
      WebSocketConnectionProvider.createProxy(
        context.container,
        BoardsServicePath
      )
    )
    .inSingletonScope();
  // Boards service client to receive and delegate notifications from the backend.
  bind(BoardsServiceProvider).toSelf().inSingletonScope();
  bind(FrontendApplicationContribution).toService(BoardsServiceProvider);
  bind(CommandContribution).toService(BoardsServiceProvider);
  bind(BoardListDumper).toSelf().inSingletonScope();

  // To be able to track, and update the menu based on the core settings (aka. board details) of the currently selected board.
  bind(BoardsDataStore).toSelf().inSingletonScope();
  bind(FrontendApplicationContribution).toService(BoardsDataStore);
  bind(CommandContribution).toService(BoardsDataStore);
  bind(StartupTaskProvider).toService(BoardsDataStore); // to inherit the boards config options, programmer, etc in a new window

  // Logger for the Arduino daemon
  bind(ILogger)
    .toDynamicValue((ctx) => {
      const parentLogger = ctx.container.get<ILogger>(ILogger);
      return parentLogger.child('store');
    })
    .inSingletonScope()
    .whenTargetNamed('store');

  // Boards auto-installer
  bind(BoardsAutoInstaller).toSelf().inSingletonScope();
  bind(FrontendApplicationContribution).toService(BoardsAutoInstaller);

  // Boards list widget
  bind(BoardsListWidget).toSelf();
  bindViewContribution(bind, BoardsListWidgetFrontendContribution);
  bind(WidgetFactory).toDynamicValue((context) => ({
    id: BoardsListWidget.WIDGET_ID,
    createWidget: () => context.container.get(BoardsListWidget),
  }));
  bind(FrontendApplicationContribution).toService(
    BoardsListWidgetFrontendContribution
  );
  bind(OpenHandler).toService(BoardsListWidgetFrontendContribution);

  // Board select dialog
  bind(BoardsConfigDialog).toSelf().inSingletonScope();
  bind(BoardsConfigDialogProps).toConstantValue({
    title: nls.localize(
      'arduino/board/boardConfigDialogTitle',
      'Select Other Board and Port'
    ),
  });

  // Core service
  bind(CoreService)
    .toDynamicValue((context) =>
      WebSocketConnectionProvider.createProxy(
        context.container,
        CoreServicePath
      )
    )
    .inSingletonScope();
  bind(CoreErrorHandler).toSelf().inSingletonScope();

  // Serial monitor
  bind(MonitorWidget).toSelf();
  bind(FrontendApplicationContribution).toService(MonitorModel);
  bind(MonitorModel).toSelf().inSingletonScope();
  bindViewContribution(bind, MonitorViewContribution);
  bind(TabBarToolbarContribution).toService(MonitorViewContribution);
  bind(WidgetFactory).toDynamicValue((context) => ({
    id: MonitorWidget.ID,
    createWidget: () => context.container.get(MonitorWidget),
  }));

  bind(MonitorManagerProxyFactory).toFactory(
    (context) => () =>
      context.container.get<MonitorManagerProxy>(MonitorManagerProxy)
  );

  bind(MonitorManagerProxy)
    .toDynamicValue((context) =>
      WebSocketConnectionProvider.createProxy(
        context.container,
        MonitorManagerProxyPath,
        context.container.get(MonitorManagerProxyClient)
      )
    )
    .inSingletonScope();

  // Monitor manager proxy client to receive and delegate pluggable monitors
  // notifications from the backend
  bind(MonitorManagerProxyClient)
    .to(MonitorManagerProxyClientImpl)
    .inSingletonScope();

  bind(WorkspaceService).toSelf().inSingletonScope();
  rebind(TheiaWorkspaceService).toService(WorkspaceService);
  bind(WorkspaceVariableContribution).toSelf().inSingletonScope();
  rebind(TheiaWorkspaceVariableContribution).toService(
    WorkspaceVariableContribution
  );

  bind(SurveyNotificationService)
    .toDynamicValue((context) => {
      return ElectronIpcConnectionProvider.createProxy(
        context.container,
        SurveyNotificationServicePath
      );
    })
    .inSingletonScope();

  // Layout and shell customizations.
  rebind(TheiaOutlineViewContribution)
    .to(OutlineViewContribution)
    .inSingletonScope();
  rebind(TheiaProblemContribution).to(ProblemContribution).inSingletonScope();
  rebind(TheiaFileNavigatorContribution)
    .to(FileNavigatorContribution)
    .inSingletonScope();
  rebind(TheiaKeymapsFrontendContribution)
    .to(KeymapsFrontendContribution)
    .inSingletonScope();
  rebind(TheiaEditorContribution).to(EditorContribution).inSingletonScope();
  rebind(TheiaMonacoStatusBarContribution)
    .to(MonacoStatusBarContribution)
    .inSingletonScope();
  rebind(TheiaApplicationShell).to(ApplicationShell).inSingletonScope();
  rebind(TheiaScmContribution).to(ScmContribution).inSingletonScope();
  rebind(TheiaSearchInWorkspaceFrontendContribution)
    .to(SearchInWorkspaceFrontendContribution)
    .inSingletonScope();
  rebind(TheiaFrontendApplication).to(FrontendApplication).inSingletonScope();
  rebind(TheiaWorkspaceFrontendContribution)
    .to(WorkspaceFrontendContribution)
    .inSingletonScope();
  rebind(TheiaFileMenuContribution)
    .to(ArduinoFileMenuContribution)
    .inSingletonScope();
  rebind(TheiaCommonFrontendContribution)
    .to(CommonFrontendContribution)
    .inSingletonScope();
  rebind(TheiaPreferencesContribution)
    .to(PreferencesContribution)
    .inSingletonScope();
  rebind(TheiaWorkspaceCommandContribution)
    .to(WorkspaceCommandContribution)
    .inSingletonScope();
  rebind(TheiaWorkspaceDeleteHandler)
    .to(WorkspaceDeleteHandler)
    .inSingletonScope();
  rebind(TheiaEditorWidgetFactory).to(EditorWidgetFactory).inSingletonScope();
  bind(OutputChannelManager).toSelf().inSingletonScope();
  rebind(TheiaOutputChannelManager).toService(OutputChannelManager);
  bind(OutputChannelRegistryMainImpl).toSelf().inTransientScope();
  rebind(TheiaOutputChannelRegistryMainImpl).toService(
    OutputChannelRegistryMainImpl
  );
  bind(MonacoTextModelService).toSelf().inSingletonScope();
  rebind(TheiaMonacoTextModelService).toService(MonacoTextModelService);
  bind(MonacoEditorProvider).toSelf().inSingletonScope();
  rebind(TheiaMonacoEditorProvider).toService(MonacoEditorProvider);

  // Disabled reference counter in the editor manager to avoid opening the same editor (with different opener options) multiple times.
  bind(EditorManager).toSelf().inSingletonScope();
  rebind(TheiaEditorManager).toService(EditorManager);

  // replace search icon
  rebind(TheiaSearchInWorkspaceFactory)
    .to(SearchInWorkspaceFactory)
    .inSingletonScope();

  // Show a disconnected status bar, when the daemon is not available
  bind(ApplicationConnectionStatusContribution).toSelf().inSingletonScope();
  rebind(TheiaApplicationConnectionStatusContribution).toService(
    ApplicationConnectionStatusContribution
  );
  bind(FrontendConnectionStatusService).toSelf().inSingletonScope();
  rebind(TheiaFrontendConnectionStatusService).toService(
    FrontendConnectionStatusService
  );

  // Decorator customizations
  bind(TabBarDecoratorService).toSelf().inSingletonScope();
  rebind(TheiaTabBarDecoratorService).toService(TabBarDecoratorService);

  // Problem markers
  bind(ProblemManager).toSelf().inSingletonScope();
  rebind(TheiaProblemManager).toService(ProblemManager);

  // Customized layout restorer that can restore the state in async way: https://github.com/eclipse-theia/theia/issues/6579
  bind(ShellLayoutRestorer).toSelf().inSingletonScope();
  rebind(TheiaShellLayoutRestorer).toService(ShellLayoutRestorer);

  // No dropdown for the _Output_ view.
  bind(OutputToolbarContribution).toSelf().inSingletonScope();
  rebind(TheiaOutputToolbarContribution).toService(OutputToolbarContribution);

  // To remove `New Window` from the `File` menu
  bind(WindowContribution).toSelf().inSingletonScope();
  rebind(TheiaWindowContribution).toService(WindowContribution);

  // To remove `File` > `Close Editor`.
  bind(EditorMenuContribution).toSelf().inSingletonScope();
  rebind(TheiaEditorMenuContribution).toService(EditorMenuContribution);

  // To disable the highlighting of non-unicode characters in the _Output_ view
  bind(OutputEditorFactory).toSelf().inSingletonScope();
  // Rebind to `TheiaOutputEditorFactory` when https://github.com/eclipse-theia/theia/pull/11615 is available.
  rebind(MonacoEditorFactory).toService(OutputEditorFactory);

  bind(ArduinoDaemon)
    .toDynamicValue((context) =>
      WebSocketConnectionProvider.createProxy(
        context.container,
        ArduinoDaemonPath
      )
    )
    .inSingletonScope();

  bind(Formatter)
    .toDynamicValue(({ container }) =>
      WebSocketConnectionProvider.createProxy(container, FormatterPath)
    )
    .inSingletonScope();

  bind(ArduinoFirmwareUploader)
    .toDynamicValue((context) =>
      WebSocketConnectionProvider.createProxy(
        context.container,
        ArduinoFirmwareUploaderPath
      )
    )
    .inSingletonScope();

  // File-system extension
  bind(FileSystemExt)
    .toDynamicValue((context) =>
      WebSocketConnectionProvider.createProxy(
        context.container,
        FileSystemExtPath
      )
    )
    .inSingletonScope();

  // Examples service@
  bind(ExamplesService)
    .toDynamicValue((context) =>
      WebSocketConnectionProvider.createProxy(
        context.container,
        ExamplesServicePath
      )
    )
    .inSingletonScope();

  // Executable URIs known by the backend
  bind(ExecutableService)
    .toDynamicValue((context) =>
      WebSocketConnectionProvider.createProxy(
        context.container,
        ExecutableServicePath
      )
    )
    .inSingletonScope();

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
  Contribution.configure(bind, OpenSettings);
  Contribution.configure(bind, BurnBootloader);
  Contribution.configure(bind, BuiltInExamples);
  Contribution.configure(bind, LibraryExamples);
  Contribution.configure(bind, IncludeLibrary);
  Contribution.configure(bind, About);
  Contribution.configure(bind, Debug);
  Contribution.configure(bind, Sketchbook);
  Contribution.configure(bind, UploadFirmware);
  Contribution.configure(bind, UploadCertificate);
  Contribution.configure(bind, BoardSelection);
  Contribution.configure(bind, OpenRecentSketch);
  Contribution.configure(bind, Help);
  Contribution.configure(bind, AddFile);
  Contribution.configure(bind, ArchiveSketch);
  Contribution.configure(bind, AddZipLibrary);
  Contribution.configure(bind, PlotterFrontendContribution);
  Contribution.configure(bind, Format);
  Contribution.configure(bind, CompilerErrors);
  Contribution.configure(bind, StartupTasksExecutor);
  Contribution.configure(bind, IndexesUpdateProgress);
  Contribution.configure(bind, Daemon);
  Contribution.configure(bind, FirstStartupInstaller);
  Contribution.configure(bind, OpenSketchFiles);
  Contribution.configure(bind, InoLanguage);
  Contribution.configure(bind, SelectedBoard);
  Contribution.configure(bind, CheckForIDEUpdates);
  Contribution.configure(bind, OpenBoardsConfig);
  Contribution.configure(bind, SketchFilesTracker);
  Contribution.configure(bind, CheckForUpdates);
  Contribution.configure(bind, UserFields);
  Contribution.configure(bind, DeleteSketch);
  Contribution.configure(bind, UpdateIndexes);
  Contribution.configure(bind, InterfaceScale);
  Contribution.configure(bind, NewCloudSketch);
  Contribution.configure(bind, ValidateSketch);
  Contribution.configure(bind, RenameCloudSketch);
  Contribution.configure(bind, Account);
  Contribution.configure(bind, CloudSketchbookContribution);
  Contribution.configure(bind, CreateCloudCopy);
  Contribution.configure(bind, UpdateArduinoState);
  Contribution.configure(bind, BoardsDataMenuUpdater);
  Contribution.configure(bind, AutoSelectProgrammer);

  bind(CompileSummaryProvider).toService(VerifySketch);

  bindContributionProvider(bind, StartupTaskProvider);
  bind(StartupTaskProvider).toService(BoardsServiceProvider); // to reuse the boards config in another window

  bind(DebugDisabledStatusMessageSource).toService(Debug);

  // Disabled the quick-pick customization from Theia when multiple formatters are available.
  // Use the default VS Code behavior, and pick the first one. In the IDE2, clang-format has `exclusive` selectors.
  bind(MonacoFormattingConflictsContribution).toSelf().inSingletonScope();
  rebind(TheiaMonacoFormattingConflictsContribution).toService(
    MonacoFormattingConflictsContribution
  );

  bind(ResponseServiceImpl)
    .toSelf()
    .inSingletonScope()
    .onActivation(({ container }, responseService) => {
      WebSocketConnectionProvider.createProxy(
        container,
        ResponseServicePath,
        responseService
      );
      return responseService;
    });

  bind(ResponseService).toService(ResponseServiceImpl);
  bind(ResponseServiceClient).toService(ResponseServiceImpl);

  bind(NotificationCenter).toSelf().inSingletonScope();
  bind(FrontendApplicationContribution).toService(NotificationCenter);
  bind(NotificationServiceServer)
    .toDynamicValue((context) =>
      WebSocketConnectionProvider.createProxy(
        context.container,
        NotificationServicePath
      )
    )
    .inSingletonScope();

  // Enable the dirty indicator on uncloseable widgets.
  rebind(TabBarRendererFactory).toFactory((context) => () => {
    const contextMenuRenderer =
      context.container.get<ContextMenuRenderer>(ContextMenuRenderer);
    const decoratorService = context.container.get<TabBarDecoratorService>(
      TabBarDecoratorService
    );
    const iconThemeService =
      context.container.get<IconThemeService>(IconThemeService);
    const selectionService =
      context.container.get<SelectionService>(SelectionService);
    const commandService =
      context.container.get<CommandService>(CommandService);
    const corePreferences =
      context.container.get<CorePreferences>(CorePreferences);
    return new TabBarRenderer(
      contextMenuRenderer,
      decoratorService,
      iconThemeService,
      selectionService,
      commandService,
      corePreferences
    );
  });

  // Workaround for https://github.com/eclipse-theia/theia/issues/8722
  // Do not trigger a save on IDE startup if `"editor.autoSave": "on"` was set as a preference.
  // Note: `"editor.autoSave" was renamed to `"files.autoSave" and `"on"` was replaced with three
  // different cases, but we treat `!== 'off'` as auto save enabled. (https://github.com/eclipse-theia/theia/issues/10812)
  bind(EditorCommandContribution).toSelf().inSingletonScope();
  rebind(TheiaEditorCommandContribution).toService(EditorCommandContribution);

  // Silent the badge decoration in the Explorer view.
  bind(NavigatorTabBarDecorator).toSelf().inSingletonScope();
  rebind(TheiaNavigatorTabBarDecorator).toService(NavigatorTabBarDecorator);

  // Do not fetch the `catalog.json` from Azure on FE load.
  bind(DefaultJsonSchemaContribution).toSelf().inSingletonScope();
  rebind(TheiaDefaultJsonSchemaContribution).toService(
    DefaultJsonSchemaContribution
  );

  // Do not block the app startup when initializing the editor navigation history.
  bind(EditorNavigationContribution).toSelf().inSingletonScope();
  rebind(TheiaEditorNavigationContribution).toService(
    EditorNavigationContribution
  );

  // IDE2 does not use the Theia preferences widget, no need to create and sync the underlying tree model.
  bind(PreferenceTreeGenerator).toSelf().inSingletonScope();
  rebind(TheiaPreferenceTreeGenerator).toService(PreferenceTreeGenerator);

  // IDE2 has a custom about dialog, so there is no need to load the Theia extensions on FE load
  bind(AboutDialog).toSelf().inSingletonScope();
  rebind(TheiaAboutDialog).toService(AboutDialog);

  // To remove the `Run` menu item from the application menu.
  bind(DebugFrontendApplicationContribution).toSelf().inSingletonScope();
  rebind(TheiaDebugFrontendApplicationContribution).toService(
    DebugFrontendApplicationContribution
  );
  // To be able to use a `launch.json` from outside of the workspace.
  bind(DebugConfigurationManager).toSelf().inSingletonScope();
  rebind(TheiaDebugConfigurationManager).toService(DebugConfigurationManager);
  // To update the currently selected debug config <select> option when starting a debug session.
  bind(DebugSessionManager).toSelf().inSingletonScope();
  rebind(TheiaDebugSessionManager).toService(DebugSessionManager);
  // Customized debug widget with its customized config <select> to update it programmatically.
  bind(WidgetFactory)
    .toDynamicValue(({ container }) => ({
      id: TheiaDebugWidget.ID,
      createWidget: () => {
        const child = new Container({ defaultScope: 'Singleton' });
        child.parent = container;
        child.bind(DebugViewModel).toSelf();
        child.bind(DebugToolBar).toSelf();
        child.bind(DebugSessionWidget).toSelf();
        child.bind(DebugConfigurationWidget).toSelf(); // with the patched select
        child // use the customized one in the Theia DI
          .bind(TheiaDebugConfigurationWidget)
          .toService(DebugConfigurationWidget);
        child.bind(DebugWidget).toSelf();
        return child.get(DebugWidget);
      },
    }))
    .inSingletonScope();

  // To avoid duplicate tabs use deepEqual instead of string equal: https://github.com/eclipse-theia/theia/issues/11309
  bind(WidgetManager).toSelf().inSingletonScope();
  rebind(TheiaWidgetManager).toService(WidgetManager);

  // Debounced update for the tab-bar toolbar when typing in the editor.
  bind(DockPanelRenderer).toSelf();
  rebind(TheiaDockPanelRenderer).toService(DockPanelRenderer);

  // Avoid running the "reset scroll" interval tasks until the preference editor opens.
  rebind(PreferencesWidget)
    .toDynamicValue(({ container }) => {
      const child = createPreferencesWidgetContainer(container);
      child.bind(PreferencesEditorWidget).toSelf().inSingletonScope();
      child
        .rebind(TheiaPreferencesEditorWidget)
        .toService(PreferencesEditorWidget);
      return child.get(PreferencesWidget);
    })
    .inSingletonScope();

  // Preferences
  bindArduinoPreferences(bind);

  // Settings wrapper for the preferences and the CLI config.
  bind(SettingsService).toSelf().inSingletonScope();
  // Settings dialog and widget
  bind(SettingsWidget).toSelf().inSingletonScope();
  bind(SettingsDialog).toSelf().inSingletonScope();
  bind(SettingsDialogProps).toConstantValue({
    title: nls.localize(
      'vscode/preferences.contribution/preferences',
      'Preferences'
    ),
  });

  bind(NotificationManager).toSelf().inSingletonScope();
  rebind(TheiaNotificationManager).toService(NotificationManager);
  bind(NotificationsRenderer).toSelf().inSingletonScope();
  rebind(TheiaNotificationsRenderer).toService(NotificationsRenderer);

  // UI for the Sketchbook
  bind(SketchbookWidget).toSelf();
  bind(SketchbookTreeWidget).toDynamicValue(({ container }) =>
    createSketchbookTreeWidget(container)
  );
  bindViewContribution(bind, SketchbookWidgetContribution);
  bind(FrontendApplicationContribution).toService(SketchbookWidgetContribution);
  bind(WidgetFactory).toDynamicValue(({ container }) => ({
    id: 'arduino-sketchbook-widget',
    createWidget: () => container.get(SketchbookWidget),
  }));
  bind(SketchbookCompositeWidget).toSelf();
  bind<WidgetFactory>(WidgetFactory).toDynamicValue((ctx) => ({
    id: 'sketchbook-composite-widget',
    createWidget: () => ctx.container.get(SketchbookCompositeWidget),
  }));

  bind(CloudSketchbookWidget).toSelf();
  rebind(SketchbookWidget).toService(CloudSketchbookWidget);
  bind(CloudSketchbookTreeWidget).toDynamicValue(({ container }) =>
    createCloudSketchbookTreeWidget(container)
  );
  bind(CreateApi).toSelf().inSingletonScope();
  bind(SketchCache).toSelf().inSingletonScope();
  bind(CreateFeatures).toSelf().inSingletonScope();
  bind(FrontendApplicationContribution).toService(CreateFeatures);

  bind(ShareSketchDialog).toSelf().inSingletonScope();
  bind(AuthenticationClientService).toSelf().inSingletonScope();
  bind(CommandContribution).toService(AuthenticationClientService);
  bind(FrontendApplicationContribution).toService(AuthenticationClientService);
  bind(AuthenticationService)
    .toDynamicValue((context) =>
      WebSocketConnectionProvider.createProxy(
        context.container,
        AuthenticationServicePath
      )
    )
    .inSingletonScope();
  bind(CreateFsProvider).toSelf().inSingletonScope();
  bind(FrontendApplicationContribution).toService(CreateFsProvider);
  bind(FileServiceContribution).toService(CreateFsProvider);
  bind(LocalCacheFsProvider).toSelf().inSingletonScope();
  bind(FileServiceContribution).toService(LocalCacheFsProvider);
  bind(CloudSketchbookCompositeWidget).toSelf();
  bind(WidgetFactory).toDynamicValue((ctx) => ({
    id: 'cloud-sketchbook-composite-widget',
    createWidget: () => ctx.container.get(CloudSketchbookCompositeWidget),
  }));

  bind(UploadFirmwareDialog).toSelf().inSingletonScope();
  bind(UploadFirmwareDialogProps).toConstantValue({
    title: 'UploadFirmware',
  });
  bind(UploadCertificateDialogWidget).toSelf().inSingletonScope();
  bind(UploadCertificateDialog).toSelf().inSingletonScope();
  bind(UploadCertificateDialogProps).toConstantValue({
    title: 'UploadCertificate',
  });

  bind(IDEUpdaterDialog).toSelf().inSingletonScope();
  bind(IDEUpdaterDialogProps).toConstantValue({
    title: 'IDEUpdater',
  });

  bind(VersionWelcomeDialog).toSelf().inSingletonScope();
  bind(VersionWelcomeDialogProps).toConstantValue({
    title: 'VersionWelcomeDialog',
  });

  bind(UserFieldsDialog).toSelf().inSingletonScope();
  bind(UserFieldsDialogProps).toConstantValue({
    title: 'UserFields',
  });

  bind(IDEUpdaterCommands).toSelf().inSingletonScope();
  bind(CommandContribution).toService(IDEUpdaterCommands);

  // Frontend binding for the IDE Updater service
  bind(IDEUpdaterClientImpl).toSelf().inSingletonScope();
  bind(IDEUpdaterClient).toService(IDEUpdaterClientImpl);
  bind(IDEUpdater)
    .toDynamicValue((context) => {
      const client = context.container.get(IDEUpdaterClientImpl);
      return ElectronIpcConnectionProvider.createProxy(
        context.container,
        IDEUpdaterPath,
        client
      );
    })
    .inSingletonScope();

  bind(HostedPluginSupportImpl).toSelf().inSingletonScope();
  bind(HostedPluginSupport).toService(HostedPluginSupportImpl);
  rebind(TheiaHostedPluginSupport).toService(HostedPluginSupportImpl);
  bind(HostedPluginEvents).toSelf().inSingletonScope();
  bind(FrontendApplicationContribution).toService(HostedPluginEvents);

  // custom window titles
  bind(WindowTitleUpdater).toSelf().inSingletonScope();
  rebind(TheiaWindowTitleUpdater).toService(WindowTitleUpdater);

  // register Arduino themes
  bind(MonacoThemingService).toSelf().inSingletonScope();
  rebind(TheiaMonacoThemingService).toService(MonacoThemingService);

  // workaround for themes cannot be removed after registration
  // https://github.com/eclipse-theia/theia/issues/11151
  bind(CleanupObsoleteThemes).toSelf().inSingletonScope();
  bind(FrontendApplicationContribution).toService(CleanupObsoleteThemes);
  bind(ThemesRegistrationSummary).toSelf().inSingletonScope();
  bind(MonacoThemeRegistry).toSelf().inSingletonScope();
  rebind(TheiaMonacoThemeRegistry).toService(MonacoThemeRegistry);

  // disable type-hierarchy support
  // https://github.com/eclipse-theia/theia/commit/16c88a584bac37f5cf3cc5eb92ffdaa541bda5be
  bind(TypeHierarchyServiceProvider).toSelf().inSingletonScope();
  rebind(TheiaTypeHierarchyServiceProvider).toService(
    TypeHierarchyServiceProvider
  );
  bind(TypeHierarchyContribution).toSelf().inSingletonScope();
  rebind(TheiaTypeHierarchyContribution).toService(TypeHierarchyContribution);

  bind(DefaultDebugSessionFactory).toSelf().inSingletonScope();
  rebind(DebugSessionFactory).toService(DefaultDebugSessionFactory);

  bind(SidebarBottomMenuWidget).toSelf();
  rebind(TheiaSidebarBottomMenuWidget).toService(SidebarBottomMenuWidget);

  bind(ArduinoComponentContextMenuRenderer).toSelf().inSingletonScope();

  bind(DaemonPort).toSelf().inSingletonScope();
  bind(FrontendApplicationContribution).toService(DaemonPort);
  bind(IsOnline).toSelf().inSingletonScope();
  bind(FrontendApplicationContribution).toService(IsOnline);

  // https://github.com/arduino/arduino-ide/issues/437
  bind(FileResourceResolver).toSelf().inSingletonScope();
  rebind(TheiaFileResourceResolver).toService(FileResourceResolver);

  // Full control over the editor context menu to filter undesired menu items contributed by Theia.
  // https://github.com/arduino/arduino-ide/issues/1394
  // https://github.com/arduino/arduino-ide/pull/2027#pullrequestreview-1414246614
  bind(MonacoEditorMenuContribution).toSelf().inSingletonScope();
  rebind(TheiaMonacoEditorMenuContribution).toService(
    MonacoEditorMenuContribution
  );

  // Patch terminal issues.
  bind(TerminalFrontendContribution).toSelf().inSingletonScope();
  rebind(TheiaTerminalFrontendContribution).toService(
    TerminalFrontendContribution
  );

  bindViewsWelcome_TheiaGH14309({ bind, widget: TreeViewWidget });
});

// Align the viewsWelcome rendering with VS Code (https://github.com/eclipse-theia/theia/issues/14309)
// Copied from Theia code but with customized TreeViewWidget with the customized viewsWelcome rendering
// https://github.com/eclipse-theia/theia/blob/0c5f69455d9ee355b1a7ca510ffa63d2b20f0c77/packages/plugin-ext/src/main/browser/plugin-ext-frontend-module.ts#L159-L181
function bindViewsWelcome_TheiaGH14309({
  bind,
  widget,
}: {
  bind: interfaces.Bind;
  widget: interfaces.Newable<TreeWidget>;
}) {
  bind(WidgetFactory)
    .toDynamicValue(({ container }) => ({
      id: PLUGIN_VIEW_DATA_FACTORY_ID,
      createWidget: (options: TreeViewWidgetOptions) => {
        const props = {
          contextMenuPath: VIEW_ITEM_CONTEXT_MENU,
          expandOnlyOnExpansionToggleClick: true,
          expansionTogglePadding: 22,
          globalSelection: true,
          leftPadding: 8,
          search: true,
          multiSelect: options.multiSelect,
        };
        const child = createTreeContainer(container, {
          props,
          tree: PluginTree,
          model: PluginTreeModel,
          widget,
          decoratorService: TreeViewDecoratorService,
        });
        child.bind(TreeViewWidgetOptions).toConstantValue(options);
        return child.get(TreeWidget);
      },
    }))
    .inSingletonScope();
}
