import * as os from 'os';
import * as path from 'path';
import { injectable } from 'inversify';
import { FileUri } from '@theia/core/lib/node/file-uri';
import { DefaultWorkspaceServer } from '@theia/workspace/lib/node/default-workspace-server';

@injectable()
export class DefaultWorkspaceServerExt extends DefaultWorkspaceServer {

    protected async getWorkspaceURIFromCli(): Promise<string | undefined> {
        return FileUri.create(path.join(os.homedir(), 'Arduino-PoC', 'Sketches')).toString();
    }

}