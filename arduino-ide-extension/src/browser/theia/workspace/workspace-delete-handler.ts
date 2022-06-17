import { inject, injectable } from '@theia/core/shared/inversify';
import * as remote from '@theia/core/electron-shared/@electron/remote';
import URI from '@theia/core/lib/common/uri';
import { WorkspaceDeleteHandler as TheiaWorkspaceDeleteHandler } from '@theia/workspace/lib/browser/workspace-delete-handler';
import {
  CurrentSketch,
  SketchesServiceClientImpl,
} from '../../../common/protocol/sketches-service-client-impl';
import { nls } from '@theia/core/lib/common';

@injectable()
export class WorkspaceDeleteHandler extends TheiaWorkspaceDeleteHandler {
  @inject(SketchesServiceClientImpl)
  protected readonly sketchesServiceClient: SketchesServiceClientImpl;

  override async execute(uris: URI[]): Promise<void> {
    const sketch = await this.sketchesServiceClient.currentSketch();
    if (!CurrentSketch.isValid(sketch)) {
      return;
    }
    // Deleting the main sketch file.
    if (
      uris
        .map((uri) => uri.toString())
        .some((uri) => uri === sketch.mainFileUri)
    ) {
      const { response } = await remote.dialog.showMessageBox({
        title: nls.localize('vscode/fileActions/delete', 'Delete'),
        type: 'question',
        buttons: [
          nls.localize('vscode/issueMainService/cancel', 'Cancel'),
          nls.localize('vscode/issueMainService/ok', 'OK'),
        ],
        message: nls.localize(
          'theia/workspace/deleteCurrentSketch',
          'Do you want to delete the current sketch?'
        ),
      });
      if (response === 1) {
        // OK
        await Promise.all(
          [
            ...sketch.additionalFileUris,
            ...sketch.otherSketchFileUris,
            sketch.mainFileUri,
          ].map((uri) => this.closeWithoutSaving(new URI(uri)))
        );
        await this.fileService.delete(new URI(sketch.uri));
        window.close();
      }
      return;
    }
    return super.execute(uris);
  }
}
