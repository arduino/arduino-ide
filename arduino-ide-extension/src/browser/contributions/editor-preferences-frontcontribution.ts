import { injectable, inject } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application-contribution';
import { PreferenceService } from '@theia/core/lib/browser';
import { EditorManager } from '@theia/editor/lib/browser/editor-manager';
import { MonacoEditor } from '@theia/monaco/lib/browser/monaco-editor';

@injectable()
export class EditorPreferencesFrontContribution implements FrontendApplicationContribution {
  @inject(PreferenceService)
  protected readonly preferences!: PreferenceService;

  @inject(EditorManager)
  protected readonly editorManager!: EditorManager;

  onStart(): void {
    // Listen to preference changes and apply them to all open editors
    this.preferences.onPreferenceChanged(({ preferenceName, newValue }) => {
      if (preferenceName === 'editor.fontFamily' || preferenceName === 'editor.fontSize') {
        this.applyEditorPreferences();
      }
    });
  }

  protected applyEditorPreferences(): void {
    try {
      const fontFamily = this.preferences.get<string>('editor.fontFamily');
      const fontSize = this.preferences.get<number>('editor.fontSize');

      for (const widget of this.editorManager.all) {
        const editor = widget.editor;
        if (editor && editor instanceof MonacoEditor) {
          const control = editor.getControl();
          try {
            control.updateOptions({
              fontFamily: fontFamily ?? undefined,
              fontSize: fontSize ?? undefined,
            });
            control.layout();
          } catch (e) {
            // Ignore errors
          }
        }
      }
    } catch (e) {
      // Ignore errors
    }
  }
}

