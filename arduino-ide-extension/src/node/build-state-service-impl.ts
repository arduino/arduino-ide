import { injectable } from '@theia/core/shared/inversify';
import type {
  BuildState,
  BuildStateService,
} from '../common/protocol/build-state-service';

@injectable()
export class BuildStateServiceImpl implements BuildStateService {
  private lastBuild: BuildState | undefined;

  async getLastBuild(): Promise<BuildState | undefined> {
    return this.lastBuild;
  }

  async setLastBuild(state: BuildState): Promise<void> {
    this.lastBuild = state;
  }
}
