import * as monaco from '@theia/monaco-editor-core';

export function fullRange(model: monaco.editor.ITextModel): monaco.Range {
  const lastLine = model.getLineCount();
  const lastLineMaxColumn = model.getLineMaxColumn(lastLine);
  const end = new monaco.Position(lastLine, lastLineMaxColumn);
  return monaco.Range.fromPositions(new monaco.Position(1, 1), end);
}
