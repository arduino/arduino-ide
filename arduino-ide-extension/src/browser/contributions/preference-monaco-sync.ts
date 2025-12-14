import { injectable, inject } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application-contribution';
import { PreferenceService } from '@theia/core/lib/browser';
import { EditorManager } from '../theia/editor/editor-manager';
import { SettingsService } from '../dialogs/settings/settings';
import { MonacoEditor } from '@theia/monaco/lib/browser/monaco-editor';

@injectable()
export class PreferenceMonacoSyncContribution implements FrontendApplicationContribution {
  @inject(PreferenceService)
  protected readonly preferences!: PreferenceService;

  @inject(EditorManager)
  protected readonly editorManager!: EditorManager;

  @inject(SettingsService)
  protected readonly settingsService!: SettingsService;

  onStart(): void {
    // Listen to preference changes and apply to Monaco editors live
    this.preferences.onPreferenceChanged(({ preferenceName, newValue }) => {
      if (preferenceName === 'editor.fontFamily' || preferenceName === 'editor.fontSize') {
        this.applyToAllEditors();
      }
    });
    // Also listen to SettingsService changes (used by the Preferences dialog save flow)
    try {
      this.settingsService.onDidChange(() => this.applyToAllEditors());
    } catch {
      // no-op if not available
    }
  }

  protected applyToAllEditors(): void {
    try {
      const fontFamily = this.preferences.get<string>('editor.fontFamily');
      const fontSize = this.preferences.get<number>('editor.fontSize');

      for (const widget of this.editorManager.all) {
        const editor = widget.editor;
        if (editor instanceof MonacoEditor) {
          const control = editor.getControl();
          try {
            control.updateOptions({
              fontFamily: typeof fontFamily === 'string' ? fontFamily : undefined,
              fontSize: typeof fontSize === 'number' ? fontSize : undefined,
            });
            // Force a layout to ensure styles apply
            control.layout();
            // Also apply fontFamily and fontSize to the editor DOM node to force CSS-based font rendering
            try {
              const domNode = (control as any).getDomNode && (control as any).getDomNode();
              if (domNode) {
                if (typeof fontFamily === 'string') {
                  // Apply the preference string directly to the DOM node. Monaco accepts
                  // CSS font-family lists like "'Courier New', Monaco, monospace".
                  domNode.style.fontFamily = fontFamily;
                }
                if (typeof fontSize === 'number') {
                  domNode.style.fontSize = `${fontSize}px`;
                }
              }
            } catch (e) {
              // ignore DOM style errors
            }
          } catch (e) {
            // Swallow per-editor errors
            console.warn('Failed to update editor options', e);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to sync preferences to Monaco editors', e);
    }
  }
}
