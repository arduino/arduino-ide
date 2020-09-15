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

    protected async getWorkspaceURIFromCli(): Promise<string | undefined> {
        try {
            const config = await this.configService.getConfiguration();
            return config.sketchDirUri;
        } catch (err) {
            this.logger.error(`Failed to determine the sketch directory: ${err}`);
            return super.getWorkspaceURIFromCli();
        }
    }

}
