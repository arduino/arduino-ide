import * as fs from 'fs';
import { join } from 'path';
import { injectable, inject, postConstruct } from 'inversify';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { FileUri } from '@theia/core/lib/node/file-uri';
import { promisify } from 'util';

import {
  PluggableMonitorSettings,
  MonitorSettingsProvider,
} from './monitor-settings-provider';
import { Deferred } from '@theia/core/lib/common/promise-util';

const MONITOR_SETTINGS_FILE = 'pluggable-monitor-settings.json';

@injectable()
export class MonitorSettingsProviderImpl implements MonitorSettingsProvider {
  @inject(EnvVariablesServer)
  protected readonly envVariablesServer: EnvVariablesServer;

  protected ready = new Deferred<void>();

  // this is populated with all settings coming from the CLI. This should never be modified
  // // as it is used to double check the monitorSettings attribute
  // private monitorDefaultSettings: PluggableMonitorSettings;

  // this contains actual values coming from the stored file and edited by the user
  // this is a map with MonitorId as key and PluggableMonitorSetting as value
  private monitorSettings: Record<string, PluggableMonitorSettings>;

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
    this.readFile();

    console.log(this.monitorSettings);
    this.ready.resolve();
  }

  async getSettings(
    monitorId: string,
    defaultSettings: PluggableMonitorSettings
  ): Promise<PluggableMonitorSettings> {
    // wait for the service to complete the init
    await this.ready.promise;

    const { matchingSettings } = this.longestPrefixMatch(monitorId);

    return this.reconcileSettings(matchingSettings, defaultSettings);
  }
  async setSettings(
    monitorId: string,
    settings: PluggableMonitorSettings
  ): Promise<PluggableMonitorSettings> {
    // wait for the service to complete the init
    await this.ready.promise;

    const newSettings = this.reconcileSettings(
      settings,
      this.monitorSettings[monitorId]
    );
    this.monitorSettings[monitorId] = newSettings;

    await this.writeFile();
    return newSettings;
  }

  private reconcileSettings(
    newSettings: PluggableMonitorSettings,
    defaultSettings: PluggableMonitorSettings
  ): PluggableMonitorSettings {
    // TODO: implement
    return newSettings;
  }

  private async readFile(): Promise<void> {
    const rawJson = await promisify(fs.readFile)(
      this.pluggableMonitorSettingsPath,
      {
        encoding: 'utf-8',
        flag: 'a+', // a+ = append and read, creating the file if it doesn't exist
      }
    );

    if (!rawJson) {
      this.monitorSettings = {};
    }

    try {
      this.monitorSettings = JSON.parse(rawJson);
    } catch (error) {
      console.error(
        'Could not parse the pluggable monitor settings file. Using empty file.'
      );
      this.monitorSettings = {};
    }
  }

  private async writeFile() {
    await promisify(fs.writeFile)(
      this.pluggableMonitorSettingsPath,
      JSON.stringify(this.monitorSettings)
    );
  }

  private longestPrefixMatch(id: string): {
    matchingPrefix: string;
    matchingSettings: PluggableMonitorSettings;
  } {
    const separator = '-';
    const idTokens = id.split(separator);

    let matchingPrefix = '';
    let matchingSettings: PluggableMonitorSettings = {};

    const monitorSettingsKeys = Object.keys(this.monitorSettings);

    for (let i = 0; i < idTokens.length; i++) {
      const prefix = idTokens.slice(0, i + 1).join(separator);

      for (let k = 0; k < monitorSettingsKeys.length; k++) {
        if (monitorSettingsKeys[k].startsWith(prefix)) {
          matchingPrefix = prefix;
          matchingSettings = this.monitorSettings[monitorSettingsKeys[k]];
          break;
        }
      }

      if (matchingPrefix.length) {
        break;
      }
    }

    return { matchingPrefix, matchingSettings };
  }
}
