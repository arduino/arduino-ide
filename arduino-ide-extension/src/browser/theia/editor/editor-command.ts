import { injectable, postConstruct } from 'inversify';
import { EditorCommandContribution as TheiaEditorCommandContribution } from '@theia/editor/lib/browser/editor-command';

@injectable()
export class EditorCommandContribution extends TheiaEditorCommandContribution {

    @postConstruct()
    protected init(): void {
        // Workaround for https://github.com/eclipse-theia/theia/issues/8722.
        this.editorPreferences.onPreferenceChanged(({ preferenceName, newValue, oldValue }) => {
            if (preferenceName === 'editor.autoSave') {
                const autoSaveWasOnBeforeChange = !oldValue || oldValue === 'on';
                const autoSaveIsOnAfterChange = !newValue || newValue === 'on';
                if (!autoSaveWasOnBeforeChange && autoSaveIsOnAfterChange) {
                    this.shell.saveAll();
                }
            }
        });
    }

}
