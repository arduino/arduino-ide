import { inject, injectable } from 'inversify';
import URI from '@theia/core/lib/common/uri';
import { FileSystem } from '@theia/filesystem/lib/common';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import { WorkspaceServiceExt } from './workspace-service-ext';

/**
 * This is a workaround to be able to inject the workspace service to the backend with its service path.
 */
@injectable()
export class WorkspaceServiceExtImpl implements WorkspaceServiceExt {

    @inject(FileSystem)
    protected readonly fileSystem: FileSystem;

    @inject(WorkspaceService)
    protected readonly delegate: WorkspaceService;

    async roots(): Promise<string[]> {
        const stats = await this.delegate.roots;
        return stats.map(stat => stat.uri);
    }

    async defaultWorkspaceUri(): Promise<string> {
        const home = await this.fileSystem.getCurrentUserHome();
        if (home) {
            return new URI(home.uri).resolve('Arduino-PoC').resolve('workspace').toString();
        }
        throw new Error(`Could not locate current user's home folder.`);
    }

    async defaultDownloadsDirUri(): Promise<string> {
        const home = await this.fileSystem.getCurrentUserHome();
        if (home) {
            return new URI(home.uri).resolve('Arduino-PoC').resolve('downloads').toString();
        }
        throw new Error(`Could not locate current user's home folder.`);
    }

    async defaultDataDirUri(): Promise<string> {
        const home = await this.fileSystem.getCurrentUserHome();
        if (home) {
            return new URI(home.uri).resolve('Arduino-PoC').resolve('data').toString();
        }
        throw new Error(`Could not locate current user's home folder.`);
    }
}
