import { promises as fs, constants } from 'fs';
import { injectable, inject } from '@theia/core/shared/inversify';
import { ILogger } from '@theia/core/lib/common/logger';
import { DefaultWorkspaceServer as TheiaDefaultWorkspaceServer } from '@theia/workspace/lib/node/default-workspace-server';
import { ConfigService } from '../../../common/protocol/config-service';
import { SketchesService } from '../../../common/protocol';
import { FileUri } from '@theia/core/lib/node';

@injectable()
export class DefaultWorkspaceServer extends TheiaDefaultWorkspaceServer {
  @inject(ConfigService)
  protected readonly configService: ConfigService;

  @inject(ILogger)
  protected readonly logger: ILogger;

  @inject(SketchesService)
  private readonly sketchesService: SketchesService;

  override async onStart(): Promise<void> {
    // NOOP
    // No need to remove untitled workspaces. IDE2 does not use workspaces.
  }

  override async getMostRecentlyUsedWorkspace(): Promise<string | undefined> {
    const uri = await super.getMostRecentlyUsedWorkspace();
    if (!uri) {
      const { uri } = await this.sketchesService.createNewSketch();
      return uri;
    }
    return uri;
  }

  /**
   * This is the async re-implementation of the default Theia behavior.
   */
  override async getRecentWorkspaces(): Promise<string[]> {
    const listUri: string[] = [];
    const data = await this.readRecentWorkspacePathsFromUserHome();
    if (data && data.recentRoots) {
      await Promise.all(
        data.recentRoots
          .filter((element) => Boolean(element))
          .map(async (element) => {
            if (await this.exists(element)) {
              listUri.push(element);
            }
          })
      );
    }
    return listUri;
  }

  private async exists(uri: string): Promise<boolean> {
    try {
      await fs.access(FileUri.fsPath(uri), constants.R_OK | constants.W_OK);
      return true;
    } catch {
      return false;
    }
  }
}
