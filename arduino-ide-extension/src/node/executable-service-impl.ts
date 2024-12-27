import { FileUri } from '@theia/core/lib/node/file-uri';
import { injectable } from '@theia/core/shared/inversify';
import { ExecutableService } from '../common/protocol/executable-service';
import {
  arduinoCliPath,
  arduinoLanguageServerPath,
  clangdPath,
} from './resources';

@injectable()
export class ExecutableServiceImpl implements ExecutableService {
  async list(): Promise<{
    clangdUri: string;
    cliUri: string;
    lsUri: string;
  }> {
    return {
      clangdUri: FileUri.create(clangdPath).toString(),
      cliUri: FileUri.create(arduinoCliPath).toString(),
      lsUri: FileUri.create(arduinoLanguageServerPath).toString(),
    };
  }
}
