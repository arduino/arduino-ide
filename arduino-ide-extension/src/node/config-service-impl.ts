import * as path from 'path';
import * as yaml from 'js-yaml';
import * as grpc from '@grpc/grpc-js';
import * as deepmerge from 'deepmerge';
import { injectable, inject, named } from 'inversify';
import URI from '@theia/core/lib/common/uri';
import { ILogger } from '@theia/core/lib/common/logger';
import { FileUri } from '@theia/core/lib/node/file-uri';
import { Event, Emitter } from '@theia/core/lib/common/event';
import { BackendApplicationContribution } from '@theia/core/lib/node/backend-application';
import { ConfigService, Config, NotificationServiceServer } from '../common/protocol';
import * as fs from './fs-extra';
import { spawnCommand } from './exec-util';
import { RawData } from './cli-protocol/settings/settings_pb';
import { SettingsClient } from './cli-protocol/settings/settings_grpc_pb';
import * as serviceGrpcPb from './cli-protocol/settings/settings_grpc_pb';
import { ConfigFileValidator } from './config-file-validator';
import { ArduinoDaemonImpl } from './arduino-daemon-impl';
import { DefaultCliConfig, CLI_CONFIG_SCHEMA_PATH, CLI_CONFIG } from './cli-config';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';

const debounce = require('lodash.debounce');

@injectable()
export class ConfigServiceImpl implements BackendApplicationContribution, ConfigService {

    @inject(ILogger)
    @named('config')
    protected readonly logger: ILogger;

    @inject(EnvVariablesServer)
    protected readonly envVariablesServer: EnvVariablesServer;

    @inject(ConfigFileValidator)
    protected readonly validator: ConfigFileValidator;

    @inject(ArduinoDaemonImpl)
    protected readonly daemon: ArduinoDaemonImpl;

    @inject(NotificationServiceServer)
    protected readonly notificationService: NotificationServiceServer;

    protected updating = false;
    protected config: Config;
    protected cliConfig: DefaultCliConfig | undefined;
    protected ready = new Deferred<void>();
    protected readonly configChangeEmitter = new Emitter<Config>();

    async onStart(): Promise<void> {
        await this.ensureCliConfigExists();
        await this.watchCliConfig();
        this.cliConfig = await this.loadCliConfig();
        if (this.cliConfig) {
            const config = await this.mapCliConfigToAppConfig(this.cliConfig);
            if (config) {
                this.config = config;
                this.ready.resolve();
            }
        } else {
            this.fireInvalidConfig();
        }
    }

    async getCliConfigFileUri(): Promise<string> {
        const configDirUri = await this.envVariablesServer.getConfigDirUri();
        return new URI(configDirUri).resolve(CLI_CONFIG).toString();
    }

    async getConfigurationFileSchemaUri(): Promise<string> {
        return FileUri.create(CLI_CONFIG_SCHEMA_PATH).toString();
    }

    async getConfiguration(): Promise<Config> {
        await this.ready.promise;
        return this.config;
    }

    get cliConfiguration(): DefaultCliConfig | undefined {
        return this.cliConfig;
    }

    get onConfigChange(): Event<Config> {
        return this.configChangeEmitter.event;
    }

    async getVersion(): Promise<string> {
        return this.daemon.getVersion();
    }

    async isInDataDir(uri: string): Promise<boolean> {
        return this.getConfiguration().then(({ dataDirUri }) => new URI(dataDirUri).isEqualOrParent(new URI(uri)));
    }

    async isInSketchDir(uri: string): Promise<boolean> {
        return this.getConfiguration().then(({ sketchDirUri }) => new URI(sketchDirUri).isEqualOrParent(new URI(uri)));
    }

    protected async loadCliConfig(): Promise<DefaultCliConfig | undefined> {
        const cliConfigFileUri = await this.getCliConfigFileUri();
        const cliConfigPath = FileUri.fsPath(cliConfigFileUri);
        try {
            const content = await fs.readFile(cliConfigPath, { encoding: 'utf8' });
            const model = yaml.safeLoad(content) || {};
            // The CLI can run with partial (missing `port`, `directories`), the app cannot, we merge the default with the user's config.
            const fallbackModel = await this.getFallbackCliConfig();
            return deepmerge(fallbackModel, model) as DefaultCliConfig;
        } catch (error) {
            this.logger.error(`Error occurred when loading CLI config from ${cliConfigPath}.`, error);
        }
        return undefined;
    }

    protected async getFallbackCliConfig(): Promise<DefaultCliConfig> {
        const cliPath = await this.daemon.getExecPath();
        const rawYaml = await spawnCommand(`"${cliPath}"`, ['config', 'dump']);
        const model = yaml.safeLoad(rawYaml.trim());
        return model as DefaultCliConfig;
    }

    protected async ensureCliConfigExists(): Promise<void> {
        const cliConfigFileUri = await this.getCliConfigFileUri();
        const cliConfigPath = FileUri.fsPath(cliConfigFileUri);
        let exists = await fs.exists(cliConfigPath);
        if (!exists) {
            await this.initCliConfigTo(path.dirname(cliConfigPath));
            exists = await fs.exists(cliConfigPath);
            if (!exists) {
                throw new Error(`Could not initialize the default CLI configuration file at ${cliConfigPath}.`);
            }
        }
    }

    protected async initCliConfigTo(fsPathToDir: string): Promise<void> {
        const cliPath = await this.daemon.getExecPath();
        await spawnCommand(`"${cliPath}"`, ['config', 'init', '--dest-dir', `"${fsPathToDir}"`]);
    }

    protected async mapCliConfigToAppConfig(cliConfig: DefaultCliConfig): Promise<Config> {
        const { directories } = cliConfig;
        const { data, user, downloads } = directories;
        const additionalUrls: Array<string> = [];
        if (cliConfig.board_manager && cliConfig.board_manager.additional_urls) {
            additionalUrls.push(...Array.from(new Set(cliConfig.board_manager.additional_urls)));
        }
        return {
            dataDirUri: FileUri.create(data).toString(),
            sketchDirUri: FileUri.create(user).toString(),
            downloadsDirUri: FileUri.create(downloads).toString(),
            additionalUrls,
        };
    }

    protected async watchCliConfig(): Promise<void> {
        const configDirUri = await this.getCliConfigFileUri();
        const cliConfigPath = FileUri.fsPath(configDirUri);
        const listener = debounce(async () => {
            if (this.updating) {
                return;
            } else {
                this.updating = true;
            }

            const cliConfig = await this.loadCliConfig();
            // Could not parse the YAML content.
            if (!cliConfig) {
                this.updating = false;
                this.fireInvalidConfig();
                return;
            }
            const valid = await this.validator.validate(cliConfig);
            if (!valid) {
                this.updating = false;
                this.fireInvalidConfig();
                return;
            }
            const shouldUpdate = !this.cliConfig || !DefaultCliConfig.sameAs(this.cliConfig, cliConfig);
            if (!shouldUpdate) {
                this.fireConfigChanged(this.config);
                this.updating = false;
                return;
            }
            // We use the gRPC `Settings` API iff the `daemon.port` has not changed.
            // Otherwise, we restart the daemon. 
            const canUpdateSettings = this.cliConfig && this.cliConfig.daemon.port === cliConfig.daemon.port;
            try {
                const config = await this.mapCliConfigToAppConfig(cliConfig);
                const update = new Promise<void>(resolve => {
                    if (canUpdateSettings) {
                        return this.updateDaemon(cliConfig.daemon.port, cliConfig).then(resolve);
                    }
                    return this.daemon.stopDaemon()
                        .then(() => this.daemon.startDaemon())
                        .then(resolve);
                })
                update.then(() => {
                    this.cliConfig = cliConfig;
                    this.config = config;
                    this.configChangeEmitter.fire(this.config);
                    this.notificationService.notifyConfigChanged({ config: this.config });
                }).finally(() => this.updating = false);
            } catch (err) {
                this.logger.error('Failed to update the daemon with the current CLI configuration.', err);
            }
        }, 200);
        fs.watchFile(cliConfigPath, listener);
        this.logger.info(`Started watching the Arduino CLI configuration: '${cliConfigPath}'.`);
    }

    protected fireConfigChanged(config: Config): void {
        this.notificationService.notifyConfigChanged({ config });
    }

    protected fireInvalidConfig(): void {
        this.notificationService.notifyConfigChanged({ config: undefined });
    }

    protected async unwatchCliConfig(): Promise<void> {
        const cliConfigFileUri = await this.getCliConfigFileUri();
        const cliConfigPath = FileUri.fsPath(cliConfigFileUri);
        fs.unwatchFile(cliConfigPath);
        this.logger.info(`Stopped watching the Arduino CLI configuration: '${cliConfigPath}'.`);
    }

    protected async updateDaemon(port: string | number, config: DefaultCliConfig): Promise<void> {
        // https://github.com/agreatfool/grpc_tools_node_protoc_ts/blob/master/doc/grpcjs_support.md#usage
        // @ts-ignore
        const SettingsClient = grpc.makeClientConstructor(serviceGrpcPb['cc.arduino.cli.settings.Settings'], 'SettingsService') as any;
        const client = new SettingsClient(`localhost:${port}`, grpc.credentials.createInsecure()) as SettingsClient;
        const data = new RawData();
        data.setJsondata(JSON.stringify(config, null, 2));
        return new Promise<void>((resolve, reject) => {
            client.merge(data, error => {
                if (error) {
                    reject(error);
                    return;
                }
                client.close();
                resolve();
            })
        });
    }

}
