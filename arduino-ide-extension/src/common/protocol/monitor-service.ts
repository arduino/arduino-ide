import { Event, JsonRpcServer } from "@theia/core";
import { Board, Port } from './boards-service';

export const MonitorManagerProxyFactory = Symbol('MonitorManagerProxyFactory');
export type MonitorManagerProxyFactory = () => MonitorManagerProxy;

export const MonitorManagerProxyPath = '/services/monitor-manager-proxy';
export const MonitorManagerProxy = Symbol('MonitorManagerProxy');
export interface MonitorManagerProxy extends JsonRpcServer<MonitorManagerProxyClient> {
    startMonitor(board: Board, port: Port, settings?: MonitorSettings): Promise<void>;
    changeMonitorSettings(board: Board, port: Port, settings: MonitorSettings): Promise<void>;
    stopMonitor(board: Board, port: Port): Promise<void>;
    getCurrentSettings(board: Board, port: Port): MonitorSettings;
}

export const MonitorManagerProxyClient = Symbol('MonitorManagerProxyClient');
export interface MonitorManagerProxyClient {
    onMessagesReceived: Event<{ messages: string[] }>;
    connect(addressPort: number): void;
    disconnect(): void;
    getWebSocketPort(): number | undefined;
    isWSConnected(): Promise<boolean>;
    startMonitor(board: Board, port: Port, settings?: MonitorSettings): Promise<void>;
    getCurrentSettings(board: Board, port: Port): MonitorSettings;
    send(message: string): void;
    changeSettings(settings: MonitorSettings): void
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

export namespace Monitor {
    export enum Command {
        SEND_MESSAGE = 'MONITOR_SEND_MESSAGE',
        CHANGE_SETTINGS = 'MONITOR_CHANGE_SETTINGS',
    }

    export type Message = {
        command: Monitor.Command,
        data: string;
    }
}

export interface Status { }
export type OK = Status;
export interface ErrorStatus extends Status {
    readonly message: string;
}
export namespace Status {
    export function isOK(status: Status & { message?: string }): status is OK {
        return !!status && typeof status.message !== 'string';
    }
    export const OK: OK = {};
    export const NOT_CONNECTED: ErrorStatus = { message: 'Not connected.' };
    export const ALREADY_CONNECTED: ErrorStatus = {
        message: 'Already connected.',
    };
    export const CONFIG_MISSING: ErrorStatus = {
        message: 'Serial Config missing.',
    };
}
