import { injectable } from 'inversify';
import findGit from 'find-git-exec';
import { dirname } from 'path';
import { pathExists } from 'fs-extra';
import { GitInit } from '@theia/git/lib/node/init/git-init';
import { DisposableCollection } from '@theia/core/lib/common/disposable';

@injectable()
export class DefaultGitInit implements GitInit {
  protected readonly toDispose = new DisposableCollection();

  async init(): Promise<void> {
    const { env } = process;
    try {
      const { execPath, path, version } = await findGit();
      if (!!execPath && !!path && !!version) {
        const dir = dirname(dirname(path));
        const [execPathOk, pathOk, dirOk] = await Promise.all([
          pathExists(execPath),
          pathExists(path),
          pathExists(dir),
        ]);
        if (execPathOk && pathOk && dirOk) {
          if (
            typeof env.LOCAL_GIT_DIRECTORY !== 'undefined' &&
            env.LOCAL_GIT_DIRECTORY !== dir
          ) {
            console.error(
              `Misconfigured env.LOCAL_GIT_DIRECTORY: ${env.LOCAL_GIT_DIRECTORY}. dir was: ${dir}`
            );
            return;
          }
          if (
            typeof env.GIT_EXEC_PATH !== 'undefined' &&
            env.GIT_EXEC_PATH !== execPath
          ) {
            console.error(
              `Misconfigured env.GIT_EXEC_PATH: ${env.GIT_EXEC_PATH}. execPath was: ${execPath}`
            );
            return;
          }
          process.env.LOCAL_GIT_DIRECTORY = dir;
          process.env.GIT_EXEC_PATH = execPath;
          console.info(`Using Git [${version}] from the PATH. (${path})`);
          return;
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  dispose(): void {
    this.toDispose.dispose();
  }
}
