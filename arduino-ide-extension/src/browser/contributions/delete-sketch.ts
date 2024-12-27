import { Dialog } from '@theia/core/lib/browser/dialogs';
import { NavigatableWidget } from '@theia/core/lib/browser/navigatable-types';
import { ApplicationShell } from '@theia/core/lib/browser/shell/application-shell';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import type { MaybeArray } from '@theia/core/lib/common/types';
import URI from '@theia/core/lib/common/uri';
import type { Widget } from '@theia/core/shared/@phosphor/widgets';
import { inject, injectable } from '@theia/core/shared/inversify';
import { SketchesError } from '../../common/protocol';
import { Sketch } from '../contributions/contribution';
import { isNotFound } from '../create/typings';
import { Command, CommandRegistry } from './contribution';
import { CloudSketchContribution } from './cloud-contribution';
import { AppService } from '../app-service';

export interface DeleteSketchParams {
  /**
   * Either the URI of the sketch folder or the sketch to delete.
   */
  readonly toDelete: string | Sketch;
  /**
   * If `true`, the currently opened sketch is expected to be deleted.
   * Hence, the editors must be closed, the sketch will be scheduled
   * for deletion, and the browser window will close or navigate away.
   * If `false`, the sketch will be scheduled for deletion,
   * but the current window remains open. If `force`, the window will
   * navigate away, but IDE2 won't open any confirmation dialogs.
   */
  readonly willNavigateAway?: boolean | 'force';
}

@injectable()
export class DeleteSketch extends CloudSketchContribution {
  @inject(ApplicationShell)
  private readonly shell: ApplicationShell;
  @inject(WindowService)
  private readonly windowService: WindowService;
  @inject(AppService)
  private readonly appService: AppService;

  override registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(DeleteSketch.Commands.DELETE_SKETCH, {
      execute: (params: DeleteSketchParams) => this.deleteSketch(params),
    });
  }

  private async deleteSketch(params: DeleteSketchParams): Promise<void> {
    const { toDelete, willNavigateAway } = params;
    let sketch: Sketch;
    if (typeof toDelete === 'string') {
      const resolvedSketch = await this.loadSketch(toDelete);
      if (!resolvedSketch) {
        console.info(
          `Failed to load the sketch. It was not found at '${toDelete}'. Skipping deletion.`
        );
        return;
      }
      sketch = resolvedSketch;
    } else {
      sketch = toDelete;
    }
    if (!willNavigateAway) {
      this.scheduleDeletion(sketch);
      return;
    }
    const cloudUri = this.createFeatures.cloudUri(sketch);
    if (willNavigateAway !== 'force') {
      const { response } = await this.dialogService.showMessageBox({
        title: '删除',
        type: 'question',
        buttons: [Dialog.CANCEL, Dialog.OK],
        message: cloudUri
          ? `云草图‘${sketch.name}’将从Arduino服务器和本地缓存中永久删除。这种行为是不可逆转的。是否要删除当前草图？`
          : `草图“${sketch.name}”将被永久删除。这种行为是不可逆转的。是否要删除当前草图？`,
      });
      // cancel
      if (response === 0) {
        return;
      }
    }
    if (cloudUri) {
      const posixPath = cloudUri.path.toString();
      const cloudSketch = this.createApi.sketchCache.getSketch(posixPath);
      if (!cloudSketch) {
        throw new Error(
          `Cloud sketch with path '${posixPath}' was not cached. Cache: ${this.createApi.sketchCache.toString()}`
        );
      }
      try {
        // IDE2 cannot use DELETE directory as the server responses with HTTP 500 if it's missing.
        // https://github.com/arduino/arduino-ide/issues/1825#issuecomment-1406301406
        await this.createApi.deleteSketch(cloudSketch.path);
      } catch (err) {
        if (!isNotFound(err)) {
          throw err;
        } else {
          console.info(
            `Could not delete the cloud sketch with path '${posixPath}'. It does not exist.`
          );
        }
      }
    }
    await Promise.all([
      ...Sketch.uris(sketch).map((uri) =>
        this.closeWithoutSaving(new URI(uri))
      ),
    ]);
    this.windowService.setSafeToShutDown();
    this.scheduleDeletion(sketch);
    return window.close();
  }

  private scheduleDeletion(sketch: Sketch): void {
    this.appService.scheduleDeletion(sketch);
  }

  private async loadSketch(uri: string): Promise<Sketch | undefined> {
    try {
      const sketch = await this.sketchesService.loadSketch(uri);
      return sketch;
    } catch (err) {
      if (SketchesError.NotFound.is(err)) {
        return undefined;
      }
      throw err;
    }
  }

  // fix: https://github.com/eclipse-theia/theia/issues/12107
  private async closeWithoutSaving(uri: URI): Promise<void> {
    const affected = getAffected(this.shell.widgets, uri);
    const toClose = [...affected].map(([, widget]) => widget);
    await this.shell.closeMany(toClose, { save: false });
  }
}
export namespace DeleteSketch {
  export namespace Commands {
    export const DELETE_SKETCH: Command = {
      id: 'lingzhi-delete-sketch',
    };
  }
}

function getAffected<T extends Widget>(
  widgets: Iterable<T>,
  context: MaybeArray<URI>
): [URI, T & NavigatableWidget][] {
  const uris = Array.isArray(context) ? context : [context];
  const result: [URI, T & NavigatableWidget][] = [];
  for (const widget of widgets) {
    if (NavigatableWidget.is(widget)) {
      const resourceUri = widget.getResourceUri();
      if (resourceUri && uris.some((uri) => uri.isEqualOrParent(resourceUri))) {
        result.push([resourceUri, widget]);
      }
    }
  }
  return result;
}
