import {
  EnvVariable,
  EnvVariablesServer as TheiaEnvVariablesServer,
} from '@theia/core/lib/common/env-variables/env-variables-protocol';
import { isWindows } from '@theia/core/lib/common/os';
import URI from '@theia/core/lib/common/uri';
import { BackendApplicationConfigProvider } from '@theia/core/lib/node/backend-application-config-provider';
import { FileUri } from '@theia/core/lib/node/file-uri';
import {
  inject,
  injectable,
  postConstruct,
} from '@theia/core/shared/inversify';
import { list as listDrives } from 'drivelist';
import { homedir } from 'node:os';
import { join } from 'node:path';

@injectable()
export class ConfigDirUriProvider {
  private uri: URI | undefined;

  configDirUri(): URI {
    if (!this.uri) {
      this.uri = FileUri.create(
        join(homedir(), BackendApplicationConfigProvider.get().configDirName)
      );
    }
    return this.uri;
  }
}

// Copy-pasted from https://github.com/eclipse-theia/theia/blob/v1.31.1/packages/core/src/node/env-variables/env-variables-server.ts
// to simplify the binding of the config directory location for tests.
@injectable()
export class EnvVariablesServer implements TheiaEnvVariablesServer {
  @inject(ConfigDirUriProvider)
  private readonly configDirUriProvider: ConfigDirUriProvider;

  private readonly envs: { [key: string]: EnvVariable } = {};
  private readonly homeDirUri = FileUri.create(homedir()).toString();

  constructor() {
    const prEnv = process.env;
    Object.keys(prEnv).forEach((key: string) => {
      let keyName = key;
      if (isWindows) {
        keyName = key.toLowerCase();
      }
      this.envs[keyName] = { name: keyName, value: prEnv[key] };
    });
  }

  @postConstruct()
  protected init(): void {
    console.log(
      `Configuration directory URI: '${this.configDirUriProvider
        .configDirUri()
        .toString()}'`
    );
  }

  async getExecPath(): Promise<string> {
    return process.execPath;
  }

  async getVariables(): Promise<EnvVariable[]> {
    return Object.keys(this.envs).map((key) => this.envs[key]);
  }

  async getValue(key: string): Promise<EnvVariable | undefined> {
    if (isWindows) {
      key = key.toLowerCase();
    }
    return this.envs[key];
  }

  async getConfigDirUri(): Promise<string> {
    return this.configDirUriProvider.configDirUri().toString();
  }

  async getHomeDirUri(): Promise<string> {
    return this.homeDirUri;
  }

  async getDrives(): Promise<string[]> {
    const uris: string[] = [];
    const drives = await listDrives();
    for (const drive of drives) {
      for (const mountpoint of drive.mountpoints) {
        if (this.filterHiddenPartitions(mountpoint.path)) {
          uris.push(FileUri.create(mountpoint.path).toString());
        }
      }
    }
    return uris;
  }

  /**
   * Filters hidden and system partitions.
   */
  private filterHiddenPartitions(path: string): boolean {
    // OS X: This is your sleep-image. When your Mac goes to sleep it writes the contents of its memory to the hard disk. (https://bit.ly/2R6cztl)
    if (path === '/private/var/vm') {
      return false;
    }
    // Ubuntu: This system partition is simply the boot partition created when the computers mother board runs UEFI rather than BIOS. (https://bit.ly/2N5duHr)
    if (path === '/boot/efi') {
      return false;
    }
    return true;
  }
}
