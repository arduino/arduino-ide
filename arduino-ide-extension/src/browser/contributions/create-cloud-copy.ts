import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { ApplicationShell } from '@theia/core/lib/browser/shell';
import type { Command, CommandRegistry } from '@theia/core/lib/common/command';
import { Progress } from '@theia/core/lib/common/message-service-protocol';
import { nls } from '@theia/core/lib/common/nls';
import { inject, injectable } from '@theia/core/shared/inversify';
import { Create } from '../create/typings';
import { ApplicationConnectionStatusContribution } from '../theia/core/connection-status-service';
import { CloudSketchbookTree } from '../widgets/cloud-sketchbook/cloud-sketchbook-tree';
import { SketchbookTree } from '../widgets/sketchbook/sketchbook-tree';
import { SketchbookTreeModel } from '../widgets/sketchbook/sketchbook-tree-model';
import { CloudSketchContribution, pushingSketch } from './cloud-contribution';
import {
  CreateNewCloudSketchCallback,
  NewCloudSketch,
  NewCloudSketchParams,
} from './new-cloud-sketch';
import { saveOntoCopiedSketch } from './save-as-sketch';

interface CreateCloudCopyParams {
  readonly model: SketchbookTreeModel;
  readonly node: SketchbookTree.SketchDirNode;
}
function isCreateCloudCopyParams(arg: unknown): arg is CreateCloudCopyParams {
  return (
    typeof arg === 'object' &&
    (<CreateCloudCopyParams>arg).model !== undefined &&
    (<CreateCloudCopyParams>arg).model instanceof SketchbookTreeModel &&
    (<CreateCloudCopyParams>arg).node !== undefined &&
    SketchbookTree.SketchDirNode.is((<CreateCloudCopyParams>arg).node)
  );
}

@injectable()
export class CreateCloudCopy extends CloudSketchContribution {
  @inject(ApplicationConnectionStatusContribution)
  private readonly connectionStatus: ApplicationConnectionStatusContribution;

  private shell: ApplicationShell;

  override onStart(app: FrontendApplication): void {
    this.shell = app.shell;
  }

  override registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(CreateCloudCopy.Commands.CREATE_CLOUD_COPY, {
      execute: (args: CreateCloudCopyParams) => this.createCloudCopy(args),
      isEnabled: (args: unknown) =>
        Boolean(this.createFeatures.session) && isCreateCloudCopyParams(args),
      isVisible: (args: unknown) =>
        Boolean(this.createFeatures.enabled) &&
        Boolean(this.createFeatures.session) &&
        this.connectionStatus.offlineStatus !== 'internet' &&
        isCreateCloudCopyParams(args),
    });
  }

  /**
   *  - creates new cloud sketch with the name of the params sketch,
   *  - pulls the cloud sketch,
   *  - copies files from params sketch to pulled cloud sketch in the cache folder,
   *  - pushes the cloud sketch, and
   *  - opens in new window.
   */
  private async createCloudCopy(params: CreateCloudCopyParams): Promise<void> {
    const sketch = await this.sketchesService.loadSketch(
      params.node.fileStat.resource.toString()
    );
    const callback: CreateNewCloudSketchCallback = async (
      newSketch: Create.Sketch,
      newNode: CloudSketchbookTree.CloudSketchDirNode,
      progress: Progress
    ) => {
      const treeModel = await this.treeModel();
      if (!treeModel) {
        throw new Error('Could not retrieve the cloud sketchbook tree model.');
      }

      progress.report({
        message: nls.localize(
          'arduino/createCloudCopy/copyingSketchFilesMessage',
          'Copying local sketch files...'
        ),
      });
      const localCacheFolderUri = newNode.uri.toString();
      await this.sketchesService.copy(sketch, {
        destinationUri: localCacheFolderUri,
        onlySketchFiles: true,
      });
      await saveOntoCopiedSketch(
        sketch,
        localCacheFolderUri,
        this.shell,
        this.editorManager
      );

      progress.report({ message: pushingSketch(newSketch.name) });
      await treeModel.sketchbookTree().push(newNode, true, true);
    };
    return this.commandService.executeCommand(
      NewCloudSketch.Commands.NEW_CLOUD_SKETCH.id,
      <NewCloudSketchParams>{
        initialValue: params.node.fileStat.name,
        callback,
        skipShowErrorMessageOnOpen: false,
      }
    );
  }
}

export namespace CreateCloudCopy {
  export namespace Commands {
    export const CREATE_CLOUD_COPY: Command = {
      id: 'lingzhi-create-cloud-copy',
      iconClass: 'fa fa-arduino-cloud-upload',
    };
  }
}
