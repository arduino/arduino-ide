import { join } from 'path';
import { homedir } from 'os';
import { injectable } from 'inversify';
import { EnvVariablesServerImpl } from '@theia/core/lib/node/env-variables/env-variables-server';
import { FileUri } from '@theia/core/lib/node/file-uri';

@injectable()
export class ArduinoEnvVariablesServer extends EnvVariablesServerImpl {

    protected readonly configDirUri = FileUri.create(join(homedir(), '.arduinoProIDE')).toString();

}
