import { MonitorModel } from '../../browser/monitor-model';
import { PluggableMonitorSetting } from '../../common/protocol';
import { CoreClientProvider } from '../core-client-provider';

export type PluggableMonitorSettings = Record<string, PluggableMonitorSetting>;
export interface MonitorSettings {
  pluggableMonitorSettings?: PluggableMonitorSettings;
  monitorUISettings?: Partial<MonitorModel.State>;
}

export const MonitorSettingsProvider = Symbol('MonitorSettingsProvider');
export interface MonitorSettingsProvider {
  init(
    id: string,
    coreClientProvider: CoreClientProvider
  ): Promise<PluggableMonitorSettings>;
  get(): Promise<PluggableMonitorSettings>;
  set(settings: PluggableMonitorSettings): Promise<PluggableMonitorSettings>;
}
