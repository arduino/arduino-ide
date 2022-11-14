import { DialogError } from '@theia/core/lib/browser/dialogs';
import { KeybindingRegistry } from '@theia/core/lib/browser/keybinding';
import { LabelProvider } from '@theia/core/lib/browser/label-provider';
import { CompositeTreeNode } from '@theia/core/lib/browser/tree';
import { Widget } from '@theia/core/lib/browser/widgets/widget';
import { CancellationTokenSource } from '@theia/core/lib/common/cancellation';
import {
  Disposable,
  DisposableCollection,
} from '@theia/core/lib/common/disposable';
import { MenuModelRegistry } from '@theia/core/lib/common/menu';
import {
  Progress,
  ProgressUpdate,
} from '@theia/core/lib/common/message-service-protocol';
import { nls } from '@theia/core/lib/common/nls';
import { inject, injectable } from '@theia/core/shared/inversify';
import { WorkspaceInputDialogProps } from '@theia/workspace/lib/browser/workspace-input-dialog';
import { v4 } from 'uuid';
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
  ): Promise<unknown> {
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
    return this.openWizard(rootNode, treeModel, initialValue);
  }

  private withProgress(
    value: string,
    treeModel: CloudSketchbookTreeModel
  ): (progress: Progress) => Promise<unknown> {
    return async (progress: Progress) => {
      let result: Create.Sketch | undefined | 'conflict';
      try {
        progress.report({
          message: nls.localize(
            'arduino/cloudSketch/creating',
            "Creating remote sketch '{0}'...",
            value
          ),
        });
        result = await this.createApi.createSketch(value);
      } catch (err) {
        if (isConflict(err)) {
          result = 'conflict';
        } else {
          throw err;
        }
      } finally {
        if (result) {
          progress.report({
            message: nls.localize(
              'arduino/cloudSketch/synchronizing',
              "Synchronizing sketchbook, pulling '{0}'...",
              value
            ),
          });
          await treeModel.refresh();
        }
      }
      if (result === 'conflict') {
        return this.createNewSketch(value);
      }
      if (result) {
        return this.open(treeModel, result);
      }
      return undefined;
    };
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

  private async openWizard(
    rootNode: CompositeTreeNode,
    treeModel: CloudSketchbookTreeModel,
    initialValue?: string | undefined
  ): Promise<unknown> {
    const existingNames = rootNode.children
      .filter(CloudSketchbookTree.CloudSketchDirNode.is)
      .map(({ fileStat }) => fileStat.name);
    return new NewCloudSketchDialog(
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
      this.labelProvider,
      (value) => this.withProgress(value, treeModel)
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

@injectable()
class NewCloudSketchDialog extends WorkspaceInputDialog {
  constructor(
    @inject(WorkspaceInputDialogProps)
    protected override readonly props: WorkspaceInputDialogProps,
    @inject(LabelProvider)
    protected override readonly labelProvider: LabelProvider,
    private readonly withProgress: (
      value: string
    ) => (progress: Progress) => Promise<unknown>
  ) {
    super(props, labelProvider);
  }
  protected override async accept(): Promise<void> {
    if (!this.resolve) {
      return;
    }
    this.acceptCancellationSource.cancel();
    this.acceptCancellationSource = new CancellationTokenSource();
    const token = this.acceptCancellationSource.token;
    const value = this.value;
    const error = await this.isValid(value, 'open');
    if (token.isCancellationRequested) {
      return;
    }
    if (!DialogError.getResult(error)) {
      this.setErrorMessage(error);
    } else {
      const spinner = document.createElement('div');
      spinner.classList.add('spinner');
      const disposables = new DisposableCollection();
      try {
        this.toggleButtons(true);
        disposables.push(Disposable.create(() => this.toggleButtons(false)));

        const closeParent = this.closeCrossNode.parentNode;
        closeParent?.removeChild(this.closeCrossNode);
        disposables.push(
          Disposable.create(() => {
            closeParent?.appendChild(this.closeCrossNode);
          })
        );

        this.errorMessageNode.classList.add('progress');
        disposables.push(
          Disposable.create(() =>
            this.errorMessageNode.classList.remove('progress')
          )
        );

        const errorParent = this.errorMessageNode.parentNode;
        errorParent?.insertBefore(spinner, this.errorMessageNode);
        disposables.push(
          Disposable.create(() => errorParent?.removeChild(spinner))
        );

        const cancellationSource = new CancellationTokenSource();
        const progress: Progress = {
          id: v4(),
          cancel: () => cancellationSource.cancel(),
          report: (update: ProgressUpdate) => {
            this.setProgressMessage(update);
          },
          result: Promise.resolve(value),
        };
        await this.withProgress(value)(progress);
      } finally {
        disposables.dispose();
      }
      this.resolve(value);
      Widget.detach(this);
    }
  }

  private toggleButtons(disabled: boolean): void {
    if (this.acceptButton) {
      this.acceptButton.disabled = disabled;
    }
    if (this.closeButton) {
      this.closeButton.disabled = disabled;
    }
  }

  private setProgressMessage(update: ProgressUpdate): void {
    if (update.work && update.work.done === update.work.total) {
      this.errorMessageNode.innerText = '';
    } else {
      if (update.message) {
        this.errorMessageNode.innerText = update.message;
      }
    }
  }
}
