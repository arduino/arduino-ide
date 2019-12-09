import { injectable, inject } from 'inversify';
import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { OutlineViewContribution } from '@theia/outline-view/lib/browser/outline-view-contribution';
import { EditorMode } from '../editor-mode';

@injectable()
export class ArduinoOutlineViewContribution extends OutlineViewContribution {

    @inject(EditorMode)
    protected readonly editorMode: EditorMode;

    async initializeLayout(app: FrontendApplication): Promise<void> {
        if (this.editorMode.proMode) {
            return super.initializeLayout(app);
        }
    }

}

