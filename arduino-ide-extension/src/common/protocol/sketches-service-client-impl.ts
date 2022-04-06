import { inject, injectable } from 'inversify';
import URI from '@theia/core/lib/common/uri';
import { Emitter } from '@theia/core/lib/common/event';
import { notEmpty } from '@theia/core/lib/common/objects';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { MessageService } from '@theia/core/lib/common/message-service';
import { FileChangeType } from '@theia/filesystem/lib/common/files';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application';
import { Sketch, SketchesService } from '../../common/protocol';
import { ConfigService } from './config-service';
import { SketchContainer } from './sketches-service';
import {
  ARDUINO_CLOUD_FOLDER,
  REMOTE_SKETCHBOOK_FOLDER,
} from '../../browser/utils/constants';
import * as monaco from '@theia/monaco-editor-core';

const READ_ONLY_FILES = ['sketch.json'];
const READ_ONLY_FILES_REMOTE = ['thingProperties.h', 'thingsProperties.h'];

@injectable()
export class SketchesServiceClientImpl
  implements FrontendApplicationContribution
{
  @inject(FileService)
  protected readonly fileService: FileService;

  @inject(MessageService)
  protected readonly messageService: MessageService;

  @inject(SketchesService)
  protected readonly sketchService: SketchesService;

  @inject(WorkspaceService)
  protected readonly workspaceService: WorkspaceService;

  @inject(ConfigService)
  protected readonly configService: ConfigService;

  protected toDispose = new DisposableCollection();
  protected sketches = new Map<string, Sketch>();
  protected sketchbookDidChangeEmitter = new Emitter<{
    created: Sketch[];
    removed: Sketch[];
  }>();
  readonly onSketchbookDidChange = this.sketchbookDidChangeEmitter.event;

  onStart(): void {
    this.configService.getConfiguration().then(({ sketchDirUri }) => {
      this.sketchService
        .getSketches({ uri: sketchDirUri })
        .then((container) => {
          const sketchbookUri = new URI(sketchDirUri);
          for (const sketch of SketchContainer.toArray(container)) {
            this.sketches.set(sketch.uri, sketch);
          }
          this.toDispose.push(
            this.fileService.watch(new URI(sketchDirUri), {
              recursive: true,
              excludes: [],
            })
          );
          this.toDispose.push(
            this.fileService.onDidFilesChange(async (event) => {
              for (const { type, resource } of event.changes) {
                // We track main sketch files changes only. // TODO: check sketch folder changes. One can rename the folder without renaming the `.ino` file.
                if (sketchbookUri.isEqualOrParent(resource)) {
                  if (Sketch.isSketchFile(resource)) {
                    if (type === FileChangeType.ADDED) {
                      try {
                        const toAdd = await this.sketchService.loadSketch(
                          resource.parent.toString()
                        );
                        if (!this.sketches.has(toAdd.uri)) {
                          console.log(
                            `New sketch '${toAdd.name}' was crated in sketchbook '${sketchDirUri}'.`
                          );
                          this.sketches.set(toAdd.uri, toAdd);
                          this.fireSoon(toAdd, 'created');
                        }
                      } catch {}
                    } else if (type === FileChangeType.DELETED) {
                      const uri = resource.parent.toString();
                      const toDelete = this.sketches.get(uri);
                      if (toDelete) {
                        console.log(
                          `Sketch '${toDelete.name}' was removed from sketchbook '${sketchbookUri}'.`
                        );
                        this.sketches.delete(uri);
                        this.fireSoon(toDelete, 'removed');
                      }
                    }
                  }
                }
              }
            })
          );
        });
    });
  }

  onStop(): void {
    this.toDispose.dispose();
  }

  async currentSketch(): Promise<Sketch | undefined> {
    const sketches = (
      await Promise.all(
        this.workspaceService
          .tryGetRoots()
          .map(({ resource }) =>
            this.sketchService.getSketchFolder(resource.toString())
          )
      )
    ).filter(notEmpty);
    if (!sketches.length) {
      return undefined;
    }
    if (sketches.length > 1) {
      console.log(
        `Multiple sketch folders were found in the workspace. Falling back to the first one. Sketch folders: ${JSON.stringify(
          sketches
        )}`
      );
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

  private fireSoonHandle?: number;
  private bufferedSketchbookEvents: {
    type: 'created' | 'removed';
    sketch: Sketch;
  }[] = [];

  private fireSoon(sketch: Sketch, type: 'created' | 'removed'): void {
    this.bufferedSketchbookEvents.push({ type, sketch });

    if (typeof this.fireSoonHandle === 'number') {
      window.clearTimeout(this.fireSoonHandle);
    }

    this.fireSoonHandle = window.setTimeout(() => {
      const event: { created: Sketch[]; removed: Sketch[] } = {
        created: [],
        removed: [],
      };
      for (const { type, sketch } of this.bufferedSketchbookEvents) {
        if (type === 'created') {
          event.created.push(sketch);
        } else {
          event.removed.push(sketch);
        }
      }
      this.sketchbookDidChangeEmitter.fire(event);
      this.bufferedSketchbookEvents.length = 0;
    }, 100);
  }

  /**
   * `true` if the `uri` is not contained in any of the opened workspaces. Otherwise, `false`.
   */
  isReadOnly(uri: URI | monaco.Uri | string): boolean {
    const toCheck = uri instanceof URI ? uri : new URI(uri);
    if (toCheck.scheme === 'user-storage') {
      return false;
    }

    const isCloudSketch = toCheck
      .toString()
      .includes(`${REMOTE_SKETCHBOOK_FOLDER}/${ARDUINO_CLOUD_FOLDER}`);

    const filesToCheck = [
      ...READ_ONLY_FILES,
      ...(isCloudSketch ? READ_ONLY_FILES_REMOTE : []),
    ];

    if (filesToCheck.includes(toCheck?.path?.base)) {
      return true;
    }
    const readOnly = !this.workspaceService
      .tryGetRoots()
      .some(({ resource }) => resource.isEqualOrParent(toCheck));
    return readOnly;
  }
}
