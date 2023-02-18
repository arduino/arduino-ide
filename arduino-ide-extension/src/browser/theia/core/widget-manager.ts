import type { Widget } from '@theia/core/lib/browser';
import { WidgetManager as TheiaWidgetManager } from '@theia/core/lib/browser/widget-manager';
import {
  inject,
  injectable,
  postConstruct,
} from '@theia/core/shared/inversify';
import { EditorWidget } from '@theia/editor/lib/browser';
import { OutputWidget } from '@theia/output/lib/browser/output-widget';
import {
  CurrentSketch,
  SketchesServiceClientImpl,
} from '../../sketches-service-client-impl';

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
      CurrentSketch.isValid(sketch) &&
      new Set([sketch.mainFileUri, ...sketch.rootFolderFileUris]);
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
    // Show the dirty indicator on uncloseable widgets when hovering over the title. Instead of showing the `X` for close.
    const uncloseableClass = 'a-mod-uncloseable';
    if (!title.className.includes(uncloseableClass)) {
      title.className += title.className + ` ${uncloseableClass}`;
    }
  }
}
