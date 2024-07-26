import { promises as fs } from 'node:fs';
import { dirname } from 'node:path';
import yaml from 'js-yaml';
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
  ConfigState,
} from '../common/protocol';
import { spawnCommand } from './exec-util';
import { ArduinoDaemonImpl } from './arduino-daemon-impl';
import { DefaultCliConfig, CLI_CONFIG, CliConfig } from './cli-config';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { deepClone, nls } from '@theia/core';
import { ErrnoException } from './utils/errors';
import { createArduinoCoreServiceClient } from './arduino-core-service-client';
import {
  ConfigurationSaveRequest,
  SettingsSetValueRequest,
} from './cli-protocol/cc/arduino/cli/commands/v1/settings_pb';

const deepmerge = require('deepmerge');

@injectable()
export class ConfigServiceImpl
  implements BackendApplicationContribution, ConfigService
{
  @inject(ILogger)
  @named('config')
  private readonly logger: ILogger;

  @inject(EnvVariablesServer)
  private readonly envVariablesServer: EnvVariablesServer;

  @inject(ArduinoDaemonImpl)
  private readonly daemon: ArduinoDaemonImpl;

  @inject(NotificationServiceServer)
  private readonly notificationService: NotificationServiceServer;

  private config: ConfigState = {
    config: undefined,
    messages: ['uninitialized'],
  };
  private cliConfig: DefaultCliConfig | undefined;
  private ready = new Deferred<void>();
  private readonly configChangeEmitter = new Emitter<{
    oldState: ConfigState;
    newState: ConfigState;
  }>();

  onStart(): void {
    this.initConfig();
  }

  private async getCliConfigFileUri(): Promise<string> {
    const configDirUri = await this.envVariablesServer.getConfigDirUri();
    return new URI(configDirUri).resolve(CLI_CONFIG).toString();
  }

  async getConfiguration(): Promise<ConfigState> {
    await this.ready.promise;
    return { ...this.config };
  }

  // Used by frontend to update the config.
  async setConfiguration(config: Config): Promise<void> {
    await this.ready.promise;
    if (Config.sameAs(this.config.config, config)) {
      return;
    }
    const oldConfigState = deepClone(this.config);
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
    copyDefaultCliConfig.network = proxy ? { proxy } : {}; // must be an empty object to unset the default prop with the `WriteRequest`.

    // always use the port of the daemon
    const port = await this.daemon.getPort();
    await this.updateDaemon(port, copyDefaultCliConfig);
    await this.writeDaemonState(port);

    this.config.config = deepClone(config);
    this.cliConfig = copyDefaultCliConfig;
    try {
      await this.validateCliConfig(this.cliConfig);
      delete this.config.messages;
      this.fireConfigChanged(oldConfigState, this.config);
    } catch (err) {
      if (err instanceof InvalidConfigError) {
        this.config.messages = err.errors;
        this.fireConfigChanged(oldConfigState, this.config);
      } else {
        throw err;
      }
    }
  }

  get cliConfiguration(): DefaultCliConfig | undefined {
    return this.cliConfig;
  }

  get onConfigChange(): Event<{
    oldState: ConfigState;
    newState: ConfigState;
  }> {
    return this.configChangeEmitter.event;
  }

  private async initConfig(): Promise<void> {
    this.logger.info('>>> Initializing CLI configuration...');
    try {
      const cliConfig = await this.loadCliConfig();
      this.logger.info('Loaded the CLI configuration.');
      this.cliConfig = cliConfig;
      const [config] = await Promise.all([
        this.mapCliConfigToAppConfig(this.cliConfig),
        this.ensureUserDirExists(this.cliConfig).catch((reason) => {
          if (reason instanceof Error) {
            this.logger.warn(
              `Could not ensure user directory existence: ${this.cliConfig?.directories.user}`,
              reason
            );
          }
          // NOOP. Try to create the folder if missing but swallow any errors.
          // The validation will take care of the missing location handling.
        }),
      ]);
      this.config.config = config;
      this.logger.info(
        `Mapped the CLI configuration: ${JSON.stringify(this.config.config)}`
      );
      this.logger.info('Validating the CLI configuration...');
      await this.validateCliConfig(this.cliConfig);
      delete this.config.messages;
      this.logger.info('The CLI config is valid.');
      if (config) {
        this.ready.resolve();
        this.logger.info('<<< Initialized the CLI configuration.');
        return;
      }
    } catch (err: unknown) {
      this.logger.error('Failed to initialize the CLI configuration.', err);
      if (err instanceof InvalidConfigError) {
        this.config.messages = err.errors;
        this.ready.resolve();
      }
    }
  }

  private async loadCliConfig(
    initializeIfAbsent = true
  ): Promise<DefaultCliConfig> {
    const cliConfigFileUri = await this.getCliConfigFileUri();
    const cliConfigPath = FileUri.fsPath(cliConfigFileUri);
    this.logger.info(`Loading CLI configuration from ${cliConfigPath}...`);
    try {
      const content = await fs.readFile(cliConfigPath, {
        encoding: 'utf8',
      });
      const model = (yaml.safeLoad(content) || {}) as CliConfig;
      this.logger.info(`Loaded CLI configuration: ${JSON.stringify(model)}`);
      if (model.directories?.data && model.directories?.user) {
        this.logger.info(
          "'directories.data' and 'directories.user' are set in the CLI configuration model."
        );
        return model as DefaultCliConfig;
      }
      // The CLI can run with partial (missing `port`, `directories`), the IDE2 cannot.
      // We merge the default CLI config with the partial user's config.
      this.logger.info(
        "Loading fallback CLI configuration to get 'directories.data' and 'directories.user'"
      );
      const fallbackModel = await this.getFallbackCliConfig();
      this.logger.info(
        `Loaded fallback CLI configuration: ${JSON.stringify(fallbackModel)}`
      );
      const mergedModel = deepmerge(fallbackModel, model) as DefaultCliConfig;
      this.logger.info(
        `Merged CLI configuration with the fallback: ${JSON.stringify(
          mergedModel
        )}`
      );
      return mergedModel;
    } catch (error) {
      if (ErrnoException.isENOENT(error)) {
        if (initializeIfAbsent) {
          await this.initCliConfigTo(dirname(cliConfigPath));
          return this.loadCliConfig(false);
        }
      }
      throw error;
    }
  }

  private async getFallbackCliConfig(): Promise<DefaultCliConfig> {
    const cliPath = this.daemon.getExecPath();
    const [configRaw, directoriesRaw] = await Promise.all([
      spawnCommand(cliPath, ['config', 'dump', '--json']),
      // Since CLI 1.0, the command `config dump` only returns user-modified values and not default ones.
      // directories.user and directories.data are required by IDE2 so we get the default value explicitly.
      spawnCommand(cliPath, ['config', 'get', 'directories', '--json']),
    ]);

    const config = JSON.parse(configRaw);
    const { user, data } = JSON.parse(directoriesRaw);

    return { ...config.config, directories: { user, data } };
  }

  private async initCliConfigTo(fsPathToDir: string): Promise<void> {
    const cliPath = this.daemon.getExecPath();
    await spawnCommand(cliPath, ['config', 'init', '--dest-dir', fsPathToDir]);
  }

  private async mapCliConfigToAppConfig(
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

  private fireConfigChanged(
    oldState: ConfigState,
    newState: ConfigState
  ): void {
    this.configChangeEmitter.fire({ oldState, newState });
    this.notificationService.notifyConfigDidChange(newState);
  }

  private async validateCliConfig(config: DefaultCliConfig): Promise<void> {
    const errors: string[] = [];
    errors.push(...(await this.checkAccessible(config)));
    if (errors.length) {
      throw new InvalidConfigError(errors);
    }
  }

  private async checkAccessible({
    directories,
  }: DefaultCliConfig): Promise<string[]> {
    try {
      await fs.readdir(directories.user);
      return [];
    } catch (err) {
      console.error(
        `Check accessible failed for input: ${directories.user}`,
        err
      );
      return [
        nls.localize(
          'arduino/configuration/cli/inaccessibleDirectory',
          "Could not access the sketchbook location at '{0}': {1}",
          directories.user,
          String(err)
        ),
      ];
    }
  }

  private async updateDaemon(
    port: number,
    config: DefaultCliConfig
  ): Promise<void> {
    const json = JSON.stringify(config, null, 2);
    this.logger.info(`Updating daemon with 'data': ${json}`);

    const updatableConfig = {
      locale: config.locale,
      'directories.user': config.directories.user,
      'directories.data': config.directories.data,
      'network.proxy': config.network?.proxy,
      'board_manager.additional_urls':
        config.board_manager?.additional_urls || [],
    };

    const client = createArduinoCoreServiceClient({ port });

    for (const [key, value] of Object.entries(updatableConfig)) {
      const req = new SettingsSetValueRequest();
      req.setKey(key);
      req.setEncodedValue(JSON.stringify(value));
      await new Promise<void>((resolve) => {
        client.settingsSetValue(req, (error) => {
          if (error) {
            this.logger.error(
              `Could not update config with key: ${key} and value: ${value}`,
              error
            );
          }
          resolve();
        });
      });
    }

    client.close();
  }

  private async writeDaemonState(port: number): Promise<void> {
    const client = createArduinoCoreServiceClient({ port });
    const req = new ConfigurationSaveRequest();
    req.setSettingsFormat('yaml');

    const configRaw = await new Promise<string>((resolve, reject) => {
      client.configurationSave(req, (error, resp) => {
        try {
          if (error) {
            reject(error);
            return;
          }
          resolve(resp.getEncodedSettings());
        } finally {
          client.close();
        }
      });
    });

    const cliConfigUri = await this.getCliConfigFileUri();
    const cliConfigPath = FileUri.fsPath(cliConfigUri);
    await fs.writeFile(cliConfigPath, configRaw, { encoding: 'utf-8' });
  }

  // #1445
  private async ensureUserDirExists(
    cliConfig: DefaultCliConfig
  ): Promise<void> {
    await fs.mkdir(cliConfig.directories.user, { recursive: true });
  }
}

class InvalidConfigError extends Error {
  constructor(readonly errors: string[]) {
    super('InvalidConfigError:\n - ' + errors.join('\n - '));
    if (!errors.length) {
      throw new Error("Illegal argument: 'messages'. It must not be empty.");
    }
    Object.setPrototypeOf(this, InvalidConfigError.prototype);
  }
}
