import { CommandService } from '@theia/core/lib/common/command';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable } from '@theia/core/shared/inversify';
import { WorkspaceDeleteHandler as TheiaWorkspaceDeleteHandler } from '@theia/workspace/lib/browser/workspace-delete-handler';
import { DeleteSketch } from '../../contributions/delete-sketch';
import {
  CurrentSketch,
  SketchesServiceClientImpl,
} from '../../sketches-service-client-impl';
import { FileDeleteOptions } from '@theia/filesystem/lib/common/files';
import { ConfirmDialog } from '../dialogs/theiaDialogs/dialogs';

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

  protected override confirm(
    uris: URI[],
    options: FileDeleteOptions
  ): Promise<boolean | undefined> {
    let title = uris.length === 1 ? '文件' : '多个文件';
    if (options.useTrash) {
      title = `将${title}移至垃圾箱`;
    } else {
      title = `删除${title}`;
    }
    return new ConfirmDialog({
      title,
      msg: this.getConfirmMessage(uris),
    }).open();
  }

  protected override getConfirmMessage(uris: URI[]): string | HTMLElement {
    const dirty = this.getDirty(uris);
    if (dirty.length) {
      if (dirty.length === 1) {
        return `您真的要删除未保存更改的${dirty[0].path.base}吗？`;
      }
      return `您真的要删除未保存更改的${dirty.length}文件吗？`;
    }
    if (uris.length === 1) {
      return `您真的要删除${uris[0].path.base}吗？`;
    }
    if (uris.length > 10) {
      return `您真的要删除所有${uris.length}选定的文件吗？`;
    }
    const messageContainer = document.createElement('div');
    messageContainer.textContent = '';
    const list = document.createElement('ul');
    list.style.listStyleType = 'none';
    for (const uri of uris) {
      const listItem = document.createElement('li');
      listItem.textContent = uri.path.base;
      list.appendChild(listItem);
    }
    messageContainer.appendChild(list);
    return messageContainer;
  }
}
