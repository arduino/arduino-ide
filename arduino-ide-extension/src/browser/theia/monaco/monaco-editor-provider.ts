import { inject, injectable } from 'inversify';
import URI from '@theia/core/lib/common/uri';
import {
  Disposable,
  DisposableCollection,
} from '@theia/core/lib/common/disposable';
import { EditorServiceOverrides, MonacoEditor } from '@theia/monaco/lib/browser/monaco-editor';
import { MonacoEditorProvider as TheiaMonacoEditorProvider } from '@theia/monaco/lib/browser/monaco-editor-provider';
import { SketchesServiceClientImpl } from '../../../common/protocol/sketches-service-client-impl';
import * as monaco from '@theia/monaco-editor-core';
import type { ReferencesModel } from '@theia/monaco-editor-core/esm/vs/editor/contrib/gotoSymbol/browser/referencesModel';


type CancelablePromise = Promise<ReferencesModel> & {
  cancel: () => void;
};
interface EditorFactory {
  (
    override: EditorServiceOverrides,
    toDispose: DisposableCollection
  ): Promise<MonacoEditor>;
}

@injectable()
export class MonacoEditorProvider extends TheiaMonacoEditorProvider {
  @inject(SketchesServiceClientImpl)
  protected readonly sketchesServiceClient: SketchesServiceClientImpl;

  protected async doCreateEditor(
    uri: URI,
    factory: EditorFactory
  ): Promise<MonacoEditor> {
    const editor = await super.doCreateEditor(uri, factory);
    const toDispose = new DisposableCollection();
    toDispose.push(this.installCustomReferencesController(editor));
    toDispose.push(editor.onDispose(() => toDispose.dispose()));
    return editor;
  }

  private installCustomReferencesController(editor: MonacoEditor): Disposable {
    const control = editor.getControl();
    const referencesController: any = control.getContribution('editor.contrib.referencesController');
    const originalToggleWidget = referencesController.toggleWidget;
    const toDispose = new DisposableCollection();
    const toDisposeBeforeToggleWidget = new DisposableCollection();
    referencesController.toggleWidget = (
      range: monaco.Range,
      modelPromise: CancelablePromise,
      peekMode: boolean
    ) => {
      toDisposeBeforeToggleWidget.dispose();
      originalToggleWidget.bind(referencesController)(
        range,
        modelPromise,
        peekMode
      );
      if (referencesController._widget) {
        if ('onDidClose' in referencesController._widget) {
          toDisposeBeforeToggleWidget.push(
            (referencesController._widget as any).onDidClose(() =>
              toDisposeBeforeToggleWidget.dispose()
            )
          );
        }
        const preview = (referencesController._widget as any)
          ._preview as monaco.editor.ICodeEditor;
        if (preview) {
          toDisposeBeforeToggleWidget.push(
            preview.onDidChangeModel(() => this.updateReadOnlyState(preview))
          );
          this.updateReadOnlyState(preview);
        }
      }
    };
    toDispose.push(
      Disposable.create(() => toDisposeBeforeToggleWidget.dispose())
    );
    toDispose.push(
      Disposable.create(
        () => (referencesController.toggleWidget = originalToggleWidget)
      )
    );
    return toDispose;
  }

  private updateReadOnlyState(
    editor: monaco.editor.ICodeEditor | undefined
  ): void {
    if (!editor) {
      return;
    }
    const model = editor.getModel();
    if (!model) {
      return;
    }
    const readOnly = this.sketchesServiceClient.isReadOnly(model.uri);
    editor.updateOptions({ readOnly });
  }
}
