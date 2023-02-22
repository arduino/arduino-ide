import { CommandService } from '@theia/core/lib/common/command';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable } from '@theia/core/shared/inversify';
import { WorkspaceDeleteHandler as TheiaWorkspaceDeleteHandler } from '@theia/workspace/lib/browser/workspace-delete-handler';
import { DeleteSketch } from '../../contributions/delete-sketch';
import {
  CurrentSketch,
  SketchesServiceClientImpl,
} from '../../sketches-service-client-impl';

@injectable()
export class WorkspaceDeleteHandler extends TheiaWorkspaceDeleteHandler {
  @inject(CommandService)
  private readonly commandService: CommandService;
  @inject(SketchesServiceClientImpl)
  private readonly sketchesServiceClient: SketchesServiceClientImpl;

  override async execute(uris: URI[]): Promise<void> {
    const sketch = await this.sketchesServiceClient.currentSketch();
    if (!CurrentSketch.isValid(sketch)) {
      return;
    }
    // Deleting the main sketch file means deleting the sketch folder and all its content.
    if (uris.some((uri) => uri.toString() === sketch.mainFileUri)) {
      return this.commandService.executeCommand(
        DeleteSketch.Commands.DELETE_SKETCH.id,
        {
          toDelete: sketch,
          willNavigateAway: true,
        }
      );
    }
    // Individual file deletion(s).
    return super.execute(uris);
  }
}
