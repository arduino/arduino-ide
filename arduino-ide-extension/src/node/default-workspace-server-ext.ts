import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs-extra';
import { injectable } from 'inversify';
import { FileUri } from '@theia/core/lib/node/file-uri';
import { DefaultWorkspaceServer } from '@theia/workspace/lib/node/default-workspace-server';

@injectable()
export class DefaultWorkspaceServerExt extends DefaultWorkspaceServer {

    /**
     * Reads the most recently used workspace root from the user's home directory.
     */
    // tslint:disable-next-line:no-any
    protected async readRecentWorkspacePathsFromUserHome(): Promise<any> {
        const paths = await super.readRecentWorkspacePathsFromUserHome();
        if (!paths || paths.recentRoots.length === 0) {
            const defaultWorkspacePath = path.resolve(os.homedir(), 'Arduino-PoC', 'workspace');
            if (!fs.existsSync(defaultWorkspacePath)) {
                fs.mkdirpSync(defaultWorkspacePath);
            }
            return {
                recentRoots: [
                    FileUri.create(defaultWorkspacePath)
                ]
            };
        }
        return paths;
    }

    async getMostRecentlyUsedWorkspace(): Promise<string | undefined> {
        const result = await super.getMostRecentlyUsedWorkspace();
        console.log(result);
        return result;
    }

}