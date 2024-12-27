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
    // 获取sketch的文件URI集合
    const sketchFileUris =
      CurrentSketch.isValid(sketch) &&
      new Set([sketch.mainFileUri, ...sketch.rootFolderFileUris]);
    // 遍历widgets
    for (const widget of widgets) {
      // 如果widget是OutputWidget类型
      if (widget instanceof OutputWidget) {
        this.setWidgetUncloseable(widget); // TODO: https://arduino.slack.com/archives/C01698YT7S4/p1598011990133700
        // 如果widget是EditorWidget类型
      } else if (widget instanceof EditorWidget) {
        // Make the editor un-closeable asynchronously.
        // 获取widget的URI
        const uri = widget.editor.uri.toString();
        // 如果sketchFileUris存在且包含uri
        if (!!sketchFileUris && sketchFileUris.has(uri)) {
          this.setWidgetUncloseable(widget);
        }
      }
    }
  }

  private setWidgetUncloseable(widget: Widget): void {
    const { title } = widget;
    //控制主部件是否有关闭按钮
    // if (title.closable) {
    //   title.closable = false;
    // }
    // 当鼠标悬停在标题上时，在不可关闭的小部件上显示脏指示器。而不是用“X”表示close.
    const uncloseableClass = 'a-mod-uncloseable';
    if (!title.className.includes(uncloseableClass)) {
      title.className += title.className + ` ${uncloseableClass}`;
    }
  }
}
