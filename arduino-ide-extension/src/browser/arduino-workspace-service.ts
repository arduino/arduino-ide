import { injectable, inject } from 'inversify';
// import { toUnix } from 'upath';
// import URI from '@theia/core/lib/common/uri';
// import { isWindows } from '@theia/core/lib/common/os';
import { LabelProvider } from '@theia/core/lib/browser';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import { ConfigService } from '../common/protocol/config-service';
import { SketchesService } from '../common/protocol/sketches-service';
// import { ArduinoAdvancedMode } from './arduino-frontend-contribution';
import { ArduinoWorkspaceRootResolver } from './arduino-workspace-resolver';
import { ArduinoAdvancedMode } from './arduino-frontend-contribution';

/**
 * This is workaround to have custom frontend binding for the default workspace, although we
 * already have a custom binding for the backend.
 * 
 * The following logic is used for determining the default workspace location:
 * - #hash exists in location?
 *  - Yes
 *   - `validateHash`. Is valid sketch location?
 *    - Yes
 *     - Done.
 *    - No
 *     - `checkHistoricalWorkspaceRoots`, `try open last modified sketch`,create new sketch`.
 *  - No
 *   - `checkHistoricalWorkspaceRoots`, `try open last modified sketch`, `create new sketch`.
 */
@injectable()
export class ArduinoWorkspaceService extends WorkspaceService {

    @inject(SketchesService)
    protected readonly sketchService: SketchesService;

    @inject(ConfigService)
    protected readonly configService: ConfigService;

    @inject(LabelProvider)
    protected readonly labelProvider: LabelProvider;

    async getDefaultWorkspacePath(): Promise<string | undefined> {
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
        return (await this.sketchService.createNewSketch()).uri;
    }

    private async isValid(uri: string): Promise<boolean> {
        const exists = await this.fileSystem.exists(uri);
        if (!exists) {
            return false;
        }
        // The workspace root location must exist. However, when opening a workspace root in pro-mode,
        // the workspace root must not be a sketch folder. It can be the default sketch directory, or any other directories, for instance.
        if (!ArduinoAdvancedMode.TOGGLED) {
            return true;
        }
        const sketchFolder = await this.sketchService.isSketchFolder(uri);
        return sketchFolder;
    }

}
