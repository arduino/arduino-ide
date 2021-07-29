import { inject, injectable } from 'inversify';
import { TreeNode } from '@theia/core/lib/browser/tree';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { Command, CommandRegistry } from '@theia/core/lib/common/command';
import {
  ContextMenuRenderer,
  RenderContextMenuOptions,
} from '@theia/core/lib/browser';
import {
  Disposable,
  DisposableCollection,
} from '@theia/core/lib/common/disposable';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { MenuModelRegistry } from '@theia/core/lib/common/menu';
import { CloudSketchbookTree } from './cloud-sketchbook-tree';
import { CloudSketchbookTreeModel } from './cloud-sketchbook-tree-model';
import { CloudUserCommands } from '../../auth/cloud-user-commands';
import { ShareSketchDialog } from '../../dialogs/cloud-share-sketch-dialog';
import { CreateApi } from '../../create/create-api';
import {
  PreferenceService,
  PreferenceScope,
} from '@theia/core/lib/browser/preferences/preference-service';
import { ArduinoMenus, PlaceholderMenuNode } from '../../menu/arduino-menus';
import { SketchbookCommands } from '../sketchbook/sketchbook-commands';
import { SketchesServiceClientImpl } from '../../../common/protocol/sketches-service-client-impl';
import { Contribution } from '../../contributions/contribution';
import { ArduinoPreferences } from '../../arduino-preferences';
import { MainMenuManager } from '../../../common/main-menu-manager';

export const SKETCHBOOKSYNC__CONTEXT = ['arduino-sketchbook-sync--context'];

// `Open Folder`, `Open in New Window`
export const SKETCHBOOKSYNC__CONTEXT__MAIN_GROUP = [
  ...SKETCHBOOKSYNC__CONTEXT,
  '0_main',
];

export const CLOUD_USER__CONTEXT = ['arduino-cloud-user--context'];
export const CLOUD_USER__CONTEXT__USERNAME = [
  ...CLOUD_USER__CONTEXT,
  '0_username',
];
export const CLOUD_USER__CONTEXT__MAIN_GROUP = [
  ...CLOUD_USER__CONTEXT,
  '1_main',
];

export namespace CloudSketchbookCommands {
  export interface Arg {
    model: CloudSketchbookTreeModel;
    node: TreeNode;
    event?: MouseEvent;
  }
  export namespace Arg {
    export function is(arg: Partial<Arg> | undefined): arg is Arg {
      return (
        !!arg && !!arg.node && arg.model instanceof CloudSketchbookTreeModel
      );
    }
  }

  export const TOGGLE_CLOUD_SKETCHBOOK: Command = {
    id: 'arduino-cloud-sketchbook--disable',
    label: 'Show/Hide Remote Sketchbook',
  };

  export const PULL_SKETCH: Command = {
    id: 'arduino-cloud-sketchbook--pull-sketch',
    label: 'Pull Sketch',
    iconClass: 'pull-sketch-icon',
  };

  export const PUSH_SKETCH: Command = {
    id: 'arduino-cloud-sketchbook--push-sketch',
    label: 'Push Sketch',
    iconClass: 'push-sketch-icon',
  };

  export const OPEN_IN_CLOUD_EDITOR: Command = {
    id: 'arduino-cloud-sketchbook--open-in-cloud-editor',
    label: 'Open in Cloud Editor',
  };

  export const OPEN_SKETCHBOOKSYNC_CONTEXT_MENU: Command = {
    id: 'arduino-sketchbook-sync--open-sketch-context-menu',
    label: 'Options...',
    iconClass: 'sketchbook-tree__opts',
  };

  export const OPEN_SKETCH_SHARE_DIALOG: Command = {
    id: 'arduino-cloud-sketchbook--share-modal',
    label: 'Share...',
  };

  export const OPEN_PROFILE_CONTEXT_MENU: Command = {
    id: 'arduino-cloud-sketchbook--open-profile-menu',
    label: 'Contextual menu',
  };
}

@injectable()
export class CloudSketchbookContribution extends Contribution {
  @inject(FileService)
  protected readonly fileService: FileService;

  @inject(ContextMenuRenderer)
  protected readonly contextMenuRenderer: ContextMenuRenderer;

  @inject(MenuModelRegistry)
  protected readonly menuRegistry: MenuModelRegistry;

  @inject(SketchesServiceClientImpl)
  protected readonly sketchServiceClient: SketchesServiceClientImpl;

  @inject(WindowService)
  protected readonly windowService: WindowService;

  @inject(CreateApi)
  protected readonly createApi: CreateApi;

  @inject(ArduinoPreferences)
  protected readonly arduinoPreferences: ArduinoPreferences;

  @inject(PreferenceService)
  protected readonly preferenceService: PreferenceService;

  @inject(MainMenuManager)
  protected readonly mainMenuManager: MainMenuManager;

  protected readonly toDisposeBeforeNewContextMenu = new DisposableCollection();

  registerMenus(menus: MenuModelRegistry): void {
    menus.registerMenuAction(ArduinoMenus.FILE__ADVANCED_SUBMENU, {
      commandId: CloudSketchbookCommands.TOGGLE_CLOUD_SKETCHBOOK.id,
      label: CloudSketchbookCommands.TOGGLE_CLOUD_SKETCHBOOK.label,
      order: '2',
    });
  }

  registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(CloudSketchbookCommands.TOGGLE_CLOUD_SKETCHBOOK, {
      execute: () => {
        this.preferenceService.set(
          'arduino.cloud.enabled',
          !this.arduinoPreferences['arduino.cloud.enabled'],
          PreferenceScope.User
        );
      },
      isEnabled: () => true,
      isVisible: () => true,
    });

    registry.registerCommand(CloudSketchbookCommands.PULL_SKETCH, {
      execute: (arg) => arg.model.sketchbookTree().pull(arg),
      isEnabled: (arg) =>
        CloudSketchbookCommands.Arg.is(arg) &&
        CloudSketchbookTree.CloudSketchDirNode.is(arg.node),
      isVisible: (arg) =>
        CloudSketchbookCommands.Arg.is(arg) &&
        CloudSketchbookTree.CloudSketchDirNode.is(arg.node),
    });

    registry.registerCommand(CloudSketchbookCommands.PUSH_SKETCH, {
      execute: (arg) => arg.model.sketchbookTree().push(arg.node),
      isEnabled: (arg) =>
        CloudSketchbookCommands.Arg.is(arg) &&
        CloudSketchbookTree.CloudSketchDirNode.is(arg.node) &&
        CloudSketchbookTree.CloudSketchTreeNode.isSynced(arg.node),
      isVisible: (arg) =>
        CloudSketchbookCommands.Arg.is(arg) &&
        CloudSketchbookTree.CloudSketchDirNode.is(arg.node) &&
        CloudSketchbookTree.CloudSketchTreeNode.isSynced(arg.node),
    });

    registry.registerCommand(CloudSketchbookCommands.OPEN_IN_CLOUD_EDITOR, {
      execute: (arg) => {
        this.windowService.openNewWindow(
          `https://create.arduino.cc/editor/${arg.username}/${arg.node.sketchId}`,
          { external: true }
        );
      },
      isEnabled: (arg) =>
        CloudSketchbookCommands.Arg.is(arg) &&
        CloudSketchbookTree.CloudSketchDirNode.is(arg.node),
      isVisible: (arg) =>
        CloudSketchbookCommands.Arg.is(arg) &&
        CloudSketchbookTree.CloudSketchDirNode.is(arg.node),
    });

    registry.registerCommand(CloudSketchbookCommands.OPEN_SKETCH_SHARE_DIALOG, {
      execute: (arg) => {
        new ShareSketchDialog({
          node: arg.node,
          title: 'Share Sketch',
          createApi: this.createApi,
        }).open();
      },
      isEnabled: (arg) =>
        CloudSketchbookCommands.Arg.is(arg) &&
        CloudSketchbookTree.CloudSketchDirNode.is(arg.node),
      isVisible: (arg) =>
        CloudSketchbookCommands.Arg.is(arg) &&
        CloudSketchbookTree.CloudSketchDirNode.is(arg.node),
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
            (currentSketch && currentSketch.uri === arg.node.uri.toString())
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
            args: arg,
          };
          this.contextMenuRenderer.render(options);
        },
      }
    );

    registry.registerCommand(CloudUserCommands.OPEN_PROFILE_CONTEXT_MENU, {
      execute: async (arg) => {
        this.toDisposeBeforeNewContextMenu.dispose();
        const container = arg.event.target;
        if (!container) {
          return;
        }

        this.menuRegistry.registerMenuAction(CLOUD_USER__CONTEXT__MAIN_GROUP, {
          commandId: CloudUserCommands.LOGOUT.id,
          label: CloudUserCommands.LOGOUT.label,
        });
        this.toDisposeBeforeNewContextMenu.push(
          Disposable.create(() =>
            this.menuRegistry.unregisterMenuAction(CloudUserCommands.LOGOUT)
          )
        );

        const placeholder = new PlaceholderMenuNode(
          CLOUD_USER__CONTEXT__USERNAME,
          arg.username
        );
        this.menuRegistry.registerMenuNode(
          CLOUD_USER__CONTEXT__USERNAME,
          placeholder
        );
        this.toDisposeBeforeNewContextMenu.push(
          Disposable.create(() =>
            this.menuRegistry.unregisterMenuNode(placeholder.id)
          )
        );

        const options: RenderContextMenuOptions = {
          menuPath: CLOUD_USER__CONTEXT,
          anchor: {
            x: container.getBoundingClientRect().left,
            y:
              container.getBoundingClientRect().top -
              3.5 * container.offsetHeight,
          },
          args: arg,
        };
        this.contextMenuRenderer.render(options);
      },
    });

    this.registerMenus(this.menuRegistry);
  }
}
