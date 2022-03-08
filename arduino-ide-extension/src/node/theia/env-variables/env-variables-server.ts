import { join } from 'path';
import { homedir } from 'os';
import { injectable } from '@theia/core/shared/inversify';
import { FileUri } from '@theia/core/lib/node/file-uri';
import { BackendApplicationConfigProvider } from '@theia/core/lib/node/backend-application-config-provider';
import { EnvVariablesServerImpl as TheiaEnvVariablesServerImpl } from '@theia/core/lib/node/env-variables/env-variables-server';

@injectable()
export class EnvVariablesServer extends TheiaEnvVariablesServerImpl {
  protected readonly configDirUri = Promise.resolve(
    FileUri.create(
      join(homedir(), BackendApplicationConfigProvider.get().configDirName)
    ).toString()
  );
}
