import { MaybePromise } from '@theia/core';
import { inject, injectable } from '@theia/core/shared/inversify';
import * as monaco from '@theia/monaco-editor-core';
import { Formatter } from '../../common/protocol/formatter';
import { InoSelector } from '../selectors';
import { Contribution, URI } from './contribution';

@injectable()
export class Format
  extends Contribution
  implements
    monaco.languages.DocumentRangeFormattingEditProvider,
    monaco.languages.DocumentFormattingEditProvider
{
  @inject(Formatter)
  private readonly formatter: Formatter;

  override onStart(): MaybePromise<void> {
    monaco.languages.registerDocumentRangeFormattingEditProvider(
      InoSelector,
      this
    );
    monaco.languages.registerDocumentFormattingEditProvider(InoSelector, this);
  }
  async provideDocumentRangeFormattingEdits(
    model: monaco.editor.ITextModel,
    range: monaco.Range,
    options: monaco.languages.FormattingOptions,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _token: monaco.CancellationToken
  ): Promise<monaco.languages.TextEdit[]> {
    const text = await this.format(model, range, options);
    return [{ range, text }];
  }

  async provideDocumentFormattingEdits(
    model: monaco.editor.ITextModel,
    options: monaco.languages.FormattingOptions,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _token: monaco.CancellationToken
  ): Promise<monaco.languages.TextEdit[]> {
    const range = model.getFullModelRange();
    const text = await this.format(model, range, options);
    return [{ range, text }];
  }

  /**
   * From the currently opened workspaces (IDE2 has always one), it calculates all possible
   * folder locations where the `.clang-format` file could be.
   */
  private formatterConfigFolderUris(model: monaco.editor.ITextModel): string[] {
    const editorUri = new URI(model.uri.toString());
    return this.workspaceService
      .tryGetRoots()
      .map(({ resource }) => resource)
      .filter((workspaceUri) => workspaceUri.isEqualOrParent(editorUri))
      .map((uri) => uri.toString());
  }

  private format(
    model: monaco.editor.ITextModel,
    range: monaco.Range,
    options: monaco.languages.FormattingOptions
  ): Promise<string> {
    console.info(
      `Formatting ${model.uri.toString()} [Range: ${JSON.stringify(
        range.toJSON()
      )}]`
    );
    const content = model.getValueInRange(range);
    const formatterConfigFolderUris = this.formatterConfigFolderUris(model);
    return this.formatter.format({
      content,
      formatterConfigFolderUris,
      options,
    });
  }
}
