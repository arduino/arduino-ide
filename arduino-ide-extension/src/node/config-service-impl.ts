import * as fs from 'fs';
import * as path from 'path';
import * as temp from 'temp';
import * as yaml from 'js-yaml';
import { promisify } from 'util';
import * as grpc from '@grpc/grpc-js';
import * as deepmerge from 'deepmerge';
import { injectable, inject, named } from 'inversify';
import URI from '@theia/core/lib/common/uri';
import { ILogger } from '@theia/core/lib/common/logger';
import { FileUri } from '@theia/core/lib/node/file-uri';
import { Event, Emitter } from '@theia/core/lib/common/event';
import { BackendApplicationContribution } from '@theia/core/lib/node/backend-application';
import { ConfigService, Config, NotificationServiceServer, Network } from '../common/protocol';
import { spawnCommand } from './exec-util';
import { WriteRequest, RawData } from './cli-protocol/settings/settings_pb';
import { SettingsClient } from './cli-protocol/settings/settings_grpc_pb';
import * as serviceGrpcPb from './cli-protocol/settings/settings_grpc_pb';
import { ArduinoDaemonImpl } from './arduino-daemon-impl';
import { DefaultCliConfig, CLI_CONFIG } from './cli-config';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { deepClone } from '@theia/core';

const track = temp.track();

@injectable()
export class ConfigServiceImpl implements BackendApplicationContribution, ConfigService {

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

    async onStart(): Promise<void> {
        await this.ensureCliConfigExists();
        this.cliConfig = await this.loadCliConfig();
        if (this.cliConfig) {
            const config = await this.mapCliConfigToAppConfig(this.cliConfig);
            if (config) {
                this.config = config;
                this.ready.resolve();
                return;
            }
        }
        this.fireInvalidConfig();
    }

    async getCliConfigFileUri(): Promise<string> {
        const configDirUri = await this.envVariablesServer.getConfigDirUri();
        return new URI(configDirUri).resolve(CLI_CONFIG).toString();
    }

    async getConfiguration(): Promise<Config> {
        await this.ready.promise;
        return this.config;
    }

    async setConfiguration(config: Config): Promise<void> {
        await this.ready.promise;
        if (Config.sameAs(this.config, config)) {
            return;
        }
        let copyDefaultCliConfig: DefaultCliConfig | undefined = deepClone(this.cliConfig);
        if (!copyDefaultCliConfig) {
            copyDefaultCliConfig = await this.getFallbackCliConfig();
        }
        const { additionalUrls, dataDirUri, downloadsDirUri, sketchDirUri, network } = config;
        copyDefaultCliConfig.directories = {
            data: FileUri.fsPath(dataDirUri),
            downloads: FileUri.fsPath(downloadsDirUri),
            user: FileUri.fsPath(sketchDirUri)
        };
        copyDefaultCliConfig.board_manager = {
            additional_urls: [
                ...additionalUrls
            ]
        };
        const proxy = Network.stringify(network);
        copyDefaultCliConfig.network = { proxy };
        const { port } = copyDefaultCliConfig.daemon;
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

    async getVersion(): Promise<Readonly<{ version: string, commit: string, status?: string }>> {
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
            const content = await promisify(fs.readFile)(cliConfigPath, { encoding: 'utf8' });
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
        const throwawayDirPath = await new Promise<string>((resolve, reject) => {
            track.mkdir({}, (err, dirPath) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(dirPath);
            });
        });
        await spawnCommand(`"${cliPath}"`, ['config', 'init', '--dest-dir', `"${throwawayDirPath}"`]);
        const rawYaml = await promisify(fs.readFile)(path.join(throwawayDirPath, CLI_CONFIG), { encoding: 'utf-8' });
        const model = yaml.safeLoad(rawYaml.trim());
        return model as DefaultCliConfig;
    }

    protected async ensureCliConfigExists(): Promise<void> {
        const cliConfigFileUri = await this.getCliConfigFileUri();
        const cliConfigPath = FileUri.fsPath(cliConfigFileUri);
        let exists = await promisify(fs.exists)(cliConfigPath);
        if (!exists) {
            await this.initCliConfigTo(path.dirname(cliConfigPath));
            exists = await promisify(fs.exists)(cliConfigPath);
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
        const network = Network.parse(cliConfig.network?.proxy);
        return {
            dataDirUri: FileUri.create(data).toString(),
            sketchDirUri: FileUri.create(user).toString(),
            downloadsDirUri: FileUri.create(downloads).toString(),
            additionalUrls,
            network
        };
    }

    protected fireConfigChanged(config: Config): void {
        this.configChangeEmitter.fire(config);
        this.notificationService.notifyConfigChanged({ config });
    }

    protected fireInvalidConfig(): void {
        this.notificationService.notifyConfigChanged({ config: undefined });
    }

    protected async updateDaemon(port: string | number, config: DefaultCliConfig): Promise<void> {
        const client = this.createClient(port);
        const data = new RawData();
        const json = JSON.stringify(config, null, 2);
        data.setJsondata(json);
        console.log(`Updating daemon with 'data': ${json}`);
        return new Promise<void>((resolve, reject) => {
            client.merge(data, error => {
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
        req.setFilepath(cliConfigPath);
        return new Promise<void>((resolve, reject) => {
            client.write(req, error => {
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

    private createClient(port: string | number): SettingsClient {
        // https://github.com/agreatfool/grpc_tools_node_protoc_ts/blob/master/doc/grpcjs_support.md#usage
        // @ts-ignore
        const SettingsClient = grpc.makeClientConstructor(serviceGrpcPb['cc.arduino.cli.settings.Settings'], 'SettingsService') as any;
        return new SettingsClient(`localhost:${port}`, grpc.credentials.createInsecure()) as SettingsClient;
    }

}
