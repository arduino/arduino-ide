import { SaveableWidget } from '@theia/core/lib/browser/saveable';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { inject, injectable } from '@theia/core/shared/inversify';
import { FileSystemFrontendContribution } from '@theia/filesystem/lib/browser/filesystem-frontend-contribution';
import { FileChangeType } from '@theia/filesystem/lib/common/files';
import { CurrentSketch } from '../../common/protocol/sketches-service-client-impl';
import { Sketch, SketchContribution, URI } from './contribution';
import { OpenSketchFiles } from './open-sketch-files';

@injectable()
export class SketchFilesTracker extends SketchContribution {
  @inject(FileSystemFrontendContribution)
  private readonly fileSystemFrontendContribution: FileSystemFrontendContribution;
  private readonly toDisposeOnStop = new DisposableCollection();

  override onStart(): void {
    this.fileSystemFrontendContribution.onDidChangeEditorFile(
      ({ type, editor }) => {
        if (type === FileChangeType.DELETED) {
          const editorWidget = editor;
          if (SaveableWidget.is(editorWidget)) {
            editorWidget.closeWithoutSaving();
          } else {
            editorWidget.close();
          }
        }
      }
    );
  }

  override onReady(): void {
    this.sketchServiceClient.currentSketch().then(async (sketch) => {
      if (
        CurrentSketch.isValid(sketch) &&
        !(await this.sketchService.isTemp(sketch))
      ) {
        this.toDisposeOnStop.push(this.fileService.watch(new URI(sketch.uri)));
        this.toDisposeOnStop.push(
          this.fileService.onDidFilesChange(async (event) => {
            for (const { type, resource } of event.changes) {
              if (
                type === FileChangeType.ADDED &&
                resource.parent.toString() === sketch.uri
              ) {
                const reloadedSketch = await this.sketchService.loadSketch(
                  sketch.uri
                );
                if (Sketch.isInSketch(resource, reloadedSketch)) {
                  this.commandService.executeCommand(
                    OpenSketchFiles.Commands.ENSURE_OPENED.id,
                    resource.toString(),
                    true,
                    {
                      mode: 'open',
                    }
                  );
                }
              }
            }
          })
        );
      }
    });
  }

  onStop(): void {
    this.toDisposeOnStop.dispose();
  }
}
