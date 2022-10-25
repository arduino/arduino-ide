import { MenuModelRegistry } from '@theia/core/lib/common/menu';
import { KeybindingRegistry } from '@theia/core/lib/browser/keybinding';
import { CompositeTreeNode } from '@theia/core/lib/browser/tree';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { nls } from '@theia/core/lib/common/nls';
import { inject, injectable } from '@theia/core/shared/inversify';
import { MainMenuManager } from '../../common/main-menu-manager';
import type { AuthenticationSession } from '../../node/auth/types';
import { AuthenticationClientService } from '../auth/authentication-client-service';
import { CreateApi } from '../create/create-api';
import { CreateUri } from '../create/create-uri';
import { Create } from '../create/typings';
import { ArduinoMenus } from '../menu/arduino-menus';
import { WorkspaceInputDialog } from '../theia/workspace/workspace-input-dialog';
import { CloudSketchbookTree } from '../widgets/cloud-sketchbook/cloud-sketchbook-tree';
import { CloudSketchbookTreeModel } from '../widgets/cloud-sketchbook/cloud-sketchbook-tree-model';
import { CloudSketchbookTreeWidget } from '../widgets/cloud-sketchbook/cloud-sketchbook-tree-widget';
import { SketchbookCommands } from '../widgets/sketchbook/sketchbook-commands';
import { SketchbookWidget } from '../widgets/sketchbook/sketchbook-widget';
import { SketchbookWidgetContribution } from '../widgets/sketchbook/sketchbook-widget-contribution';
import { Command, CommandRegistry, Contribution, URI } from './contribution';

@injectable()
export class NewCloudSketch extends Contribution {
  @inject(CreateApi)
  private readonly createApi: CreateApi;
  @inject(SketchbookWidgetContribution)
  private readonly widgetContribution: SketchbookWidgetContribution;
  @inject(AuthenticationClientService)
  private readonly authenticationService: AuthenticationClientService;
  @inject(MainMenuManager)
  private readonly mainMenuManager: MainMenuManager;

  private readonly toDispose = new DisposableCollection();
  private _session: AuthenticationSession | undefined;
  private _enabled: boolean;

  override onReady(): void {
    this.toDispose.pushAll([
      this.authenticationService.onSessionDidChange((session) => {
        const oldSession = this._session;
        this._session = session;
        if (!!oldSession !== !!this._session) {
          this.mainMenuManager.update();
        }
      }),
      this.preferences.onPreferenceChanged(({ preferenceName, newValue }) => {
        if (preferenceName === 'arduino.cloud.enabled') {
          const oldEnabled = this._enabled;
          this._enabled = Boolean(newValue);
          if (this._enabled !== oldEnabled) {
            this.mainMenuManager.update();
          }
        }
      }),
    ]);
    this._enabled = this.preferences['arduino.cloud.enabled'];
    this._session = this.authenticationService.session;
    if (this._session) {
      this.mainMenuManager.update();
    }
  }

  onStop(): void {
    this.toDispose.dispose();
  }

  override registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(NewCloudSketch.Commands.NEW_CLOUD_SKETCH, {
      execute: () => this.createNewSketch(),
      isEnabled: () => !!this._session,
      isVisible: () => this._enabled,
    });
  }

  override registerMenus(registry: MenuModelRegistry): void {
    registry.registerMenuAction(ArduinoMenus.FILE__SKETCH_GROUP, {
      commandId: NewCloudSketch.Commands.NEW_CLOUD_SKETCH.id,
      label: nls.localize('arduino/cloudSketch/new', 'New Remote Sketch'),
      order: '1',
    });
  }

  override registerKeybindings(registry: KeybindingRegistry): void {
    registry.registerKeybinding({
      command: NewCloudSketch.Commands.NEW_CLOUD_SKETCH.id,
      keybinding: 'CtrlCmd+Alt+N',
    });
  }

  private async createNewSketch(
    initialValue?: string | undefined
  ): Promise<URI | undefined> {
    const widget = await this.widgetContribution.widget;
    const treeModel = this.treeModelFrom(widget);
    if (!treeModel) {
      return undefined;
    }
    const rootNode = CompositeTreeNode.is(treeModel.root)
      ? treeModel.root
      : undefined;
    if (!rootNode) {
      return undefined;
    }

    const newSketchName = await this.newSketchName(rootNode, initialValue);
    if (!newSketchName) {
      return undefined;
    }
    let result: Create.Sketch | undefined | 'conflict';
    try {
      result = await this.createApi.createSketch(newSketchName);
    } catch (err) {
      if (isConflict(err)) {
        result = 'conflict';
      } else {
        throw err;
      }
    } finally {
      if (result) {
        await treeModel.refresh();
      }
    }

    if (result === 'conflict') {
      return this.createNewSketch(newSketchName);
    }

    if (result) {
      return this.open(treeModel, result);
    }
    return undefined;
  }

  private async open(
    treeModel: CloudSketchbookTreeModel,
    newSketch: Create.Sketch
  ): Promise<URI | undefined> {
    const id = CreateUri.toUri(newSketch).path.toString();
    const node = treeModel.getNode(id);
    if (!node) {
      throw new Error(
        `Could not find remote sketchbook tree node with Tree node ID: ${id}.`
      );
    }
    if (!CloudSketchbookTree.CloudSketchDirNode.is(node)) {
      throw new Error(
        `Remote sketchbook tree node expected to represent a directory but it did not. Tree node ID: ${id}.`
      );
    }
    try {
      await treeModel.sketchbookTree().pull({ node });
    } catch (err) {
      if (isNotFound(err)) {
        await treeModel.refresh();
        this.messageService.error(
          nls.localize(
            'arduino/newCloudSketch/notFound',
            "Could not pull the remote sketch '{0}'. It does not exist.",
            newSketch.name
          )
        );
        return undefined;
      }
      throw err;
    }
    return this.commandService.executeCommand(
      SketchbookCommands.OPEN_NEW_WINDOW.id,
      { node }
    );
  }

  private treeModelFrom(
    widget: SketchbookWidget
  ): CloudSketchbookTreeModel | undefined {
    const treeWidget = widget.getTreeWidget();
    if (treeWidget instanceof CloudSketchbookTreeWidget) {
      const model = treeWidget.model;
      if (model instanceof CloudSketchbookTreeModel) {
        return model;
      }
    }
    return undefined;
  }

  private async newSketchName(
    rootNode: CompositeTreeNode,
    initialValue?: string | undefined
  ): Promise<string | undefined> {
    const existingNames = rootNode.children
      .filter(CloudSketchbookTree.CloudSketchDirNode.is)
      .map(({ fileStat }) => fileStat.name);
    return new WorkspaceInputDialog(
      {
        title: nls.localize(
          'arduino/newCloudSketch/newSketchTitle',
          'Name of a new Remote Sketch'
        ),
        parentUri: CreateUri.root,
        initialValue,
        validate: (input) => {
          if (existingNames.includes(input)) {
            return nls.localize(
              'arduino/newCloudSketch/sketchAlreadyExists',
              "Remote sketch '{0}' already exists.",
              input
            );
          }
          // This is how https://create.arduino.cc/editor/ works when renaming a sketch.
          if (/^[0-9a-zA-Z_]{1,36}$/.test(input)) {
            return '';
          }
          return nls.localize(
            'arduino/newCloudSketch/invalidSketchName',
            'The name must consist of basic letters, numbers, or underscores. The maximum length is 36 characters.'
          );
        },
      },
      this.labelProvider
    ).open();
  }
}
export namespace NewCloudSketch {
  export namespace Commands {
    export const NEW_CLOUD_SKETCH: Command = {
      id: 'arduino-new-cloud-sketch',
    };
  }
}

function isConflict(err: unknown): boolean {
  return isErrorWithStatusOf(err, 409);
}
function isNotFound(err: unknown): boolean {
  return isErrorWithStatusOf(err, 404);
}
function isErrorWithStatusOf(
  err: unknown,
  status: number
): err is Error & { status: number } {
  if (err instanceof Error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const object = err as any;
    return 'status' in object && object.status === status;
  }
  return false;
}
