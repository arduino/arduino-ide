import { inject, injectable } from 'inversify';
import { remote } from 'electron';
import URI from '@theia/core/lib/common/uri';
import { WorkspaceDeleteHandler as TheiaWorkspaceDeleteHandler } from '@theia/workspace/lib/browser/workspace-delete-handler';
import { SketchesServiceClientImpl } from '../../../common/protocol/sketches-service-client-impl';

@injectable()
export class WorkspaceDeleteHandler extends TheiaWorkspaceDeleteHandler {

    @inject(SketchesServiceClientImpl)
    protected readonly sketchesServiceClient: SketchesServiceClientImpl;

    async execute(uris: URI[]): Promise<void> {
        const sketch = await this.sketchesServiceClient.currentSketch();
        if (!sketch) {
            return;
        }
        // Deleting the main sketch file.
        if (uris.map(uri => uri.toString()).some(uri => uri === sketch.mainFileUri)) {
            const { response } = await remote.dialog.showMessageBox({
                title: 'Delete',
                type: 'question',
                buttons: ['Cancel', 'OK'],
                message: 'Do you want to delete the current sketch?'
            });
            if (response === 1) { // OK
                await Promise.all([...sketch.additionalFileUris, ...sketch.otherSketchFileUris, sketch.mainFileUri].map(uri => this.closeWithoutSaving(new URI(uri))));
                await this.fileService.delete(new URI(sketch.uri));
                window.close();
            }
            return;
        }
        return super.execute(uris);
    }

}
