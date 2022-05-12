import { injectable, inject } from 'inversify';
import { CommandService } from '@theia/core/lib/common/command';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import { FrontendApplication as TheiaFrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { FileSystemExt, SketchesService } from '../../../common/protocol';
import { ArduinoCommands } from '../../arduino-commands';
import { duration } from '../../../common/decorators';

@injectable()
export class FrontendApplication extends TheiaFrontendApplication {
  @inject(FileSystemExt)
  protected readonly fileService: FileSystemExt;

  @inject(WorkspaceService)
  protected readonly workspaceService: WorkspaceService;

  @inject(CommandService)
  protected readonly commandService: CommandService;

  @inject(SketchesService)
  protected readonly sketchesService: SketchesService;

  @duration()
  protected async initializeLayout(): Promise<void> {
    this.openSketchFiles().then(() => super.initializeLayout());
  }

  private async openSketchFiles(): Promise<void> {
    const roots = await this.workspaceService.roots;
    for (const root of roots) {
      const exists = await this.fileService.exists(root.resource.toString());
      if (exists) {
        this.sketchesService.markAsRecentlyOpened(root.resource.toString()); // no await, will get the notification later and rebuild the menu
        this.commandService.executeCommand(
          ArduinoCommands.OPEN_SKETCH_FILES.id,
          root.resource
        );
      }
    }
  }
}
