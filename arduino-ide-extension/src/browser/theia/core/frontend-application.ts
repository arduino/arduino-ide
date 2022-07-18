import { injectable, inject } from '@theia/core/shared/inversify';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { CommandService } from '@theia/core/lib/common/command';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import { FrontendApplication as TheiaFrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { SketchesService } from '../../../common/protocol';
import { OpenSketchFiles } from '../../contributions/open-sketch-files';

@injectable()
export class FrontendApplication extends TheiaFrontendApplication {
  @inject(FileService)
  protected readonly fileService: FileService;

  @inject(WorkspaceService)
  protected readonly workspaceService: WorkspaceService;

  @inject(CommandService)
  protected readonly commandService: CommandService;

  @inject(SketchesService)
  protected readonly sketchesService: SketchesService;

  protected override async initializeLayout(): Promise<void> {
    await super.initializeLayout();
    this.workspaceService.roots.then(async (roots) => {
      for (const root of roots) {
        await this.commandService.executeCommand(
          OpenSketchFiles.Commands.OPEN_SKETCH_FILES.id,
          root.resource
        );
        this.sketchesService.markAsRecentlyOpened(root.resource.toString()); // no await, will get the notification later and rebuild the menu
      }
    });
  }
}
