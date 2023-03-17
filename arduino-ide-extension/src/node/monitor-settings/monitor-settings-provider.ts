import { MonitorState, PluggableMonitorSetting } from '../../common/protocol';

export type PluggableMonitorSettings = Record<string, PluggableMonitorSetting>;
export interface MonitorSettings {
  pluggableMonitorSettings?: PluggableMonitorSettings;
  monitorUISettings?: Partial<MonitorState>;
}

export const MonitorSettingsProvider = Symbol('MonitorSettingsProvider');
export interface MonitorSettingsProvider {
  getSettings(
    monitorId: string,
    defaultSettings: PluggableMonitorSettings
  ): Promise<PluggableMonitorSettings>;
  setSettings(
    monitorId: string,
    settings: PluggableMonitorSettings
  ): Promise<PluggableMonitorSettings>;
}
