import { WorkspaceService } from "@theia/workspace/lib/browser/workspace-service";
import { injectable, inject } from "inversify";
import { WorkspaceServer } from "@theia/workspace/lib/common";
import { FileSystem, FileStat } from "@theia/filesystem/lib/common";
import URI from "@theia/core/lib/common/uri";
import { SketchFactory } from "./sketch-factory";

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

    @inject(SketchFactory)
    protected readonly sketchFactory: SketchFactory;

    protected async getDefaultWorkspacePath(): Promise<string | undefined> {
        let result = await super.getDefaultWorkspacePath();
        if (!result) {
            const userHome = await this.fileSystem.getCurrentUserHome();
            if (!userHome) {
                return;
            }

            // The backend has created this location if it was missing.
            result = new URI(userHome.uri).resolve('Arduino-PoC').resolve('Sketches').toString();
        }

        const stat = await this.fileSystem.getFileStat(result);
        if (!stat) {
            // workspace does not exist yet, create it
            await this.fileSystem.createFolder(result);
            await this.sketchFactory.createNewSketch(new URI(result));
        }

        return result;
    }

    protected async setWorkspace(workspaceStat: FileStat | undefined): Promise<void> {
        await super.setWorkspace(workspaceStat);
    }

}