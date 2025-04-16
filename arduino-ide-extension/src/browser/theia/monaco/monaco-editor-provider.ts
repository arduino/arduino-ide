import { LOCKED_CLASS, lock } from '@theia/core/lib/browser/widgets/widget';
import {
  Disposable,
  DisposableCollection,
} from '@theia/core/lib/common/disposable';
import URI from '@theia/core/lib/common/uri';
import { Title, Widget } from '@theia/core/shared/@phosphor/widgets';
import { inject, injectable } from '@theia/core/shared/inversify';
import { EditorWidget } from '@theia/editor/lib/browser/editor-widget';
import * as monaco from '@theia/monaco-editor-core';
import type { ReferencesModel } from '@theia/monaco-editor-core/esm/vs/editor/contrib/gotoSymbol/browser/referencesModel';
import {
  EditorServiceOverrides,
  MonacoEditor,
} from '@theia/monaco/lib/browser/monaco-editor';
import { MonacoEditorProvider as TheiaMonacoEditorProvider } from '@theia/monaco/lib/browser/monaco-editor-provider';
import { SketchesServiceClientImpl } from '../../sketches-service-client-impl';

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

  protected override async doCreateEditor(
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
    const referencesController: any = control.getContribution(
      'editor.contrib.referencesController'
    );
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

// Theia cannot dynamically set an editor to writable once it was readonly.
export function maybeUpdateReadOnlyState(
  widget: EditorWidget,
  isReadOnly: (uri: string | URI | monaco.Uri) => boolean
): void {
  const editor = widget.editor;
  if (!(editor instanceof MonacoEditor)) {
    return;
  }
  const model = editor.document;
  const oldReadOnly = model.readOnly;
  const resource = model['resource'];
  const newReadOnly = Boolean(resource.readOnly) || isReadOnly(resource.uri);
  if (oldReadOnly !== newReadOnly) {
    editor.getControl().updateOptions({ readOnly: newReadOnly });
    if (newReadOnly) {
      lock(widget.title);
    } else {
      unlock(widget.title);
    }
  }
}

function unlock(title: Title<Widget>): void {
  title.className = title.className.replace(LOCKED_CLASS, '').trim();
}
