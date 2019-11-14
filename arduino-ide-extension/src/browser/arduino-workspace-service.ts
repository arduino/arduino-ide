import { injectable, inject } from 'inversify';
import { LabelProvider } from '@theia/core/lib/browser';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import { ConfigService } from '../common/protocol/config-service';
import { SketchesService } from '../common/protocol/sketches-service';
import { ArduinoWorkspaceRootResolver } from './arduino-workspace-resolver';
import { EditorMode as EditorMode } from './arduino-frontend-contribution';

@injectable()
export class ArduinoWorkspaceService extends WorkspaceService {

    @inject(SketchesService)
    protected readonly sketchService: SketchesService;

    @inject(ConfigService)
    protected readonly configService: ConfigService;

    @inject(LabelProvider)
    protected readonly labelProvider: LabelProvider;

    async getDefaultWorkspaceUri(): Promise<string | undefined> {
        const [hash, recentWorkspaces, recentSketches] = await Promise.all([
            window.location.hash,
            this.sketchService.getSketches().then(sketches => sketches.map(({ uri }) => uri)),
            this.server.getRecentWorkspaces()
        ]);
        const toOpen = await new ArduinoWorkspaceRootResolver({
            isValid: this.isValid.bind(this)
        }).resolve({
            hash,
            recentWorkspaces,
            recentSketches
        });
        if (toOpen) {
            const { uri } = toOpen;
            await this.server.setMostRecentlyUsedWorkspace(uri);
            return toOpen.uri;
        }
        const { sketchDirUri } = (await this.configService.getConfiguration());
        return (await this.sketchService.createNewSketch(sketchDirUri)).uri;
    }

    private async isValid(uri: string): Promise<boolean> {
        const exists = await this.fileSystem.exists(uri);
        if (!exists) {
            return false;
        }
        // The workspace root location must exist. However, when opening a workspace root in pro-mode,
        // the workspace root must not be a sketch folder. It can be the default sketch directory, or any other directories, for instance.
        if (EditorMode.IN_PRO_MODE) {
            return true;
        }
        const sketchFolder = await this.sketchService.isSketchFolder(uri);
        return sketchFolder;
    }

}
