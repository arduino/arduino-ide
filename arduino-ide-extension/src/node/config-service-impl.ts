import { promises as fs } from 'fs';
import { dirname } from 'path';
import * as yaml from 'js-yaml';
import * as grpc from '@grpc/grpc-js';
import { injectable, inject, named } from '@theia/core/shared/inversify';
import URI from '@theia/core/lib/common/uri';
import { ILogger } from '@theia/core/lib/common/logger';
import { FileUri } from '@theia/core/lib/node/file-uri';
import { Event, Emitter } from '@theia/core/lib/common/event';
import { BackendApplicationContribution } from '@theia/core/lib/node/backend-application';
import {
  ConfigService,
  Config,
  NotificationServiceServer,
  Network,
} from '../common/protocol';
import { spawnCommand } from './exec-util';
import {
  MergeRequest,
  WriteRequest,
} from './cli-protocol/cc/arduino/cli/settings/v1/settings_pb';
import { SettingsServiceClient } from './cli-protocol/cc/arduino/cli/settings/v1/settings_grpc_pb';
import * as serviceGrpcPb from './cli-protocol/cc/arduino/cli/settings/v1/settings_grpc_pb';
import { ArduinoDaemonImpl } from './arduino-daemon-impl';
import { DefaultCliConfig, CLI_CONFIG } from './cli-config';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { deepClone } from '@theia/core';

const deepmerge = require('deepmerge');

@injectable()
export class ConfigServiceImpl
  implements BackendApplicationContribution, ConfigService
{
  @inject(ILogger)
  @named('config')
  protected readonly logger: ILogger;

  @inject(EnvVariablesServer)
  protected readonly envVariablesServer: EnvVariablesServer;

  @inject(ArduinoDaemonImpl)
  protected readonly daemon: ArduinoDaemonImpl;

  @inject(NotificationServiceServer)
  protected readonly notificationService: NotificationServiceServer;

  protected config: Config;
  protected cliConfig: DefaultCliConfig | undefined;
  protected ready = new Deferred<void>();
  protected readonly configChangeEmitter = new Emitter<Config>();

  onStart(): void {
    this.loadCliConfig().then(async (cliConfig) => {
      this.cliConfig = cliConfig;
      if (this.cliConfig) {
        const [config] = await Promise.all([
          this.mapCliConfigToAppConfig(this.cliConfig),
          this.ensureUserDirExists(this.cliConfig),
        ]);
        if (config) {
          this.config = config;
          this.ready.resolve();
          return;
        }
      }
      this.fireInvalidConfig();
    });
  }

  async getCliConfigFileUri(): Promise<string> {
    const configDirUri = await this.envVariablesServer.getConfigDirUri();
    return new URI(configDirUri).resolve(CLI_CONFIG).toString();
  }

  async getConfiguration(): Promise<Config> {
    await this.ready.promise;
    return { ...this.config };
  }

  // Used by frontend to update the config.
  async setConfiguration(config: Config): Promise<void> {
    await this.ready.promise;
    if (Config.sameAs(this.config, config)) {
      return;
    }
    let copyDefaultCliConfig: DefaultCliConfig | undefined = deepClone(
      this.cliConfig
    );
    if (!copyDefaultCliConfig) {
      copyDefaultCliConfig = await this.getFallbackCliConfig();
    }
    const { additionalUrls, dataDirUri, sketchDirUri, network, locale } =
      config;
    copyDefaultCliConfig.directories = {
      data: FileUri.fsPath(dataDirUri),
      user: FileUri.fsPath(sketchDirUri),
    };
    copyDefaultCliConfig.board_manager = {
      additional_urls: [...additionalUrls],
    };
    copyDefaultCliConfig.locale = locale || 'en';
    const proxy = Network.stringify(network);
    copyDefaultCliConfig.network = { proxy };

    // always use the port of the daemon
    const port = await this.daemon.getPort();
    await this.updateDaemon(port, copyDefaultCliConfig);
    await this.writeDaemonState(port);

    this.config = deepClone(config);
    this.cliConfig = copyDefaultCliConfig;
    this.fireConfigChanged(this.config);
  }

  get cliConfiguration(): DefaultCliConfig | undefined {
    return this.cliConfig;
  }

  get onConfigChange(): Event<Config> {
    return this.configChangeEmitter.event;
  }

  async getVersion(): Promise<
    Readonly<{ version: string; commit: string; status?: string }>
  > {
    return this.daemon.getVersion();
  }

  protected async loadCliConfig(
    initializeIfAbsent = true
  ): Promise<DefaultCliConfig | undefined> {
    const cliConfigFileUri = await this.getCliConfigFileUri();
    const cliConfigPath = FileUri.fsPath(cliConfigFileUri);
    try {
      const content = await fs.readFile(cliConfigPath, {
        encoding: 'utf8',
      });
      const model = (yaml.safeLoad(content) || {}) as DefaultCliConfig;
      if (model.directories.data && model.directories.user) {
        return model;
      }
      // The CLI can run with partial (missing `port`, `directories`), the IDE2 cannot.
      // We merge the default CLI config with the partial user's config.
      const fallbackModel = await this.getFallbackCliConfig();
      return deepmerge(fallbackModel, model) as DefaultCliConfig;
    } catch (error) {
      if ('code' in error && error.code === 'ENOENT') {
        if (initializeIfAbsent) {
          await this.initCliConfigTo(dirname(cliConfigPath));
          return this.loadCliConfig(false);
        }
      }
      throw error;
    }
  }

  protected async getFallbackCliConfig(): Promise<DefaultCliConfig> {
    const cliPath = await this.daemon.getExecPath();
    const rawJson = await spawnCommand(`"${cliPath}"`, [
      'config',
      'dump',
      'format',
      '--json',
    ]);
    return JSON.parse(rawJson);
  }

  protected async initCliConfigTo(fsPathToDir: string): Promise<void> {
    const cliPath = await this.daemon.getExecPath();
    await spawnCommand(`"${cliPath}"`, [
      'config',
      'init',
      '--dest-dir',
      `"${fsPathToDir}"`,
    ]);
  }

  protected async mapCliConfigToAppConfig(
    cliConfig: DefaultCliConfig
  ): Promise<Config> {
    const { directories, locale = 'en' } = cliConfig;
    const { user, data } = directories;
    const additionalUrls: Array<string> = [];
    if (cliConfig.board_manager && cliConfig.board_manager.additional_urls) {
      additionalUrls.push(
        ...Array.from(new Set(cliConfig.board_manager.additional_urls))
      );
    }
    const network = Network.parse(cliConfig.network?.proxy);
    return {
      dataDirUri: FileUri.create(data).toString(),
      sketchDirUri: FileUri.create(user).toString(),
      additionalUrls,
      network,
      locale,
    };
  }

  protected fireConfigChanged(config: Config): void {
    this.configChangeEmitter.fire(config);
    this.notificationService.notifyConfigDidChange({ config });
  }

  protected fireInvalidConfig(): void {
    this.notificationService.notifyConfigDidChange({ config: undefined });
  }

  protected async updateDaemon(
    port: string | number,
    config: DefaultCliConfig
  ): Promise<void> {
    const client = this.createClient(port);
    const req = new MergeRequest();
    const json = JSON.stringify(config, null, 2);
    req.setJsonData(json);
    console.log(`Updating daemon with 'data': ${json}`);
    return new Promise<void>((resolve, reject) => {
      client.merge(req, (error) => {
        try {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        } finally {
          client.close();
        }
      });
    });
  }

  protected async writeDaemonState(port: string | number): Promise<void> {
    const client = this.createClient(port);
    const req = new WriteRequest();
    const cliConfigUri = await this.getCliConfigFileUri();
    const cliConfigPath = FileUri.fsPath(cliConfigUri);
    req.setFilePath(cliConfigPath);
    return new Promise<void>((resolve, reject) => {
      client.write(req, (error) => {
        try {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        } finally {
          client.close();
        }
      });
    });
  }

  private createClient(port: string | number): SettingsServiceClient {
    // https://github.com/agreatfool/grpc_tools_node_protoc_ts/blob/master/doc/grpcjs_support.md#usage
    const SettingsServiceClient = grpc.makeClientConstructor(
      // @ts-expect-error: ignore
      serviceGrpcPb['cc.arduino.cli.settings.v1.SettingsService'],
      'SettingsServiceService'
    ) as any;
    return new SettingsServiceClient(
      `localhost:${port}`,
      grpc.credentials.createInsecure()
    ) as SettingsServiceClient;
  }

  // #1445
  private async ensureUserDirExists(
    cliConfig: DefaultCliConfig
  ): Promise<void> {
    await fs.mkdir(cliConfig.directories.user, { recursive: true });
  }
}
