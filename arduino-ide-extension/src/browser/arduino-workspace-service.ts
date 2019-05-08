import { WorkspaceService } from "@theia/workspace/lib/browser/workspace-service";
import { injectable, inject } from "inversify";
import { WorkspaceServer } from "@theia/workspace/lib/common";
import { FileSystem } from "@theia/filesystem/lib/common";
import URI from "@theia/core/lib/common/uri";

/**
 * This is workaround to have custom frontend binding for the default workspace, although we
 * already have a custom binding for the backend.
 */
@injectable()
export class AWorkspaceService  extends WorkspaceService {

    @inject(WorkspaceServer)
    protected readonly workspaceServer: WorkspaceServer;

    @inject(FileSystem)
    protected readonly fileSystem: FileSystem;

    protected async getDefaultWorkspacePath(): Promise<string | undefined> {
        const result = await super.getDefaultWorkspacePath();
        if (result) {
            return result;
        }
        const userHome = await this.fileSystem.getCurrentUserHome();
        if (userHome) {
            // The backend has created this location if it was missing.
            return new URI(userHome.uri).resolve('Arduino-PoC').resolve('workspace').toString();
        }
        return undefined;
    }

}