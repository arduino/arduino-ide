import { injectable } from '@theia/core/shared/inversify';
import { MonacoFormattingConflictsContribution as TheiaMonacoFormattingConflictsContribution } from '@theia/monaco/lib/browser/monaco-formatting-conflicts';

@injectable()
export class MonacoFormattingConflictsContribution extends TheiaMonacoFormattingConflictsContribution {
  override async initialize(): Promise<void> {
    // NOOP - does not register a custom formatting conflicts selects.
    // Does not get and set formatter preferences when selecting from multiple formatters.
    // Does not show quick-pick input when multiple formatters are available for the text model.
    // Uses the default behavior from VS Code: https://github.com/microsoft/vscode/blob/fb9f488e51af2e2efe95a34f24ca11e1b2a3f744/src/vs/editor/editor.api.ts#L19-L21
  }
}
