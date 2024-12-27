import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import { LabelProvider } from '@theia/core/lib/browser/label-provider';
import { OpenerService } from '@theia/core/lib/browser/opener-service';
import {
  LocalStorageService,
  StorageService,
} from '@theia/core/lib/browser/storage-service';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { MessageService } from '@theia/core/lib/common/message-service';
import { MockLogger } from '@theia/core/lib/common/test/mock-logger';
import {
  Container,
  ContainerModule,
  injectable,
} from '@theia/core/shared/inversify';
import { EditorManager } from '@theia/editor/lib/browser/editor-manager';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { ArduinoPreferences } from '../../browser/arduino-preferences';
import { BoardsDataStore } from '../../browser/boards/boards-data-store';
import { BoardsServiceProvider } from '../../browser/boards/boards-service-provider';
import { ConfigServiceClient } from '../../browser/config/config-service-client';
import { DialogService } from '../../browser/dialog-service';
import { SettingsService } from '../../browser/dialogs/settings/settings';
import { HostedPluginSupport } from '../../browser/hosted/hosted-plugin-support';
import { NotificationCenter } from '../../browser/notification-center';
import { SketchesServiceClientImpl } from '../../browser/sketches-service-client-impl';
import { ApplicationConnectionStatusContribution } from '../../browser/theia/core/connection-status-service';
import { OutputChannelManager } from '../../browser/theia/output/output-channel';
import { WorkspaceService } from '../../browser/theia/workspace/workspace-service';
import { MainMenuManager } from '../../common/main-menu-manager';
import { FileSystemExt, SketchesService } from '../../common/protocol';
import { BoardsService } from '../../common/protocol/boards-service';
import { NotificationServiceServer } from '../../common/protocol/notification-service';
import {
  Bind,
  ConsoleLogger,
  bindCommon,
} from '../common/common-test-bindings';
import { never } from '../utils';

export function createBaseContainer(bind: Bind = bindBrowser): Container {
  const container = new Container({ defaultScope: 'Singleton' });
  container.load(new ContainerModule(bind));
  return container;
}

export const bindBrowser: Bind = function (
  ...args: Parameters<Bind>
): ReturnType<Bind> {
  bindCommon(...args);
  const [bind, , , rebind] = args;
  // IDE2's test console logger does not support `Loggable` arg.
  // Rebind logger to suppress `[Function (anonymous)]` messages in tests when the storage service is initialized without `window.localStorage`.
  // https://github.com/eclipse-theia/theia/blob/04c8cf07843ea67402131132e033cdd54900c010/packages/core/src/browser/storage-service.ts#L60
  bind(MockLogger).toSelf().inSingletonScope();
  rebind(ConsoleLogger).toService(MockLogger);
};

/**
 * Binds all required services as a mock to test a `SketchesContribution` instance.
 */
export const bindSketchesContribution: Bind = function (
  ...args: Parameters<Bind>
): ReturnType<Bind> {
  const [bind] = args;
  bindBrowser(...args);
  bind(MessageService).toConstantValue(<MessageService>{});
  bind(BoardsService).toConstantValue(<BoardsService>{});
  bind(NotificationCenter).toSelf().inSingletonScope();
  bind(NotificationServiceServer).toConstantValue(<NotificationServiceServer>{
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setClient(_) {
      // nothing
    },
  });
  bind(FrontendApplicationStateService).toSelf().inSingletonScope();
  bind(BoardsDataStore).toConstantValue(<BoardsDataStore>{});
  bind(LocalStorageService).toSelf().inSingletonScope();
  bind(WindowService).toConstantValue(<WindowService>{});
  bind(StorageService).toService(LocalStorageService);
  bind(BoardsServiceProvider).toSelf().inSingletonScope();
  bind(NoopHostedPluginSupport).toSelf().inSingletonScope();
  bind(HostedPluginSupport).toService(NoopHostedPluginSupport);
  bind(FileService).toConstantValue(<FileService>{});
  bind(FileSystemExt).toConstantValue(<FileSystemExt>{});
  bind(ConfigServiceClient).toConstantValue(<ConfigServiceClient>{});
  bind(SketchesService).toConstantValue(<SketchesService>{});
  bind(OpenerService).toConstantValue(<OpenerService>{});
  bind(SketchesServiceClientImpl).toConstantValue(
    <SketchesServiceClientImpl>{}
  );
  bind(EditorManager).toConstantValue(<EditorManager>{});
  bind(OutputChannelManager).toConstantValue(<OutputChannelManager>{});
  bind(EnvVariablesServer).toConstantValue(<EnvVariablesServer>{});
  bind(ApplicationConnectionStatusContribution).toConstantValue(
    <ApplicationConnectionStatusContribution>{}
  );
  bind(WorkspaceService).toConstantValue(<WorkspaceService>{});
  bind(LabelProvider).toConstantValue(<LabelProvider>{});
  bind(SettingsService).toConstantValue(<SettingsService>{});
  bind(ArduinoPreferences).toConstantValue(<ArduinoPreferences>{});
  bind(DialogService).toConstantValue(<DialogService>{});
  bind(MainMenuManager).toConstantValue(<MainMenuManager>{});
};

@injectable()
export class NoopHostedPluginSupport implements HostedPluginSupport {
  readonly didStart = Promise.resolve();
  readonly onDidCloseConnection = never();
  readonly onDidLoad = never();
}
