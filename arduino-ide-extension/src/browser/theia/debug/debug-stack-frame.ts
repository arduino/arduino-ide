import { WidgetOpenerOptions } from '@theia/core/lib/browser/widget-open-handler';
import { Range } from '@theia/core/shared/vscode-languageserver-types';
import { DebugStackFrame as TheiaDebugStackFrame } from '@theia/debug/lib/browser/model/debug-stack-frame';
import { EditorWidget } from '@theia/editor/lib/browser/editor-widget';

export class DebugStackFrame extends TheiaDebugStackFrame {
  override async open(
    options: WidgetOpenerOptions = {
      mode: 'reveal',
    }
  ): Promise<EditorWidget | undefined> {
    if (!this.source) {
      return undefined;
    }
    const { line, column, endLine, endColumn, source } = this.raw;
    if (!source) {
      return undefined;
    }
    // create selection based on VS Code
    // https://github.com/eclipse-theia/theia/issues/11880
    const selection = Range.create(
      line,
      column,
      endLine || line,
      endColumn || column
    );
    this.source.open({
      ...options,
      selection,
    });
  }
}
