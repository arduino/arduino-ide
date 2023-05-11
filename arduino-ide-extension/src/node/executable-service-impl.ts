import { FileUri } from '@theia/core/lib/node/file-uri';
import { injectable } from '@theia/core/shared/inversify';
import { ExecutableService } from '../common/protocol/executable-service';
import { getExecPath } from './exec-util';

@injectable()
export class ExecutableServiceImpl implements ExecutableService {
  async list(): Promise<{
    clangdUri: string;
    cliUri: string;
    lsUri: string;
  }> {
    return {
      clangdUri: FileUri.create(getExecPath('clangd')).toString(),
      cliUri: FileUri.create(getExecPath('arduino-cli')).toString(),
      lsUri: FileUri.create(getExecPath('arduino-language-server')).toString(),
    };
  }
}
