import { injectable, inject } from 'inversify';
import { ILogger } from '@theia/core/lib/common/logger';
import { FileUri } from '@theia/core/lib/node/file-uri';
import { getExecPath } from './exec-util';
import { ExecutableService } from '../common/protocol/executable-service';

@injectable()
export class ExecutableServiceImpl implements ExecutableService {
  @inject(ILogger)
  protected logger: ILogger;

  async list(): Promise<{
    clangdUri: string;
    cliUri: string;
    lsUri: string;
    fwuploaderUri: string;
  }> {
    const [ls, clangd, cli, fwuploader] = await Promise.all([
      getExecPath('arduino-language-server', this.onError.bind(this)),
      getExecPath('clangd', this.onError.bind(this), undefined),
      getExecPath('arduino-cli', this.onError.bind(this)),
      getExecPath('arduino-fwuploader', this.onError.bind(this)),
    ]);
    return {
      clangdUri: FileUri.create(clangd).toString(),
      cliUri: FileUri.create(cli).toString(),
      lsUri: FileUri.create(ls).toString(),
      fwuploaderUri: FileUri.create(fwuploader).toString(),
    };
  }

  protected onError(error: Error): void {
    this.logger.error(error);
  }
}
