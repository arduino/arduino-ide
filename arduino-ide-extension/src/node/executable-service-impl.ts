import * as os from 'os';
import { injectable, inject } from 'inversify';
import { ILogger } from '@theia/core/lib/common/logger';
import { FileUri } from '@theia/core/lib/node/file-uri';
import { getExecPath } from './exec-util';
import { ExecutableService } from '../common/protocol/executable-service';

@injectable()
export class ExecutableServiceImpl implements ExecutableService {

    @inject(ILogger)
    protected logger: ILogger;

    async list(): Promise<{ clangdUri: string, cliUri: string, lsUri: string }> {
        const [ls, clangd, cli] = await Promise.all([
            getExecPath('arduino-language-server', this.onError.bind(this)),
            getExecPath('clangd', this.onError.bind(this), '--version', os.platform() !== 'win32'),
            getExecPath('arduino-cli', this.onError.bind(this))
        ]);
        return {
            clangdUri: FileUri.create(clangd).toString(),
            cliUri: FileUri.create(cli).toString(),
            lsUri: FileUri.create(ls).toString()
        };
    }

    protected onError(error: Error): void {
        this.logger.error(error);
    }

}
