import { injectable, inject } from 'inversify';
import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { OutlineViewContribution as TheiaOutlineViewContribution } from '@theia/outline-view/lib/browser/outline-view-contribution';
import { EditorMode } from '../../editor-mode';

@injectable()
export class OutlineViewContribution extends TheiaOutlineViewContribution {

    @inject(EditorMode)
    protected readonly editorMode: EditorMode;

    constructor() {
        super();
        this.options.defaultWidgetOptions = {
            area: 'left',
            rank: 500
        };
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        if (this.editorMode.proMode) {
            return super.initializeLayout(app);
        }
    }

}

