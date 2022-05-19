import { injectable } from 'inversify';
import { CoreClientProvider } from '../core-client-provider';
import {
  PluggableMonitorSettings,
  MonitorSettingsProvider,
  MonitorSettings,
} from './monitor-settings-provider';

@injectable()
export class MonitorSettingsProviderImpl implements MonitorSettingsProvider {
  // this is populated with all settings coming from the CLI. This should never get modified
  // as it is used to double actual values set by the user
  private monitorSettings: MonitorSettings;

  // this contains values for setting of the monitorSettings
  // the key is MonitorSetting.id, the value  should be one of the MonitorSetting.values
  private monitorSettingsValues: Record<string, any>;

  init(
    id: string,
    coreClientProvider: CoreClientProvider
  ): Promise<PluggableMonitorSettings> {
    throw new Error('Method not implemented.');

    // 1. query the CLI (via coreClientProvider) and return all available settings for the pluggable monitor.
    // store these in `monitorSettings` for later checkings

    // 2. check for the settings file in the user's home directory
    //  a. if it doesn't exist, create it as an empty json file
    // 3. search the file, looking for the longest prefix matching the id
    //  a. miss: populate `monitorSettingsValues` with all default settings from `monitorSettings`
    //  b. hit: populate `monitorSettingsValues` with the result for the search
    //    i. purge the `monitorSettingsValues` removing keys that are not defined in `monitorSettings`
    //       and adding those that are missing
    //    ii. save the `monitorSettingsValues` in the file, using the id as the key
  }
  get(): Promise<PluggableMonitorSettings> {
    throw new Error('Method not implemented.');
  }
  set(settings: PluggableMonitorSettings): Promise<PluggableMonitorSettings> {
    throw new Error('Method not implemented.');

    // 1. parse the settings parameter and remove any setting that is not defined in `monitorSettings`
    // 2. update `monitorSettingsValues` accordingly
    // 3. save it to the file
  }
}
