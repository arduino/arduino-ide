import { PluggableMonitorSettings } from '../../common/protocol';

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
