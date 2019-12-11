import { injectable, inject } from 'inversify';
import { FileSystem } from '@theia/filesystem/lib/common/filesystem';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { EditorMode } from '../editor-mode';
import { ArduinoFrontendContribution } from '../arduino-frontend-contribution';

@injectable()
export class ArduinoFrontendApplication extends FrontendApplication {

    @inject(FileSystem)
    protected readonly fileSystem: FileSystem;

    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    @inject(ArduinoFrontendContribution)
    protected readonly frontendContribution: ArduinoFrontendContribution;

    @inject(EditorMode)
    protected readonly editorMode: EditorMode;

    protected async initializeLayout(): Promise<void> {
        return super.initializeLayout().then(() => {
            // If not in PRO mode, we open the sketch file with all the related files.
            // Otherwise, we reuse the workbench's restore functionality and we do not open anything at all.
            // TODO: check `otherwise`. Also, what if we check for opened editors, instead of blindly opening them?
            if (!this.editorMode.proMode) {
                this.workspaceService.roots.then(roots => {
                    for (const root of roots) {
                        this.fileSystem.exists(root.uri).then(exists => {
                            if (exists) {
                                this.frontendContribution.openSketchFiles(root.uri);
                            }
                        });
                    }
                });
            }
        });
    }

}
