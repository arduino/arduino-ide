import * as fs from 'fs';
import { join } from 'path';
import {
  injectable,
  inject,
  postConstruct,
} from '@theia/core/shared/inversify';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { FileUri } from '@theia/core/lib/node/file-uri';
import { promisify } from 'util';
import {
  PluggableMonitorSettings,
  MonitorSettingsProvider,
} from './monitor-settings-provider';
import { Deferred } from '@theia/core/lib/common/promise-util';
import {
  longestPrefixMatch,
  reconcileSettings,
} from './monitor-settings-utils';
import { ILogger } from '@theia/core';

const MONITOR_SETTINGS_FILE = 'pluggable-monitor-settings.json';

@injectable()
export class MonitorSettingsProviderImpl implements MonitorSettingsProvider {
  @inject(EnvVariablesServer)
  protected readonly envVariablesServer: EnvVariablesServer;

  @inject(ILogger)
  protected logger: ILogger;

  // deferred used to guarantee file operations are performed after the service is initialized
  protected ready = new Deferred<void>();

  // this contains actual values coming from the stored file and edited by the user
  // this is a map with MonitorId as key and PluggableMonitorSetting as value
  private monitorSettings: Record<string, PluggableMonitorSettings>;

  // this is the path to the pluggable monitor settings file, set during init
  private pluggableMonitorSettingsPath: string;

  @postConstruct()
  protected async init(): Promise<void> {
    // get the monitor settings file path
    const configDirUri = await this.envVariablesServer.getConfigDirUri();
    this.pluggableMonitorSettingsPath = join(
      FileUri.fsPath(configDirUri),
      MONITOR_SETTINGS_FILE
    );

    // read existing settings
    await this.readSettingsFromFS();

    // init is done, resolve the deferred and unblock any call that was waiting for it
    this.ready.resolve();
  }

  async getSettings(
    monitorId: string,
    defaultSettings: PluggableMonitorSettings
  ): Promise<PluggableMonitorSettings> {
    // wait for the service to complete the init
    await this.ready.promise;

    const { matchingSettings } = this.longestPrefixMatch(monitorId);

    this.monitorSettings[monitorId] = this.reconcileSettings(
      matchingSettings,
      defaultSettings
    );
    return this.monitorSettings[monitorId];
  }

  async setSettings(
    monitorId: string,
    settings: PluggableMonitorSettings
  ): Promise<PluggableMonitorSettings> {
    // wait for the service to complete the init
    await this.ready.promise;

    const newSettings = this.reconcileSettings(
      settings,
      this.monitorSettings[monitorId] || {}
    );
    this.monitorSettings[monitorId] = newSettings;

    await this.writeSettingsToFS();
    return newSettings;
  }

  private reconcileSettings(
    newSettings: PluggableMonitorSettings,
    defaultSettings: PluggableMonitorSettings
  ): PluggableMonitorSettings {
    return reconcileSettings(newSettings, defaultSettings);
  }

  private async readSettingsFromFS(): Promise<void> {
    const rawJson = await promisify(fs.readFile)(
      this.pluggableMonitorSettingsPath,
      {
        encoding: 'utf8',
        flag: 'a+', // a+ = append and read, creating the file if it doesn't exist
      }
    );

    if (!rawJson) {
      this.monitorSettings = {};
    }

    try {
      this.monitorSettings = JSON.parse(rawJson);
    } catch (error) {
      this.logger.error(
        'Could not parse the pluggable monitor settings file. Using empty file.'
      );
      this.monitorSettings = {};
    }
  }

  private async writeSettingsToFS(): Promise<void> {
    await promisify(fs.writeFile)(
      this.pluggableMonitorSettingsPath,
      JSON.stringify(this.monitorSettings)
    );
  }

  private longestPrefixMatch(id: string): {
    matchingPrefix: string;
    matchingSettings: PluggableMonitorSettings;
  } {
    return longestPrefixMatch(id, this.monitorSettings);
  }
}
