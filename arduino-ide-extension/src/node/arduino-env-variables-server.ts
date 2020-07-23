import { join } from 'path';
import { homedir } from 'os';
import { injectable } from 'inversify';
import { FileUri } from '@theia/core/lib/node/file-uri';
import { EnvVariablesServerImpl } from '@theia/core/lib/node/env-variables/env-variables-server';
import { BackendApplicationConfigProvider } from '@theia/core/lib/node/backend-application-config-provider';

@injectable()
export class ArduinoEnvVariablesServer extends EnvVariablesServerImpl {

    protected readonly configDirUri = Promise.resolve(FileUri.create(join(homedir(), BackendApplicationConfigProvider.get().configDirName)).toString());

}
