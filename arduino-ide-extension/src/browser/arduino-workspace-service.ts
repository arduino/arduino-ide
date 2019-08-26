import { WorkspaceService } from "@theia/workspace/lib/browser/workspace-service";
import { injectable, inject } from "inversify";
import { WorkspaceServer } from "@theia/workspace/lib/common";
import { FileSystem, FileStat } from "@theia/filesystem/lib/common";
import URI from "@theia/core/lib/common/uri";
import { SketchFactory } from "./sketch-factory";
import { ConfigService } from "../common/protocol/config-service";

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

    @inject(ConfigService)
    protected readonly configService: ConfigService;

    protected async getDefaultWorkspacePath(): Promise<string | undefined> {
        let result = await super.getDefaultWorkspacePath();
        if (!result) {
            const config = await this.configService.getConfiguration();
            result = config.sketchDirPath;
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