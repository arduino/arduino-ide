import { inject, injectable } from 'inversify';
import { TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { OutputToolbarContribution } from '@theia/output/lib/browser/output-toolbar-contribution';
import { EditorMode } from '../editor-mode';

@injectable()
export class ArduinoOutputToolContribution extends OutputToolbarContribution {

    @inject(EditorMode)
    protected readonly editorMode: EditorMode;

    async registerToolbarItems(toolbarRegistry: TabBarToolbarRegistry): Promise<void> {
        if (this.editorMode.proMode) {
            super.registerToolbarItems(toolbarRegistry);
        }
    }

}
