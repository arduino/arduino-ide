import type { MaybePromise } from '@theia/core';
import type { Widget } from '@theia/core/lib/browser';
import { WidgetManager as TheiaWidgetManager } from '@theia/core/lib/browser/widget-manager';
import {
  inject,
  injectable,
  postConstruct,
} from '@theia/core/shared/inversify';
import { EditorWidget } from '@theia/editor/lib/browser';
import deepEqual = require('deep-equal');
import {
  CurrentSketch,
  SketchesServiceClientImpl,
} from '../../../common/protocol/sketches-service-client-impl';
import { Sketch } from '../../contributions/contribution';

@injectable()
export class WidgetManager extends TheiaWidgetManager {
  @inject(SketchesServiceClientImpl)
  private readonly sketchesServiceClient: SketchesServiceClientImpl;

  @postConstruct()
  protected init(): void {
    this.sketchesServiceClient.onCurrentSketchDidChange((currentSketch) => {
      if (CurrentSketch.isValid(currentSketch)) {
        const sketchFileUris = new Set(Sketch.uris(currentSketch));
        for (const widget of this.widgets.values()) {
          if (widget instanceof EditorWidget) {
            const uri = widget.editor.uri.toString();
            if (sketchFileUris.has(uri)) {
              widget.title.closable = false;
            }
          }
        }
      }
    });
  }

  /**
   * Customized to find any existing widget based on `options` deepEquals instead of string equals.
   * See https://github.com/eclipse-theia/theia/issues/11309.
   */
  protected override doGetWidget<T extends Widget>(
    key: string
  ): MaybePromise<T> | undefined {
    const pendingWidget = this.findExistingWidget<T>(key);
    if (pendingWidget) {
      return pendingWidget as MaybePromise<T>;
    }
    return undefined;
  }

  private findExistingWidget<T extends Widget>(
    key: string
  ): MaybePromise<T> | undefined {
    const parsed = this.parseJson(key);
    for (const [candidateKey, widget] of [
      ...this.widgetPromises.entries(),
      ...this.pendingWidgetPromises.entries(),
    ]) {
      const candidate = this.parseJson(candidateKey);
      if (deepEqual(candidate, parsed)) {
        return widget as MaybePromise<T>;
      }
    }
    return undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private parseJson(json: string): any {
    try {
      return JSON.parse(json);
    } catch (err) {
      console.log(`Failed to parse JSON: <${json}>.`, err);
      throw err;
    }
  }
}
