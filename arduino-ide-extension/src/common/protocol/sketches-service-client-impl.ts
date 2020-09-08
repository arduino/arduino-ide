import { inject, injectable } from 'inversify';
import URI from '@theia/core/lib/common/uri';
import { notEmpty } from '@theia/core/lib/common/objects';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { MessageService } from '@theia/core/lib/common/message-service';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import { Sketch, SketchesService } from '../../common/protocol';

@injectable()
export class SketchesServiceClientImpl {

    @inject(FileService)
    protected readonly fileService: FileService;

    @inject(MessageService)
    protected readonly messageService: MessageService;

    @inject(SketchesService)
    protected readonly sketchService: SketchesService;

    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    async currentSketch(): Promise<Sketch | undefined> {
        const sketches = (await Promise.all(this.workspaceService.tryGetRoots().map(({ resource }) => this.sketchService.getSketchFolder(resource.toString())))).filter(notEmpty);
        if (!sketches.length) {
            return undefined;
        }
        if (sketches.length > 1) {
            console.log(`Multiple sketch folders were found in the workspace. Falling back to the first one. Sketch folders: ${JSON.stringify(sketches)}`);
        }
        return sketches[0];
    }

    async currentSketchFile(): Promise<string | undefined> {
        const sketch = await this.currentSketch();
        if (sketch) {
            const uri = sketch.mainFileUri;
            const exists = await this.fileService.exists(new URI(uri));
            if (!exists) {
                this.messageService.warn(`Could not find sketch file: ${uri}`);
                return undefined;
            }
            return uri;
        }
        return undefined;
    }

}
