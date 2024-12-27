import {
  EnvVariable,
  EnvVariablesServer as TheiaEnvVariablesServer,
} from '@theia/core/lib/common/env-variables/env-variables-protocol';
import { isWindows } from '@theia/core/lib/common/os';
import URI from '@theia/core/lib/common/uri';
import { FileUri } from '@theia/core/lib/node/file-uri';
import {
  inject,
  injectable,
  postConstruct,
} from '@theia/core/shared/inversify';
import { list as listDrives } from 'drivelist';
import { homedir } from 'node:os';
import { join } from 'node:path';
import fs from 'fs';

@injectable()
export class ConfigDirUriProvider {
  private uri: URI | undefined;

  configDirUri(): URI {
    if (!this.uri) {
      this.uri = FileUri.create(
        // join(homedir(), BackendApplicationConfigProvider.get().configDirName)
        join(homedir(), '.lingzhiIDE')
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
    const filePath = new URI(
      this.configDirUriProvider.configDirUri().toString()
    )
      .resolve('lingzhi-cli.yaml')
      .toString();

    const cliConfigPath = FileUri.fsPath(filePath);
    const cliConfigPath1 = FileUri.fsPath(
      this.configDirUriProvider.configDirUri()
    );
    if (!fs.existsSync(cliConfigPath1)) {
      fs.mkdirSync(cliConfigPath1);
      let content = `board_manager:
    additional_urls: []
build_cache:
    compilations_before_purge: 10
    ttl: 720h0m0s
daemon:
    port: "50051"
directories:
    builtin:
        libraries: C:\\Users\\15653\\AppData\\Local\\Lingzhi\\libraries
    data: C:\\Users\\15653\\AppData\\Local\\Lingzhi
    downloads: C:\\Users\\15653\\AppData\\Local\\Lingzhi\\staging
    user: C:\\Users\\15653\\Documents\\Lingzhi
library:
    enable_unsafe_install: false
locale: zh-cn
logging:
    file: ""
    format: text
    level: info
metrics:
    addr: :9090
    enabled: true
output:
    no_color: false
sketch:
    always_export_binaries: false
updater:
    enable_notification: true
      `;
      const lines = content.split('\n');
      let inDirectoriesSection = false;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === 'directories:') {
          inDirectoriesSection = true;
        } else if (inDirectoriesSection && line.startsWith('libraries:')) {
          const librariesPath = FileUri.create(
            join(homedir(), 'AppData\\Local\\Lingzhi\\libraries')
          ).toString();
          const libraries = FileUri.fsPath(librariesPath);
          lines[i] = `        libraries: ${libraries}`;
        } else if (inDirectoriesSection && line.startsWith('data:')) {
          const dataPath = FileUri.create(
            join(homedir(), 'AppData\\Local\\Lingzhi')
          ).toString();
          const data = FileUri.fsPath(dataPath);
          lines[i] = `    data: ${data}`;
        } else if (inDirectoriesSection && line.startsWith('downloads:')) {
          const downloadsPath = FileUri.create(
            join(homedir(), `AppData\\Local\\Lingzhi\\staging`)
          ).toString();
          const downloads = FileUri.fsPath(downloadsPath);
          lines[i] = `    downloads: ${downloads}`;
        } else if (inDirectoriesSection && line.startsWith('user:')) {
          const userPath = FileUri.create(
            join(homedir(), `Documents\\Lingzhi`)
          ).toString();
          const user = FileUri.fsPath(userPath);
          lines[i] = `    user: ${user}`;
        } else if (line === '') {
          inDirectoriesSection = false;
        }
      }

      content = lines.join('\n');
      fs.writeFileSync(cliConfigPath, content);
    } else {
    }
    return this.configDirUriProvider.configDirUri().toString();
  }

  // private async createPackageIndexJson(){
  //   let filePath =  join(homedir(), 'AppData','Local','lingzhi','package_index.json')
  //   if(!fs.existsSync(filePath)){
  //     let content = `{
  //     "packages": [
  //       {
  //         "name": "zaixinjian",
  //         "maintainer": "Lingzhi",
  //         "websiteURL": "http://lingzhilab.com/",
  //         "platforms": [
  //           {
  //             "category": "STM32F1",
  //             "name": "STM32F1",
  //             "url": "https://www.zxjian.com/api/databook/STM32F1.zip",
  //             "version": "1.0.0",
  //             "architecture": "zaixinjian",
  //             "archiveFileName": "STM32F1.zip",
  //             "boards": [
  //               {
  //                 "name": "LingzhiStandard"
  //               }
  //             ],
  //             "size": "37822444",
  //             "checksum": "SHA-256:406add428c6acf4735f112d3b83deca12a6065354e3b76835d87228ecb270c17"
  //           },
  //           {
  //             "category": "STM32HAL",
  //             "name": "STM32HAL",
  //             "url": "https://www.zxjian.com/api/databook/STM32HAL.zip",
  //             "version": "1.0.0",
  //             "architecture": "zaixinjian",
  //             "archiveFileName": "STM32HAL.zip",
  //             "boards": [
  //               {
  //                 "name": "lingzhiM4"
  //               }
  //             ],
  //             "size": "91578454",
  //             "checksum": "SHA-256:21924cbb4f4edd5c691f1987623c6f429d15dc03f0643d49a9f1ac1140f6592e"
  //           }
  //         ],
  //         "tools": [
  //           {
  //           }
  //         ]
  //       }
  //     ]
  //   }`;
  //     const dirname = filePath.substring(0, filePath.lastIndexOf('\\'));
  //     if (!fs.existsSync(dirname)) {
  //       fs.mkdirSync(dirname, { recursive: true });
  //     }
  //     fs.writeFileSync(filePath,
  //       content
  //     );
  //   }
  // }

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
