import { promises as fs, constants } from 'fs';
import { injectable, inject } from '@theia/core/shared/inversify';
import { DefaultWorkspaceServer as TheiaDefaultWorkspaceServer } from '@theia/workspace/lib/node/default-workspace-server';
import { SketchesService } from '../../../common/protocol';
import { FileUri } from '@theia/core/lib/node';
import { IsTempSketch } from '../../is-temp-sketch';

@injectable()
export class DefaultWorkspaceServer extends TheiaDefaultWorkspaceServer {
  @inject(SketchesService)
  private readonly sketchesService: SketchesService;
  @inject(IsTempSketch)
  private readonly isTempSketch: IsTempSketch;

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

  protected override async writeToUserHome(
    data: RecentWorkspacePathsData
  ): Promise<void> {
    return super.writeToUserHome(this.filterTempSketches(data));
  }

  protected override async readRecentWorkspacePathsFromUserHome(): Promise<
    RecentWorkspacePathsData | undefined
  > {
    const data = await super.readRecentWorkspacePathsFromUserHome();
    return data ? this.filterTempSketches(data) : undefined;
  }

  protected override async removeOldUntitledWorkspaces(): Promise<void> {
    // NOOP
    // No need to remove untitled workspaces. IDE2 does not use workspaces.
  }

  private filterTempSketches(
    data: RecentWorkspacePathsData
  ): RecentWorkspacePathsData {
    const recentRoots = data.recentRoots.filter(
      (uri) => !this.isTempSketch.is(FileUri.fsPath(uri))
    );
    return {
      recentRoots,
    };
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

// Remove after https://github.com/eclipse-theia/theia/pull/11603
interface RecentWorkspacePathsData {
  recentRoots: string[];
}
