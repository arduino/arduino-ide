import { TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { CompositeTreeNode } from '@theia/core/lib/browser/tree';
import { codicon } from '@theia/core/lib/browser/widgets/widget';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { Emitter } from '@theia/core/lib/common/event';
import { nls } from '@theia/core/lib/common/nls';
import { inject, injectable } from '@theia/core/shared/inversify';
import type { AuthenticationSession } from '../../common/protocol/authentication-service';
import { AuthenticationClientService } from '../auth/authentication-client-service';
import { CreateApi } from '../create/create-api';
import { CreateUri } from '../create/create-uri';
import { Create } from '../create/typings';
import { WorkspaceInputDialog } from '../theia/workspace/workspace-input-dialog';
import { CloudSketchbookTree } from '../widgets/cloud-sketchbook/cloud-sketchbook-tree';
import { CloudSketchbookTreeModel } from '../widgets/cloud-sketchbook/cloud-sketchbook-tree-model';
import { CloudSketchbookTreeWidget } from '../widgets/cloud-sketchbook/cloud-sketchbook-tree-widget';
import { SketchbookCommands } from '../widgets/sketchbook/sketchbook-commands';
import { SketchbookWidget } from '../widgets/sketchbook/sketchbook-widget';
import { Command, CommandRegistry, Contribution, URI } from './contribution';

@injectable()
export class NewCloudSketch extends Contribution {
  @inject(CreateApi)
  private readonly createApi: CreateApi;

  @inject(AuthenticationClientService)
  private readonly authenticationService: AuthenticationClientService;

  private session: AuthenticationSession | undefined;
  private treeModel: CloudSketchbookTreeModel | undefined;
  private readonly onDidChangeEmitter = new Emitter<void>();
  private readonly toDisposeOnStop = new DisposableCollection(
    this.onDidChangeEmitter
  );

  override onReady(): void {
    this.toDisposeOnStop.push(
      this.authenticationService.onSessionDidChange((session) => {
        this.session = session;
        this.onDidChangeEmitter.fire();
      })
    );
    this.session = this.authenticationService.session;
    if (this.session) {
      this.onDidChangeEmitter.fire();
    }
  }

  onStop(): void {
    this.toDisposeOnStop.dispose();
  }

  override registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(NewCloudSketch.Commands.CREATE_SKETCH, {
      execute: () => this.createNewSketch(),
      isEnabled: () => !!this.session && !!this.treeModel,
    });

    registry.registerCommand(NewCloudSketch.Commands.CREATE_SKETCH_TOOLBAR, {
      execute: () =>
        this.commandService.executeCommand(
          NewCloudSketch.Commands.CREATE_SKETCH.id
        ),
      isVisible: (arg: unknown) => {
        if (this.session && arg instanceof SketchbookWidget) {
          const treeWidget = arg.getTreeWidget();
          if (treeWidget instanceof CloudSketchbookTreeWidget) {
            const model = treeWidget.model;
            if (model instanceof CloudSketchbookTreeModel) {
              this.treeModel = model;
            }
          }
          return (
            !!this.treeModel && treeWidget instanceof CloudSketchbookTreeWidget
          );
        }
        return false;
      },
    });
  }

  override registerToolbarItems(registry: TabBarToolbarRegistry): void {
    registry.registerItem({
      id: NewCloudSketch.Commands.CREATE_SKETCH_TOOLBAR.id,
      command: NewCloudSketch.Commands.CREATE_SKETCH_TOOLBAR.id,
      tooltip: NewCloudSketch.Commands.CREATE_SKETCH_TOOLBAR.label,
      onDidChange: this.onDidChangeEmitter.event,
    });
  }

  private async createNewSketch(
    initialValue?: string | undefined
  ): Promise<URI | undefined> {
    const newSketchName = await this.newSketchName(initialValue);
    if (!newSketchName) {
      return undefined;
    }
    const rootNode = this.rootNode();
    if (!rootNode) {
      return undefined;
    }

    if (!this.treeModel) {
      return undefined;
    }

    let result: Create.Sketch | undefined | 'conflict';
    try {
      result = await this.createApi.createSketch(newSketchName);
    } catch (err) {
      if ('status' in err && err.status === 409) {
        result = 'conflict';
      } else {
        throw err;
      }
    } finally {
      if (result) {
        await this.treeModel.updateRoot();
        await this.treeModel.refresh();
      }
    }

    if (result === 'conflict') {
      return this.createNewSketch(newSketchName);
    }

    if (result) {
      const newSketch = result;
      const yes = nls.localize('vscode/extensionsUtils/yes', 'Yes');
      this.messageService
        .info(
          nls.localize(
            'arduino/cloud/openNewSketch',
            'Do you want to pull the new remote sketch {0} and open it in a new window?',
            newSketchName
          ),
          yes
        )
        .then(async (answer) => {
          if (!this.treeModel) {
            return;
          }
          if (answer === yes) {
            const node = this.treeModel.getNode(
              CreateUri.toUri(newSketch).path.toString()
            );
            if (!node) {
              return;
            }
            if (CloudSketchbookTree.CloudSketchDirNode.is(node)) {
              await this.treeModel.sketchbookTree().pull({ node });
              return this.commandService.executeCommand(
                SketchbookCommands.OPEN_NEW_WINDOW.id,
                { node }
              );
            }
          }
        });
    }
    return undefined;
  }

  private async newSketchName(
    initialValue?: string | undefined
  ): Promise<string | undefined> {
    const rootNode = this.rootNode();
    if (!rootNode) {
      return undefined;
    }
    const existingNames = rootNode.children
      .filter(CloudSketchbookTree.CloudSketchDirNode.is)
      .map(({ fileStat }) => fileStat.name);
    return new WorkspaceInputDialog(
      {
        title: nls.localize(
          'arduino/cloud/newSketchTitle',
          'Name of a new remote sketch'
        ),
        parentUri: CreateUri.root,
        initialValue,
        validate: (input) => {
          if (!input) {
            return nls.localize(
              'arduino/cloud/invalidSketchName',
              'The name must consist of basic letters, numbers, or underscores. The maximum length is 37 characters.'
            );
          }
          if (existingNames.includes(input)) {
            return nls.localize(
              'arduino/cloud/sketchAlreadyExists',
              "Remote sketch '{0}' already exists.",
              input
            );
          }
          // This is how https://create.arduino.cc/editor/ works when renaming a sketch.
          if (/^[0-9a-zA-Z_]{1,37}$/.test(input)) {
            return '';
          }
          return nls.localize(
            'arduino/cloud/invalidSketchName',
            'The name must consist of basic letters, numbers, or underscores. The maximum length is 37 characters.'
          );
        },
      },
      this.labelProvider
    ).open();
  }

  private rootNode(): CompositeTreeNode | undefined {
    if (!this.session) {
      return undefined;
    }
    if (!this.treeModel) {
      return undefined;
    }
    if (!CompositeTreeNode.is(this.treeModel.root)) {
      return undefined;
    }
    return this.treeModel.root;
  }
}
export namespace NewCloudSketch {
  export namespace Commands {
    export const CREATE_SKETCH = Command.toLocalizedCommand(
      {
        id: 'arduino-cloud-sketchbook--create-sketch',
        label: 'New Remote Sketch...',
      },
      'arduino/cloud/createSketch'
    ) as Command & { label: string };

    export const CREATE_SKETCH_TOOLBAR: Command & { label: string } = {
      ...CREATE_SKETCH,
      id: `${CREATE_SKETCH.id}-toolbar`,
      iconClass: codicon('new-folder'),
    };
  }
}
