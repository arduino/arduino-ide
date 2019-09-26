import { injectable, inject } from 'inversify';
import { toUnix } from 'upath';
import URI from '@theia/core/lib/common/uri';
import { isWindows } from '@theia/core/lib/common/os';
import { LabelProvider } from '@theia/core/lib/browser';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import { ConfigService } from '../common/protocol/config-service';
import { SketchesService } from '../common/protocol/sketches-service';
import { ArduinoAdvancedMode } from './arduino-frontend-contribution';

/**
 * This is workaround to have custom frontend binding for the default workspace, although we
 * already have a custom binding for the backend.
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
        const url = new URL(window.location.href);
        // If `sketch` is set and valid, we use it as is.
        // `sketch` is set as an encoded URI string.
        const sketch = url.searchParams.get('sketch');
        if (sketch) {
            const sketchDirUri = new URI(sketch).toString();
            if (await this.sketchService.isSketchFolder(sketchDirUri)) {
                if (await this.configService.isInSketchDir(sketchDirUri)) {
                    if (ArduinoAdvancedMode.TOGGLED) {
                        return (await this.configService.getConfiguration()).sketchDirUri
                    } else {
                        return sketchDirUri;
                    }
                }
                return (await this.configService.getConfiguration()).sketchDirUri
            }
        }

        const { hash } = window.location;
        // Note: here, the `uriPath` was defined as new `URI(yourValidFsPath).path` so we have to map it to a valid FS path first.
        // This is important for Windows only and a NOOP on UNIX.
        if (hash.length > 1 && hash.startsWith('#')) {
            let uri = this.toUri(hash.slice(1));
            if (uri && await this.sketchService.isSketchFolder(uri)) {
                return this.openSketchFilesInNewWindow(uri);
            }
        }

        // If we cannot acquire the FS path from the `location.hash` we try to get the most recently used workspace that was a valid sketch folder.
        // XXX: Check if `WorkspaceServer#getRecentWorkspaces()` returns with inverse-chrolonolgical order.
        const candidateUris = await this.server.getRecentWorkspaces();
        for (const uri of candidateUris) {
            if (await this.sketchService.isSketchFolder(uri)) {
                return this.openSketchFilesInNewWindow(uri);
            }
        }

        const config = await this.configService.getConfiguration();
        const { sketchDirUri } = config;
        const stat = await this.fileSystem.getFileStat(sketchDirUri);
        if (!stat) {
            // The folder for the workspace root does not exist yet, create it.
            await this.fileSystem.createFolder(sketchDirUri);
            await this.sketchService.createNewSketch(sketchDirUri);
        }

        const sketches = await this.sketchService.getSketches(sketchDirUri);
        if (!sketches.length) {
            const sketch = await this.sketchService.createNewSketch(sketchDirUri);
            sketches.unshift(sketch);
        }

        const uri = sketches[0].uri;
        this.server.setMostRecentlyUsedWorkspace(uri);
        this.openSketchFilesInNewWindow(uri);
        if (ArduinoAdvancedMode.TOGGLED && await this.configService.isInSketchDir(uri)) {
            return (await this.configService.getConfiguration()).sketchDirUri;
        }
        return uri;
    }

    private toUri(uriPath: string | undefined): string | undefined {
        if (uriPath) {
            return new URI(toUnix(uriPath.slice(isWindows && uriPath.startsWith('/') ? 1 : 0))).withScheme('file').toString();
        }
        return undefined;
    }

    async openSketchFilesInNewWindow(uri: string): Promise<string> {
        const url = new URL(window.location.href);
        const currentSketch = url.searchParams.get('sketch');
        // Nothing to do if we want to open the same sketch which is already opened.
        const sketchUri = new URI(uri);
        if (!!currentSketch && new URI(currentSketch).toString() === sketchUri.toString()) {
            return uri;
        }

        url.searchParams.set('sketch', uri);
        // If in advanced mode, we root folder of all sketch folders as the hash, so the default workspace will be opened on the root
        // Note: we set the `new URI(myValidUri).path.toString()` as the `hash`. See:
        // - https://github.com/eclipse-theia/theia/blob/8196e9dcf9c8de8ea0910efeb5334a974f426966/packages/workspace/src/browser/workspace-service.ts#L143 and
        // - https://github.com/eclipse-theia/theia/blob/8196e9dcf9c8de8ea0910efeb5334a974f426966/packages/workspace/src/browser/workspace-service.ts#L423
        if (ArduinoAdvancedMode.TOGGLED && await this.configService.isInSketchDir(uri)) {
            url.hash = new URI((await this.configService.getConfiguration()).sketchDirUri).path.toString();
        } else {
            // Otherwise, we set the hash as is
            const hash = await this.fileSystem.getFsPath(sketchUri.toString());
            if (hash) {
                url.hash = sketchUri.path.toString()
            }
        }

        // Preserve the current window if the `sketch` is not in the `searchParams`.
        if (!currentSketch) {
            setTimeout(() => window.location.href = url.toString(), 100);
            return uri;
        }
        this.windowService.openNewWindow(url.toString());
        return uri;
    }

}
