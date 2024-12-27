import { inject, injectable } from '@theia/core/shared/inversify';
import URI from '@theia/core/lib/common/uri';
import { EditorWidget } from '@theia/editor/lib/browser';
import type { NavigatableWidgetOptions } from '@theia/core/lib/browser';
import { EditorWidgetFactory as TheiaEditorWidgetFactory } from '@theia/editor/lib/browser/editor-widget-factory';
import {
  CurrentSketch,
  SketchesServiceClientImpl,
} from '../../sketches-service-client-impl';
import { SketchesService, Sketch } from '../../../common/protocol';

@injectable()
export class EditorWidgetFactory extends TheiaEditorWidgetFactory {
  @inject(SketchesService)
  private readonly sketchesService: SketchesService;

  @inject(SketchesServiceClientImpl)
  private readonly sketchesServiceClient: SketchesServiceClientImpl;

  protected override async createEditor(
    uri: URI,
    options?: NavigatableWidgetOptions
  ): Promise<EditorWidget> {
    const newEditor = await this.constructEditor(uri);

    this.setLabels1(newEditor, uri);
    const labelListener = this.labelProvider.onDidChange((event) => {
      if (event.affects(uri)) {
        this.setLabels1(newEditor, uri);
      }
    });
    newEditor.onDispose(() => labelListener.dispose());

    newEditor.id = EditorWidgetFactory.createID(uri, options?.counter);

    newEditor.title.closable = true;
    return this.maybeUpdateCaption(newEditor);
  }

  protected override async constructEditor(uri: URI): Promise<EditorWidget> {
    const textEditor = await this.editorProvider(uri);
    return new EditorWidget(textEditor, this.selectionService);
  }

  protected async maybeUpdateCaption(
    widget: EditorWidget
  ): Promise<EditorWidget> {
    const sketch = await this.sketchesServiceClient.currentSketch();
    const { uri } = widget.editor;
    if (CurrentSketch.isValid(sketch) && Sketch.isInSketch(uri, sketch)) {
      const isTemp = await this.sketchesService.isTemp(sketch);
      if (isTemp) {
        widget.title.caption = `未保存的 – ${this.labelProvider.getName(uri)}`;
      }
    }
    return widget;
  }

  private setLabels1(editor: EditorWidget, uri: URI): void {
    editor.title.caption = uri.path.fsPath();
    if (editor.editor.isReadonly) {
      editor.title.caption += ` • 只读`;
    }
    const icon = this.labelProvider.getIcon(uri);
    editor.title.label = this.labelProvider.getName(uri);
    editor.title.iconClass = icon + ' file-icon';
  }
}
