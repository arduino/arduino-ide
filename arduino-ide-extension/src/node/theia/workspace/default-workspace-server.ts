import { injectable, inject } from 'inversify';
import { ILogger } from '@theia/core/lib/common/logger';
import { DefaultWorkspaceServer as TheiaDefaultWorkspaceServer } from '@theia/workspace/lib/node/default-workspace-server';
import { ConfigService } from '../../../common/protocol/config-service';

@injectable()
export class DefaultWorkspaceServer extends TheiaDefaultWorkspaceServer {
  @inject(ConfigService)
  protected readonly configService: ConfigService;

  @inject(ILogger)
  protected readonly logger: ILogger;

  async onStart(): Promise<void> {
    super.onStart(); // no await
  }
}
