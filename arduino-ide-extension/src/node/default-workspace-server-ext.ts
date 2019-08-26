import { injectable, inject } from 'inversify';
import { FileUri } from '@theia/core/lib/node/file-uri';
import { DefaultWorkspaceServer } from '@theia/workspace/lib/node/default-workspace-server';
import { ConfigService } from '../common/protocol/config-service';

@injectable()
export class DefaultWorkspaceServerExt extends DefaultWorkspaceServer {

    @inject(ConfigService) protected readonly configService: ConfigService;

    protected async getWorkspaceURIFromCli(): Promise<string | undefined> {
        const config = await this.configService.getConfiguration();
        return FileUri.create(config.sketchDirPath).toString();
    }

}