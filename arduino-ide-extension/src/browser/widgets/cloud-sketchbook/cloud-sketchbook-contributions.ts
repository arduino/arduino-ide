import {
  ContextMenuRenderer,
  RenderContextMenuOptions,
} from '@theia/core/lib/browser/context-menu-renderer';
import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import {
  PreferenceScope,
  PreferenceService,
} from '@theia/core/lib/browser/preferences/preference-service';
import { ApplicationShell } from '@theia/core/lib/browser/shell/application-shell';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { CommandRegistry } from '@theia/core/lib/common/command';
import {
  Disposable,
  DisposableCollection,
} from '@theia/core/lib/common/disposable';
import { Emitter, Event } from '@theia/core/lib/common/event';
import { MenuModelRegistry } from '@theia/core/lib/common/menu';
import { nls } from '@theia/core/lib/common/nls';
import { Widget } from '@theia/core/shared/@phosphor/widgets';
import { inject, injectable } from '@theia/core/shared/inversify';
import { ArduinoPreferences } from '../../arduino-preferences';
import { ConfigServiceClient } from '../../config/config-service-client';
import { CloudSketchContribution } from '../../contributions/cloud-contribution';
import {
  Sketch,
  TabBarToolbarRegistry,
} from '../../contributions/contribution';
import { ShareSketchDialog } from '../../dialogs/cloud-share-sketch-dialog';
import { ArduinoMenus, PlaceholderMenuNode } from '../../menu/arduino-menus';
import { CurrentSketch } from '../../sketches-service-client-impl';
import { ApplicationConnectionStatusContribution } from '../../theia/core/connection-status-service';
import { SketchbookCommands } from '../sketchbook/sketchbook-commands';
import { CloudSketchbookCommands } from './cloud-sketchbook-commands';
import { CloudSketchbookTree } from './cloud-sketchbook-tree';
import { CreateUri } from '../../create/create-uri';

const SKETCHBOOKSYNC__CONTEXT = ['arduino-sketchbook-sync--context'];

// `Open Folder`, `Open in New Window`
const SKETCHBOOKSYNC__CONTEXT__MAIN_GROUP = [
  ...SKETCHBOOKSYNC__CONTEXT,
  '0_main',
];

@injectable()
export class CloudSketchbookContribution extends CloudSketchContribution {
  @inject(ContextMenuRenderer)
  private readonly contextMenuRenderer: ContextMenuRenderer;
  @inject(MenuModelRegistry)
  private readonly menuRegistry: MenuModelRegistry;
  @inject(CommandRegistry)
  private readonly commandRegistry: CommandRegistry;
  @inject(WindowService)
  private readonly windowService: WindowService;
  @inject(ArduinoPreferences)
  private readonly arduinoPreferences: ArduinoPreferences;
  @inject(PreferenceService)
  private readonly preferenceService: PreferenceService;
  @inject(ConfigServiceClient)
  private readonly configServiceClient: ConfigServiceClient;
  @inject(ApplicationConnectionStatusContribution)
  private readonly connectionStatus: ApplicationConnectionStatusContribution;

  private readonly onDidChangeToolbarEmitter = new Emitter<void>();
  private readonly toDisposeBeforeNewContextMenu = new DisposableCollection();
  private readonly toDisposeOnStop = new DisposableCollection(
    this.onDidChangeToolbarEmitter,
    this.toDisposeBeforeNewContextMenu
  );
  private shell: ApplicationShell | undefined;

  override onStart(app: FrontendApplication): void {
    this.shell = app.shell;
    this.toDisposeOnStop.pushAll([
      this.connectionStatus.onOfflineStatusDidChange((offlineStatus) => {
        if (!offlineStatus || offlineStatus === 'internet') {
          this.fireToolbarChange();
        }
      }),
      this.createFeatures.onDidChangeSession(() => this.fireToolbarChange()),
      this.createFeatures.onDidChangeEnabled(() => this.fireToolbarChange()),
      this.createFeatures.onDidChangeCloudSketchState(() =>
        this.fireToolbarChange()
      ),
    ]);
  }

  onStop(): void {
    this.toDisposeOnStop.dispose();
  }

  override registerMenus(menus: MenuModelRegistry): void {
    menus.registerMenuAction(ArduinoMenus.FILE__ADVANCED_SUBMENU, {
      commandId: CloudSketchbookCommands.TOGGLE_CLOUD_SKETCHBOOK.id,
      label: CloudSketchbookCommands.TOGGLE_CLOUD_SKETCHBOOK.label,
      order: '2',
    });
  }

  override registerToolbarItems(registry: TabBarToolbarRegistry): void {
    registry.registerItem({
      id: CloudSketchbookCommands.PULL_SKETCH__TOOLBAR.id,
      command: CloudSketchbookCommands.PULL_SKETCH__TOOLBAR.id,
      tooltip: CloudSketchbookCommands.PULL_SKETCH__TOOLBAR.label,
      priority: -2,
      onDidChange: this.onDidChangeToolbar,
    });
    registry.registerItem({
      id: CloudSketchbookCommands.PUSH_SKETCH__TOOLBAR.id,
      command: CloudSketchbookCommands.PUSH_SKETCH__TOOLBAR.id,
      tooltip: CloudSketchbookCommands.PUSH_SKETCH__TOOLBAR.label,
      priority: -1,
      onDidChange: this.onDidChangeToolbar,
    });
  }

  override registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(CloudSketchbookCommands.TOGGLE_CLOUD_SKETCHBOOK, {
      execute: () => {
        this.preferenceService.set(
          'arduino.cloud.enabled',
          !this.arduinoPreferences['arduino.cloud.enabled'],
          PreferenceScope.User
        );
      },
    });

    registry.registerCommand(CloudSketchbookCommands.PULL_SKETCH, {
      execute: (arg) => arg.model.sketchbookTree().pull(arg),
      isEnabled: (arg) => this.isCloudSketchDirNodeCommandArg(arg),
      isVisible: (arg) => this.isCloudSketchDirNodeCommandArg(arg),
    });

    registry.registerCommand(CloudSketchbookCommands.PUSH_SKETCH, {
      execute: (arg) => arg.model.sketchbookTree().push(arg.node),
      isEnabled: (arg) =>
        this.isCloudSketchDirNodeCommandArg(arg) &&
        CloudSketchbookTree.CloudSketchTreeNode.isSynced(arg.node),
      isVisible: (arg) =>
        this.isCloudSketchDirNodeCommandArg(arg) &&
        CloudSketchbookTree.CloudSketchTreeNode.isSynced(arg.node),
    });

    registry.registerCommand(CloudSketchbookCommands.PUSH_SKETCH__TOOLBAR, {
      execute: () =>
        this.executeDelegateWithCurrentSketch(
          CloudSketchbookCommands.PUSH_SKETCH.id
        ),
      isEnabled: (arg) => this.isEnabledCloudSketchToolbar(arg),
      isVisible: (arg) => this.isVisibleCloudSketchToolbar(arg),
    });
    registry.registerCommand(CloudSketchbookCommands.PULL_SKETCH__TOOLBAR, {
      execute: () =>
        this.executeDelegateWithCurrentSketch(
          CloudSketchbookCommands.PULL_SKETCH.id
        ),
      isEnabled: (arg) => this.isEnabledCloudSketchToolbar(arg),
      isVisible: (arg) => this.isVisibleCloudSketchToolbar(arg),
    });

    registry.registerCommand(CloudSketchbookCommands.OPEN_IN_CLOUD_EDITOR, {
      execute: (arg) => {
        this.windowService.openNewWindow(
          `https://create.arduino.cc/editor/${arg.username}/${arg.node.sketchId}`,
          { external: true }
        );
      },
      isEnabled: (arg) => this.isCloudSketchDirNodeCommandArg(arg),
      isVisible: (arg) => this.isCloudSketchDirNodeCommandArg(arg),
    });

    registry.registerCommand(CloudSketchbookCommands.OPEN_SKETCH_SHARE_DIALOG, {
      execute: (arg) => {
        new ShareSketchDialog({
          node: arg.node,
          title: nls.localize('arduino/cloud/shareSketch', 'Share Sketch'),
          createApi: this.createApi,
        }).open();
      },
      isEnabled: (arg) => this.isCloudSketchDirNodeCommandArg(arg),
      isVisible: (arg) => this.isCloudSketchDirNodeCommandArg(arg),
    });

    registry.registerCommand(
      CloudSketchbookCommands.OPEN_SKETCHBOOKSYNC_CONTEXT_MENU,
      {
        isEnabled: (arg) =>
          !!arg &&
          'node' in arg &&
          CloudSketchbookTree.CloudSketchDirNode.is(arg.node),
        isVisible: (arg) =>
          !!arg &&
          'node' in arg &&
          CloudSketchbookTree.CloudSketchDirNode.is(arg.node),
        execute: async (arg) => {
          // cleanup previous context menu entries
          this.toDisposeBeforeNewContextMenu.dispose();
          const container = arg.event.target;
          if (!container) {
            return;
          }

          this.menuRegistry.registerMenuAction(
            SKETCHBOOKSYNC__CONTEXT__MAIN_GROUP,
            {
              commandId: CloudSketchbookCommands.OPEN_IN_CLOUD_EDITOR.id,
              label: CloudSketchbookCommands.OPEN_IN_CLOUD_EDITOR.label,
              order: '0',
            }
          );
          this.toDisposeBeforeNewContextMenu.push(
            Disposable.create(() =>
              this.menuRegistry.unregisterMenuAction(
                CloudSketchbookCommands.OPEN_IN_CLOUD_EDITOR
              )
            )
          );

          this.menuRegistry.registerMenuAction(
            SKETCHBOOKSYNC__CONTEXT__MAIN_GROUP,
            {
              commandId: CloudSketchbookCommands.OPEN_SKETCH_SHARE_DIALOG.id,
              label: CloudSketchbookCommands.OPEN_SKETCH_SHARE_DIALOG.label,
              order: '1',
            }
          );
          this.toDisposeBeforeNewContextMenu.push(
            Disposable.create(() =>
              this.menuRegistry.unregisterMenuAction(
                CloudSketchbookCommands.OPEN_SKETCH_SHARE_DIALOG
              )
            )
          );

          const currentSketch = await this.sketchServiceClient.currentSketch();

          // disable the "open sketch" command for the current sketch and for those not in sync
          if (
            !CloudSketchbookTree.CloudSketchTreeNode.isSynced(arg.node) ||
            (CurrentSketch.isValid(currentSketch) &&
              currentSketch.uri === arg.node.uri.toString())
          ) {
            const placeholder = new PlaceholderMenuNode(
              SKETCHBOOKSYNC__CONTEXT__MAIN_GROUP,
              SketchbookCommands.OPEN_NEW_WINDOW.label!
            );
            this.menuRegistry.registerMenuNode(
              SKETCHBOOKSYNC__CONTEXT__MAIN_GROUP,
              placeholder
            );
            this.toDisposeBeforeNewContextMenu.push(
              Disposable.create(() =>
                this.menuRegistry.unregisterMenuNode(placeholder.id)
              )
            );
          } else {
            this.menuRegistry.registerMenuAction(
              SKETCHBOOKSYNC__CONTEXT__MAIN_GROUP,
              {
                commandId: SketchbookCommands.OPEN_NEW_WINDOW.id,
                label: SketchbookCommands.OPEN_NEW_WINDOW.label,
              }
            );
            this.toDisposeBeforeNewContextMenu.push(
              Disposable.create(() =>
                this.menuRegistry.unregisterMenuAction(
                  SketchbookCommands.OPEN_NEW_WINDOW
                )
              )
            );
          }

          const options: RenderContextMenuOptions = {
            menuPath: SKETCHBOOKSYNC__CONTEXT,
            anchor: {
              x: container.getBoundingClientRect().left,
              y: container.getBoundingClientRect().top + container.offsetHeight,
            },
            args: [arg],
          };
          this.contextMenuRenderer.render(options);
        },
      }
    );
  }

  private get currentCloudSketch(): Sketch | undefined {
    const currentSketch = this.sketchServiceClient.tryGetCurrentSketch();
    // could not load sketch via CLI
    if (!CurrentSketch.isValid(currentSketch)) {
      return undefined;
    }
    // cannot determine if the sketch is in the cloud cache folder
    const dataDirUri = this.configServiceClient.tryGetDataDirUri();
    if (!dataDirUri) {
      return undefined;
    }
    // sketch is not in the cache folder
    if (!this.createFeatures.isCloud(currentSketch, dataDirUri)) {
      return undefined;
    }
    return currentSketch;
  }

  private isVisibleCloudSketchToolbar(arg: unknown): boolean {
    // cloud preference is disabled
    if (!this.createFeatures.enabled) {
      return false;
    }
    if (!this.currentCloudSketch) {
      return false;
    }
    if (arg instanceof Widget) {
      return !!this.shell && this.shell.getWidgets('main').indexOf(arg) !== -1;
    }
    return false;
  }

  private isEnabledCloudSketchToolbar(arg: unknown): boolean {
    if (!this.isVisibleCloudSketchToolbar(arg)) {
      return false;
    }
    // not logged in
    if (!this.createFeatures.session) {
      return false;
    }
    // no Internet connection
    if (this.connectionStatus.offlineStatus === 'internet') {
      return false;
    }
    // no pull/push context for the current cloud sketch
    const sketch = this.currentCloudSketch;
    if (sketch) {
      const cloudUri = this.createFeatures.cloudUri(sketch);
      if (cloudUri) {
        return !this.createFeatures.cloudSketchState(
          CreateUri.toUri(cloudUri.path.toString())
        );
      }
    }
    return false;
  }

  private isCloudSketchDirNodeCommandArg(
    arg: unknown
  ): arg is CloudSketchbookCommands.Arg & {
    node: CloudSketchbookTree.CloudSketchDirNode;
  } {
    return (
      CloudSketchbookCommands.Arg.is(arg) &&
      CloudSketchbookTree.CloudSketchDirNode.is(arg.node) &&
      !this.createFeatures.cloudSketchState(arg.node.remoteUri)
    );
  }

  private async commandArgFromCurrentSketch(): Promise<
    CloudSketchbookCommands.Arg | undefined
  > {
    const sketch = this.currentCloudSketch;
    if (!sketch) {
      return undefined;
    }
    const model = await this.treeModel();
    if (!model) {
      return undefined;
    }
    const cloudUri = this.createFeatures.cloudUri(sketch);
    if (!cloudUri) {
      return undefined;
    }
    const posixPath = cloudUri.path.toString();
    const node = model.getNode(posixPath);
    if (CloudSketchbookTree.CloudSketchDirNode.is(node)) {
      return { model, node };
    }
    return undefined;
  }

  private async executeDelegateWithCurrentSketch(id: string): Promise<unknown> {
    const arg = await this.commandArgFromCurrentSketch();
    if (!arg) {
      return;
    }
    if (!this.commandRegistry.getActiveHandler(id, arg)) {
      throw new Error(
        `No active handler was available for the delegate command: ${id}. Cloud sketch tree node: ${arg.node.id}`
      );
    }
    return this.commandRegistry.executeCommand(id, arg);
  }

  private fireToolbarChange(): void {
    this.onDidChangeToolbarEmitter.fire();
  }

  private get onDidChangeToolbar(): Event<void> {
    return this.onDidChangeToolbarEmitter.event;
  }
}
