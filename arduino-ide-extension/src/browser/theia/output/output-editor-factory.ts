import { injectable } from '@theia/core/shared/inversify';
import { MonacoEditor } from '@theia/monaco/lib/browser/monaco-editor';
import { MonacoEditorModel } from '@theia/monaco/lib/browser/monaco-editor-model';
import { OutputEditorFactory as TheiaOutputEditorFactory } from '@theia/output/lib/browser/output-editor-factory';

@injectable()
export class OutputEditorFactory extends TheiaOutputEditorFactory {
  protected override createOptions(
    model: MonacoEditorModel,
    defaultOptions: MonacoEditor.IOptions
  ): MonacoEditor.IOptions {
    const options = super.createOptions(model, defaultOptions);
    return {
      ...options,
      // Taken from https://github.com/microsoft/vscode/blob/35b971c92d210face8c446a1c6f1e470ad2bcb54/src/vs/workbench/contrib/output/browser/outputView.ts#L211-L214
      // To fix https://github.com/arduino/arduino-ide/issues/1210
      unicodeHighlight: {
        nonBasicASCII: false,
        invisibleCharacters: false,
        ambiguousCharacters: false,
      },
    };
  }
}
