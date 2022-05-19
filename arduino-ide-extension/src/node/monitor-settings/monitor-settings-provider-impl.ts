import { injectable } from 'inversify';
import { CoreClientProvider } from '../core-client-provider';
import {
  MonitorSettings,
  MonitorSettingsProvider,
} from './monitor-settings-provider';

@injectable()
export class MonitorSettingsProviderImpl implements MonitorSettingsProvider {
  init(
    id: string,
    coreClientProvider: CoreClientProvider
  ): Promise<MonitorSettings> {
    throw new Error('Method not implemented.');

    // query the CLI (via coreClientProvider) and return all available settings for the pluggable monitor.
    // store these for later checkings

    // check for the settings file in the user's home directory
    // if it doesn't exist, create it

    // if it does exist, start searching for the longest prefix matching the id

    // at the end of the search you can have a hit or a miss

    // if you have a miss, create a new entry with the id and all default settings coming from the CLI

    // if you have a hit, check if the existing settings are present in the settings from the CLI
    //  if they are not present in the CLI, remove from the settings file
    //  if there are settings in the CLI that are not in the file, add to the file with the default from the CLI
    // save the updated settings file
  }
  get(): Promise<MonitorSettings> {
    throw new Error('Method not implemented.');
  }
  set(settings: MonitorSettings): Promise<MonitorSettings> {
    throw new Error('Method not implemented.');
  }
}
