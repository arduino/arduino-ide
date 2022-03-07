import { Event, JsonRpcServer } from "@theia/core";
import { Board, Port } from './boards-service';

export const MonitorManagerProxyPath = '/services/monitor-manager-proxy';
export const MonitorManagerProxy = Symbol('MonitorManagerProxy');
export interface MonitorManagerProxy extends JsonRpcServer<MonitorManagerProxyClient> {
    startMonitor(board: Board, port: Port, settings?: MonitorSettings): Promise<void>;
    changeMonitorSettings(board: Board, port: Port, settings: MonitorSettings): Promise<void>;
    stopMonitor(board: Board, port: Port): Promise<void>;
    getSupportedSettings(protocol: string, fqbn: string): Promise<MonitorSettings>;
}

export const MonitorManagerProxyClient = Symbol('MonitorManagerProxyClient');
export interface MonitorManagerProxyClient {
    onWebSocketChanged: Event<number>;
    notifyWebSocketChanged(message: number): void;
}

export interface MonitorSetting {
    // The setting identifier
    readonly id: string;
    // A human-readable label of the setting (to be displayed on the GUI)
    readonly label: string;
    // The setting type (at the moment only "enum" is avaiable)
    readonly type: string;
    // The values allowed on "enum" types
    readonly values: string[];
    // The selected value
    selectedValue: string;
}

export type MonitorSettings = Record<string, MonitorSetting>;