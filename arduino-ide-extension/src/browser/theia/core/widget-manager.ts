import type { MaybePromise } from '@theia/core';
import type { Widget } from '@theia/core/lib/browser';
import { WidgetManager as TheiaWidgetManager } from '@theia/core/lib/browser/widget-manager';
import {
  inject,
  injectable,
  postConstruct,
} from '@theia/core/shared/inversify';
import { EditorWidget } from '@theia/editor/lib/browser';
import { OutputWidget } from '@theia/output/lib/browser/output-widget';
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
    this.sketchesServiceClient.onCurrentSketchDidChange((sketch) =>
      this.maybeSetWidgetUncloseable(
        sketch,
        ...Array.from(this.widgets.values())
      )
    );
  }

  override getOrCreateWidget<T extends Widget>(
    factoryId: string,
    options?: unknown
  ): Promise<T> {
    const unresolvedWidget = super.getOrCreateWidget<T>(factoryId, options);
    unresolvedWidget.then(async (widget) => {
      const sketch = await this.sketchesServiceClient.currentSketch();
      this.maybeSetWidgetUncloseable(sketch, widget);
    });
    return unresolvedWidget;
  }

  private maybeSetWidgetUncloseable(
    sketch: CurrentSketch,
    ...widgets: Widget[]
  ): void {
    const sketchFileUris =
      CurrentSketch.isValid(sketch) && new Set(Sketch.uris(sketch));
    for (const widget of widgets) {
      if (widget instanceof OutputWidget) {
        this.setWidgetUncloseable(widget); // TODO: https://arduino.slack.com/archives/C01698YT7S4/p1598011990133700
      } else if (widget instanceof EditorWidget) {
        // Make the editor un-closeable asynchronously.
        const uri = widget.editor.uri.toString();
        if (!!sketchFileUris && sketchFileUris.has(uri)) {
          this.setWidgetUncloseable(widget);
        }
      }
    }
  }

  private setWidgetUncloseable(widget: Widget): void {
    const { title } = widget;
    if (title.closable) {
      title.closable = false;
    }
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
