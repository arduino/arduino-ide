import { injectable, inject } from 'inversify';
import { MessageService } from '@theia/core';
import { LabelProvider } from '@theia/core/lib/browser';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import { ConfigService } from '../common/protocol/config-service';
import { SketchesService } from '../common/protocol/sketches-service';
import { ArduinoWorkspaceRootResolver } from './arduino-workspace-resolver';
import { EditorMode } from './editor-mode';

@injectable()
export class ArduinoWorkspaceService extends WorkspaceService {

    @inject(SketchesService)
    protected readonly sketchService: SketchesService;

    @inject(ConfigService)
    protected readonly configService: ConfigService;

    @inject(LabelProvider)
    protected readonly labelProvider: LabelProvider;

    @inject(EditorMode)
    protected readonly editorMode: EditorMode;

    @inject(MessageService)
    protected readonly messageService: MessageService;

    private workspaceUri?: Promise<string | undefined>;

    protected getDefaultWorkspaceUri(): Promise<string | undefined> {
        if (this.workspaceUri) {
            // Avoid creating a new sketch twice
            return this.workspaceUri;
        }
        this.workspaceUri = (async () => {
            try {
                const hash = window.location.hash;
                const [recentWorkspaces, recentSketches] = await Promise.all([
                    this.server.getRecentWorkspaces(),
                    this.sketchService.getSketches().then(sketches => sketches.map(s => s.uri))
                ]);
                const toOpen = await new ArduinoWorkspaceRootResolver({
                    isValid: this.isValid.bind(this)
                }).resolve({ hash, recentWorkspaces, recentSketches });
                if (toOpen) {
                    const { uri } = toOpen;
                    await this.server.setMostRecentlyUsedWorkspace(uri);
                    return toOpen.uri;
                }
                const { sketchDirUri } = (await this.configService.getConfiguration());
                this.logger.info(`No valid workspace URI found. Creating new sketch in ${sketchDirUri}`)
                return (await this.sketchService.createNewSketch(sketchDirUri)).uri;
            } catch (err) {
                this.logger.fatal(`Failed to determine the sketch directory: ${err}`)
                this.messageService.error(
                    'There was an error creating the sketch directory. ' +
                    'See the log for more details. ' +
                    'The application will probably not work as expected.')
                return super.getDefaultWorkspaceUri();
            }
        })();
        return this.workspaceUri;
    }

    private async isValid(uri: string): Promise<boolean> {
        const exists = await this.fileSystem.exists(uri);
        if (!exists) {
            return false;
        }
        // The workspace root location must exist. However, when opening a workspace root in pro-mode,
        // the workspace root must not be a sketch folder. It can be the default sketch directory, or any other directories, for instance.
        if (this.editorMode.proMode) {
            return true;
        }
        const sketchFolder = await this.sketchService.isSketchFolder(uri);
        return sketchFolder;
    }

}
