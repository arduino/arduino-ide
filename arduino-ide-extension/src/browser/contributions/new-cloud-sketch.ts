import { KeybindingRegistry } from '@theia/core/lib/browser/keybinding';
import { CompositeTreeNode } from '@theia/core/lib/browser/tree';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { MenuModelRegistry } from '@theia/core/lib/common/menu';
import { Progress } from '@theia/core/lib/common/message-service-protocol';
import { nls } from '@theia/core/lib/common/nls';
import { injectable } from '@theia/core/shared/inversify';
import { CreateUri } from '../create/create-uri';
import { isConflict } from '../create/typings';
import { ArduinoMenus } from '../menu/arduino-menus';
import {
  TaskFactoryImpl,
  WorkspaceInputDialogWithProgress,
} from '../theia/workspace/workspace-input-dialog';
import { CloudSketchbookTree } from '../widgets/cloud-sketchbook/cloud-sketchbook-tree';
import { CloudSketchbookTreeModel } from '../widgets/cloud-sketchbook/cloud-sketchbook-tree-model';
import { SketchbookCommands } from '../widgets/sketchbook/sketchbook-commands';
import { Command, CommandRegistry, Sketch } from './contribution';
import {
  CloudSketchContribution,
  pullingSketch,
  sketchAlreadyExists,
  synchronizingSketchbook,
} from './cloud-contribution';

@injectable()
export class NewCloudSketch extends CloudSketchContribution {
  private readonly toDispose = new DisposableCollection();

  override onReady(): void {
    this.toDispose.pushAll([
      this.createFeatures.onDidChangeEnabled(() => this.menuManager.update()),
      this.createFeatures.onDidChangeSession(() => this.menuManager.update()),
    ]);
    if (this.createFeatures.session) {
      this.menuManager.update();
    }
  }

  onStop(): void {
    this.toDispose.dispose();
  }

  override registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(NewCloudSketch.Commands.NEW_CLOUD_SKETCH, {
      execute: () => this.createNewSketch(true),
      isEnabled: () => Boolean(this.createFeatures.session),
      isVisible: () => this.createFeatures.enabled,
    });
  }

  override registerMenus(registry: MenuModelRegistry): void {
    registry.registerMenuAction(ArduinoMenus.FILE__SKETCH_GROUP, {
      commandId: NewCloudSketch.Commands.NEW_CLOUD_SKETCH.id,
      label: nls.localize('arduino/cloudSketch/new', 'New Cloud Sketch'),
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
    skipShowErrorMessageOnOpen: boolean,
    initialValue?: string | undefined
  ): Promise<void> {
    const treeModel = await this.treeModel();
    if (treeModel) {
      const rootNode = treeModel.root;
      return this.openWizard(
        rootNode,
        treeModel,
        skipShowErrorMessageOnOpen,
        initialValue
      );
    }
  }

  private async openWizard(
    rootNode: CompositeTreeNode,
    treeModel: CloudSketchbookTreeModel,
    skipShowErrorMessageOnOpen: boolean,
    initialValue?: string | undefined
  ): Promise<void> {
    const existingNames = rootNode.children
      .filter(CloudSketchbookTree.CloudSketchDirNode.is)
      .map(({ fileStat }) => fileStat.name);
    const taskFactory = new TaskFactoryImpl((value) =>
      this.createNewSketchWithProgress(treeModel, value)
    );
    try {
      const dialog = new WorkspaceInputDialogWithProgress(
        {
          title: nls.localize(
            'arduino/newCloudSketch/newSketchTitle',
            'Name of the new Cloud Sketch'
          ),
          parentUri: CreateUri.root,
          initialValue,
          validate: (input) => {
            if (existingNames.includes(input)) {
              return sketchAlreadyExists(input);
            }
            return Sketch.validateCloudSketchFolderName(input) ?? '';
          },
        },
        this.labelProvider,
        taskFactory
      );
      await dialog.open(skipShowErrorMessageOnOpen);
      if (dialog.taskResult) {
        this.openInNewWindow(dialog.taskResult);
      }
    } catch (err) {
      if (isConflict(err)) {
        await treeModel.refresh();
        return this.createNewSketch(false, taskFactory.value ?? initialValue);
      }
      throw err;
    }
  }

  private createNewSketchWithProgress(
    treeModel: CloudSketchbookTreeModel,
    value: string
  ): (
    progress: Progress
  ) => Promise<CloudSketchbookTree.CloudSketchDirNode | undefined> {
    return async (progress: Progress) => {
      progress.report({
        message: nls.localize(
          'arduino/cloudSketch/creating',
          "Creating cloud sketch '{0}'...",
          value
        ),
      });
      const sketch = await this.createApi.createSketch(value);
      progress.report({ message: synchronizingSketchbook });
      await treeModel.refresh();
      progress.report({ message: pullingSketch(sketch.name) });
      const node = await this.pull(sketch);
      return node;
    };
  }

  private openInNewWindow(
    node: CloudSketchbookTree.CloudSketchDirNode
  ): Promise<void> {
    return this.commandService.executeCommand(
      SketchbookCommands.OPEN_NEW_WINDOW.id,
      { node }
    );
  }
}
export namespace NewCloudSketch {
  export namespace Commands {
    export const NEW_CLOUD_SKETCH: Command = {
      id: 'arduino-new-cloud-sketch',
    };
  }
}
