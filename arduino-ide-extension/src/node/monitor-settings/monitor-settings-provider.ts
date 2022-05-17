import { MonitorSetting } from '../../common/protocol';
import { CoreClientProvider } from '../core-client-provider';

export type MonitorSettings = Record<string, MonitorSetting>;

export const MonitorSettingsProvider = Symbol('MonitorSettingsProvider');
export interface MonitorSettingsProvider {
  init(
    id: string,
    coreClientProvider: CoreClientProvider
  ): Promise<MonitorSettings>;
  get(): Promise<MonitorSettings>;
  set(settings: MonitorSettings): Promise<MonitorSettings>;
}
