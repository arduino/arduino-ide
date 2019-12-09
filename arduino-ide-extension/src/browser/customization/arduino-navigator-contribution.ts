import { injectable, inject } from 'inversify';
import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { FileNavigatorContribution } from '@theia/navigator/lib/browser/navigator-contribution';
import { EditorMode } from '../editor-mode';

@injectable()
export class ArduinoNavigatorContribution extends FileNavigatorContribution {

    @inject(EditorMode)
    protected readonly editorMode: EditorMode;

    async initializeLayout(app: FrontendApplication): Promise<void> {
        if (this.editorMode.proMode) {
            return super.initializeLayout(app);
        }
    }

}
